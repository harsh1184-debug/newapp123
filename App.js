import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAuthChange } from "./services/authService";
import { setUser } from "./redux/authSlice";
import { createUserProfile } from "./services/chatService";
import AuthScreen from "./components /authScreen";
import ChatScreen from "./components /chatScreen";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        const { uid, displayName, email, photoURL } = firebaseUser;
        dispatch(setUser({ uid, displayName, email, photoURL, role: "user" }));
        // Save user profile to Firestore so others can find them
        createUserProfile(firebaseUser);
      } else {
        dispatch(setUser(null));
      }
    });
    return () => unsubscribe;
  }, [dispatch]);

  return isAuthenticated ? <ChatScreen /> : <AuthScreen />;
}

export default App;
