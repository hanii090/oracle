import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = 
  !!firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'your-project-id' &&
  firebaseConfig.projectId !== 'your_project_id';

const app = isFirebaseConfigured 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

let firestoreDb = null;
if (app) {
  try {
    firestoreDb = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true
    });
  } catch (e) {
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;
export const auth = app ? getAuth(app) : null;
