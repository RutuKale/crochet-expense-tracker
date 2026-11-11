import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Read configuration from Vite environment with direct fallback to crochet-business-manager project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDlQ3V7zAjL7nNL4ezeZaOjmnUrjykS8QM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "crochet-business-manager.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "crochet-business-manager",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "crochet-business-manager.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "60177021242",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:60177021242:web:9de7c1e08726adbb78f803",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YX1JSCCTLE",
};

// Check if credentials are meaningfully configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Optional emulator support for local testing
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectStorageEmulator(storage, 'localhost', 9199);
      } catch (err) {
        console.warn('Firebase emulator connection note:', err.message);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
}

export { app, auth, db, storage, firebaseConfig };
