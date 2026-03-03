import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDIeyQd3FkdY75TDetymCW4_uRqAHHwWng",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "oracleai-bc1cc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "oracleai-bc1cc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oracleai-bc1cc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1091676258967",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1091676258967:web:4427dc1ba123402baf5fd2"
};

export const isFirebaseConfigured = 
  !!firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'your-project-id' &&
  firebaseConfig.projectId !== 'your_project_id';

const app = isFirebaseConfigured 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
