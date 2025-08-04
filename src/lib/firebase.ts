// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRLsuxwEAC4EV2Iq9iS_fKYIPM6S7LbkU",
  authDomain: "computer-classhub.firebaseapp.com",
  projectId: "computer-classhub",
  storageBucket: "computer-classhub.firebasestorage.app",
  messagingSenderId: "612390466146",
  appId: "1:612390466146:web:f470186f0450833c82d73b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
