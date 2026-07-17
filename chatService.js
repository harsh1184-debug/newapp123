import { db, rtdb } from "../firebase";
import { doc, setDoc, getDocs, collection, query, serverTimestamp } from "firebase/firestore";
import { ref, set, push, onValue, off, orderByChild, limitToLast, query as rtdbQuery } from "firebase/database";

// ─── USER PROFILES (Firestore) ───────────────────────────────
export const createUserProfile = async (user) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    displayName: user.displayName || "Anonymous",
    email: user.email,
    photoURL: user.photoURL || "",
    lastSeen: serverTimestamp(),
  }, { merge: true });
};

export const getAllUsers = async (currentUid) => {
  const q = query(collection(db, "users"));
  const snapshot = await getDocs(q);
  const users = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.uid !== currentUid) users.push({ ...data, id: docSnap.id });
  });
  return users;
};

// ─── CHAT FUNCTIONS (Realtime Database) ──────────────────────
const getChatId = (uid1, uid2) => [uid1, uid2].sort().join("_");

export const getOrCreateChat = async (currentUser, otherUser) => {
  return getChatId(currentUser.uid, otherUser.uid);
};

export const sendPrivateMessage = async (chatId, text, user, otherUser) => {
  if (text.trim() === "") return;

  const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
  const newMsgRef = push(messagesRef);
  await set(newMsgRef, {
    text,
    senderId: user.uid,
    senderName: user.displayName,
    senderAvatar: user.photoURL || "",
    createdAt: Date.now(),
  });

  // Update chat metadata
  await set(ref(rtdb, `chats/${chatId}/metadata`), {
    participants: {
      [user.uid]: user.displayName,
      [otherUser.uid]: otherUser.displayName,
    },
    participantAvatars: {
      [user.uid]: user.photoURL || "",
      [otherUser.uid]: otherUser.photoURL || "",
    },
    lastMessage: text,
    lastSenderId: user.uid,
    lastTimestamp: Date.now(),
  });

  // Index under each user's chat list
  await set(ref(rtdb, `userChats/${user.uid}/${chatId}`), true);
  await set(ref(rtdb, `userChats/${otherUser.uid}/${chatId}`), true);

  return newMsgRef.key;
};

export const subscribeToPrivateMessages = (chatId, callback) => {
  const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
  const q = rtdbQuery(messagesRef, orderByChild("createdAt"), limitToLast(100));

  const listener = onValue(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((childSnap) => {
      messages.push({ ...childSnap.val(), id: childSnap.key });
    });
    callback(messages.sort((a, b) => a.createdAt - b.createdAt));
  });

  return () => off(messagesRef, "value", listener);
};

export const subscribeToUserChats = (userId, callback) => {
  const userChatsRef = ref(rtdb, `userChats/${userId}`);

  const listener = onValue(userChatsRef, (snapshot) => {
    const chatIds = [];
    snapshot.forEach((childSnap) => {
      chatIds.push(childSnap.key);
    });

    if (chatIds.length === 0) {
      callback([]);
      return;
    }

    const chats = [];
    chatIds.forEach((chatId) => {
      const metaRef = ref(rtdb, `chats/${chatId}/metadata`);
      onValue(metaRef, (metaSnap) => {
        const meta = metaSnap.val();
        if (meta) {
          const existing = chats.findIndex(c => c.id === chatId);
          if (existing >= 0) {
            chats[existing] = { ...meta, id: chatId };
          } else {
            chats.push({ ...meta, id: chatId });
          }
          callback([...chats].sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0)));
        }
      }, { onlyOnce: true });
    });
  });

  return () => off(userChatsRef, "value", listener);
};