// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDACBoGh3r4GhlKUrdlpeGmJ0wFUzhDqrM",
  authDomain: "smrbill-6ff9f.firebaseapp.com",
  projectId: "smrbill-6ff9f",
  storageBucket: "smrbill-6ff9f.firebasestorage.app", // ⚠️ fix typo: should be 'firebasestorage.googleapis.com'
  messagingSenderId: "1028606413720",
  appId: "1:1028606413720:web:acc250f02aee3bdd8379ed",
  measurementId: "G-JYTXH01J0Y",
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);

// Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: Analytics in supported environments
export const analytics = (async () =>
  (await isSupported()) ? getAnalytics(app) : null)();











