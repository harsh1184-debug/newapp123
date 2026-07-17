import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAU8jIwDFBBZe6BlpV6OA6I7MjXxDyr1ig",
  authDomain: "whatsapp-messanger-4ed64.firebaseapp.com",
  projectId: "whatsapp-messanger-4ed64",
  storageBucket: "whatsapp-messanger-4ed64.firebasestorage.app",
  messagingSenderId: "130641670855",
  appId: "1:130641670855:web:45d3fac15f1787b23d04e2",
  measurementId: "G-80FK31CPER",
  databaseURL: "https://whatsapp-messanger-4ed64-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
