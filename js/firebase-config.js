// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, query, where, getDocs }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmuBI5OUvncFbubsbtruPAdHW2DJVZ_YU",
  authDomain: "studytrack-d4c77.firebaseapp.com",
  projectId: "studytrack-d4c77",
  storageBucket: "studytrack-d4c77.firebasestorage.app",
  messagingSenderId: "1077170924400",
  appId: "1:1077170924400:web:3abb73b7a98204b2033db5",
  measurementId: "G-BG809JQ9N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export services to be used in script.js and other modules
export {
  auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, query, where, getDocs
};