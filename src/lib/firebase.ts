import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA648KsvHbPT9PnEIg1N0ZvgzPW4mYHqu8",
  authDomain: "punx-microlearning.firebaseapp.com",
  projectId: "punx-microlearning",
  storageBucket: "punx-microlearning.firebasestorage.app",
  messagingSenderId: "161893869198",
  appId: "1:161893869198:web:972d9712b588d046fccbdf"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});


export { app, auth, db, googleProvider };
