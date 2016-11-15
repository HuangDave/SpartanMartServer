
const admin = require("firebase-admin")
const serviceAccount = require("./config.json").firebase

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://spartanmart-5c83e.firebaseio.com/"
})
