import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  onSnapshot, 
  getDocs, 
  limit, 
  query, 
  orderBy, 
  where, 
  deleteDoc, 
  updateDoc, 
  getDoc 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Helper functions for easy Firestore persistence
export { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  onSnapshot, 
  getDocs, 
  limit, 
  query, 
  orderBy, 
  where, 
  deleteDoc, 
  updateDoc, 
  getDoc,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
};
export type { User };
