// functions/src/index.ts  (Firebase Functions v2)
import * as admin from "firebase-admin";
admin.initializeApp();

const db = admin.firestore();
const fcm = admin.messaging();

/* ----------------- Helpers you already wrote (kept/merged) ----------------- */
function mapUrl(lat?: number, lng?: number) {
  if (typeof lat !== "number" || typeof lng !== "number") return "";
  return `https://maps.google.com/?q=${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function fmtTime(ts?: admin.firestore.Timestamp) {
  const d = (ts ?? admin.firestore.Timestamp.now()).toDate();
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mon}-${yyyy} ${hh}:${mm}`;
}

function closeContactMsg(params: { studentName: string; lat?: number; lng?: number; timeText: string; }) {
  const url = mapUrl(params.lat, params.lng);
  return [
    `Hi, this is the Ruff safety app.`,
    `${params.studentName} may need help.`,
    ``,
    `Last known location: ${url || "Unavailable"}`,
    `Time: ${params.timeText}`,
    ``,
    `Their data connection dropped — please try calling them.`,
    `If urgent, contact campus security.`
  ].join("\n");
}

function guardMsg(params: { studentName: string; studentIdNo?: string; lat?: number; lng?: number; timeText: string; }) {
  const url = mapUrl(params.lat, params.lng);
  return [
    `Ruff SOS Alert`,
    `User: ${params.studentName}${params.studentIdNo ? " (ID: "+params.studentIdNo+")" : ""}`,
    `GPS Location: ${typeof params.lat==="number"&&typeof params.lng==="number" ? `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}` : "Unavailable"}`,
    `Map: ${url || "Unavailable"}`,
    `Time: ${params.timeText}`,
    ``,
    `Data connection lost.`,
    `This is an automated SOS beacon from the Ruff Campus Safety App.`,
    `Please dispatch help or attempt to contact the user immediately.`
  ].join("\n");
}

// One MessageBird outbox doc per SMS
async function writeSms(to: string, text: string, sosId: string, audience: "guard"|"close_contact") {
  await db.collection("mb_outbox").add({
    to,
    from: "55cea02b-8a08-502e-a77d-8c912a31834f", // TODO: your MessageBird SMS channelId
    type: "text",
    content: { text },
    tag: "sos",
    meta: { sosId, audience },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function listOnDutyGuards(campusId?: string) {
  let q: FirebaseFirestore.Query = db.collection("users").where("role","==","guard").where("isOnDuty","==",true);
  if (campusId) q = q.where("campusId","==",campusId);
  const snap = await q.get();
  return snap.docs.map(d => ({
    uid: d.id,
    phone: d.get("phone") as string | undefined,
    email: d.get("email") as string | undefined
  }));
}

async function listCloseContacts(studentUid: string) {
  const snap = await db.collection("users").doc(studentUid).collection("close_contacts").get();
  return snap.docs.map(d => ({ phone: d.get("phone") as string | undefined }));
}

async function listGuardFcmTokens(guardUids: string[]) {
  const tokenIds: string[] = [];
  for (const uid of guardUids) {
    const toks = await db.collection("users").doc(uid).collection("fcmTokens").get();
    tokenIds.push(...toks.docs.map(d => d.id));
  }
  // de-dupe
  return Array.from(new Set(tokenIds)).filter(Boolean);
}

/* -------------------------- onCreate (FCM → SMS) --------------------------- */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";
setGlobalOptions({ region: "us-central1", maxInstances: 20 }); // tweak as needed

export const onSOSCreated = onDocumentCreated("sos_requests/{sosId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const sos = snap.data();
  const sosId = event.params.sosId;

  // student identity
  let studentName = (sos.studentName as string) || "";
  let studentIdNo = (sos.studentIdNo as string) || undefined;
  const studentUid = (sos.userId ?? sos.createdBy) as string | undefined;

  if ((!studentName || !studentIdNo) && studentUid) {
    const userDoc = await db.collection("users").doc(studentUid).get();
    if (!studentName) studentName = (userDoc.get("studentName") as string) || (userDoc.get("name") as string) || "The user";
    if (!studentIdNo) studentIdNo = userDoc.get("studentIdNo") as string | undefined;
  }
  if (!studentName) studentName = "The user";

  const lat = sos.location?.lat as number | undefined;
  const lng = sos.location?.lng as number | undefined;
  const timeText = fmtTime(sos.createdAt as admin.firestore.Timestamp | undefined);

  // Build SMS bodies (only used if FCM fails)
  const ccText = closeContactMsg({ studentName, lat, lng, timeText });
  const gdText = guardMsg({ studentName, studentIdNo, lat, lng, timeText });

  // Get on-duty guards and their device tokens
  const guards = await listOnDutyGuards(sos.campusId as string | undefined);
  const guardUids = guards.map(g => g.uid);
  const tokens = await listGuardFcmTokens(guardUids);

  // If there are tokens, try FCM first
  let delivered = 0;
  if (tokens.length > 0) {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      data: {
        type: "SOS",
        sosId,
        userName: studentName,
        lat: typeof lat === "number" ? String(lat) : "",
        lng: typeof lng === "number" ? String(lng) : "",
        deeplink: `ruff://sos/${sosId}`,
      },
      notification: {
        title: "Ruff SOS Alert",
        body: `${studentName} needs help`,
      },
      android: { priority: "high" },
      apns: { headers: { "apns-priority": "10" } },
    };
    const res = await fcm.sendEachForMulticast(message);
    delivered = res.responses.filter(r => r.success).length;
  }

  // If FCM delivered to 0 targets → SMS fallback (guards + optional close contacts)
  if (delivered === 0) {
    const guardPhones = guards.map(g => g.phone).filter(Boolean).slice(0, 10) as string[];
    const contacts = studentUid ? await listCloseContacts(studentUid) : [];
    const contactPhones = contacts.map(c => c.phone).filter(Boolean).slice(0, 5) as string[];

    await Promise.all([
      ...guardPhones.map(p => writeSms(p, gdText, sosId, "guard")),
      ...contactPhones.map(p => writeSms(p, ccText, sosId, "close_contact")),
    ]);

    await snap.ref.update({
      smsFanout: {
        guards: guardPhones.length,
        contacts: contactPhones.length,
        at: admin.firestore.FieldValue.serverTimestamp()
      }
    });
  }
});

/* ----------------------------- acceptSOS callable -------------------------- */
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const acceptSOS = onCall(async (req) => {
  const ctx = req.auth;
  if (!ctx) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = ctx.uid;
  const isGuard = (ctx.token as any)?.role === "guard";
  if (!isGuard) {
    throw new HttpsError("permission-denied", "Only guards can accept.");
  }

  const sosId = String((req.data?.sosId ?? "") as string);
  if (!sosId) {
    throw new HttpsError("invalid-argument", "Missing sosId.");
  }

  const sosRef = db.collection("sos_requests").doc(sosId);
  const pairingRef = db.collection("pairings").doc();

  await db.runTransaction(async (tx) => {
    const sosSnap = await tx.get(sosRef);
    if (!sosSnap.exists) throw new HttpsError("not-found", "SOS not found.");
    const sos = sosSnap.data()!;
    if (sos.status !== "open") {
      throw new HttpsError("failed-precondition", "Already accepted/resolved.");
    }

    tx.update(sosRef, {
      status: "accepted",
      acceptedBy: uid,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(pairingRef, {
      sosId,
      studentId: sos.userId ?? sos.createdBy ?? null,
      guardId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "active",
    });
  });

  return { ok: true };
});
