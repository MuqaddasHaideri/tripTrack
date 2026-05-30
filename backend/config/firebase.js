import admin from 'firebase-admin';

let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT not set — Firebase Admin SDK disabled');
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error.message);
}

export { firebaseInitialized };
export default admin;
