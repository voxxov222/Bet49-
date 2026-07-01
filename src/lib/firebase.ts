import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, onSnapshot, getDocs, limit, query, orderBy } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Helper functions for easy Firestore persistence
export { collection, addDoc, setDoc, doc, onSnapshot, getDocs, limit, query, orderBy };
