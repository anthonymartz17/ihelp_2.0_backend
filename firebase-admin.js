const admin = require("firebase-admin");
const serviceAccount = import.meta.env.FIREBASE_CREDENTIALS
	? JSON.parse(import.meta.env.FIREBASE_CREDENTIALS)
	: require("./firebase-credentials.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
