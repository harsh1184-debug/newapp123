import { auth, provider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  return user;
};

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

