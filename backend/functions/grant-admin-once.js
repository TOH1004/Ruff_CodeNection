// functions/grant-admin-once.js
const admin = require("firebase-admin");

// If you set GOOGLE_APPLICATION_CREDENTIALS, this is enough:
admin.initializeApp({
  // projectId helps in some environments; replace with your actual ID:
  projectId: "ruff-7d37f",
});

const uid = process.argv[2];
if (!uid) {
  console.error("Usage: node grant-admin-once.js <UID>");
  process.exit(1);
}

admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Admin granted to", uid);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
