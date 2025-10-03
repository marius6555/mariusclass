
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyA47BDFuoP_tfv7iORZfEdB09aE0siey7Q",
  authDomain: "computerclass-a8f5a.firebaseapp.com",
  projectId: "computerclass-a8f5a",
  storageBucket: "computerclass-a8f5a.firebasestorage.app",
  messagingSenderId: "86451387343",
  appId: "1:86451387343:web:f0d0664108778dc3b570ba"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
