const admin = require("firebase-admin");
const serviceAccount = process.env.FIREBASE_CREDENTIALS
	? JSON.parse(process.env.FIREBASE_CREDENTIALS)
	: require("./firebase-credentials.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
