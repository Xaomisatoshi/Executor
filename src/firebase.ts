import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, onSnapshot, query, orderBy, limit, getDocFromServer, Timestamp, where } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer,
  Timestamp,
  where 
};
export type { User };

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Firebase connection error: Client is offline. Check configuration.");
    }
  }
}
testConnection();
