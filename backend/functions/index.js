// functions/index.js
const functions = require("firebase-functions/v1"); // Gen1 compat import
const admin = require("firebase-admin");
admin.initializeApp();

const uid = "xsc6kGPbC4bU1HF9z2RlZnCEAtd2"; // replace with your Firebase Auth uid
admin.auth().setCustomUserClaims(uid, { role: 'guard' })
  .then(() => console.log("Custom claim set!"))
  .catch(console.error);
admin.initializeApp();

admin.initializeApp();

async function makeGuard(uid) {
  await admin.auth().setCustomUserClaims(uid, { role: 'guard' })
  .then(() => {
    // Token successfully updated
  });
  console.log("✅ Guard role set for:", uid);
}
// Simple health check
exports.ping = functions.https.onRequest((req, res) => {
  res.status(200).send("ok");
});

// Allowlist via .env -> ADMINS_EMAILS
function isAllowedEmail(email) {
  const csv = (process.env.ADMINS_EMAILS || "").toLowerCase();
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes((email || "").toLowerCase());
}

// Callable: set role: 'user' | 'guard'
exports.setUserRole = functions.https.onCall(async (data, context) => {
  const callerEmail =
    (context.auth && context.auth.token && context.auth.token.email) || null;
  if (!callerEmail || !isAllowedEmail(callerEmail)) {
    throw new functions.https.HttpsError("permission-denied", "Admin only.");
  }

  const uid = data && data.uid;
  const role = data && data.role; // 'user' | 'guard'
  if (!uid || !role) {
    throw new functions.https.HttpsError("invalid-argument", "uid and role required");
  }

  await admin.auth().setCustomUserClaims(uid, { role });
  await admin.auth().updateUser(uid, {}); // nudge token refresh
  return { ok: true };
});

// Default new users to role 'user'
exports.onCreateSetDefaultRole = functions.auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
});
