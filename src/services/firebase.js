import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
// Supports Vite environment variables (VITE_FIREBASE_*) with default fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyARcq7z2H14rHdx0YapnsWKvRC07-_BDu8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "faultlens.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "faultlens",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "faultlens.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "732451635784",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:732451635784:web:11914912a6767c66878e7d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JEV53CNG7T"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Analytics if supported in the execution environment
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { signInWithPopup };
export default app;
