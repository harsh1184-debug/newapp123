import { db, rtdb } from "../firebase";
import { doc, setDoc, getDocs, collection, query, serverTimestamp, onSnapshot } from "firebase/firestore";
import { ref, set, push, onValue, orderByChild, limitToLast, query as rtdbQuery } from "firebase/database";

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
    const uid = data.uid || docSnap.id;
    if (uid !== currentUid) {
      const lastSeen = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : (data.lastSeen || null);
      users.push({ ...data, uid, id: docSnap.id, lastSeen });
    }
  });
  return users;
};

export const subscribeToAllUsers = (currentUid, callback) => {
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    const users = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = data.uid || docSnap.id;
      if (uid !== currentUid) {
        const lastSeen = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : (data.lastSeen || null);
        users.push({ ...data, uid, id: docSnap.id, lastSeen });
      }
    });
    callback(users);
  });
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
    senderName: user.displayName || "Anonymous",
    senderAvatar: user.photoURL || "",
    createdAt: Date.now(),
  });

  // Update chat metadata
  await set(ref(rtdb, `chats/${chatId}/metadata`), {
    participants: {
      [user.uid]: user.displayName || "Anonymous",
      [otherUser.uid]: otherUser.displayName || "Anonymous",
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

  return onValue(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((childSnap) => {
      messages.push({ ...childSnap.val(), id: childSnap.key });
    });
    callback(messages.sort((a, b) => a.createdAt - b.createdAt));
  });
};

export const subscribeToUserChats = (userId, callback) => {
  const userChatsRef = ref(rtdb, `userChats/${userId}`);
  const activeListeners = new Map(); // chatId -> unsubscribeFunction
  const chatsMap = new Map(); // chatId -> chatMetadata

  const unsubscribeUserChats = onValue(userChatsRef, (snapshot) => {
    const currentChatIds = new Set();
    snapshot.forEach((childSnap) => {
      currentChatIds.add(childSnap.key);
    });

    // Unsubscribe from any chats that are no longer in the user's chat list
    for (const chatId of activeListeners.keys()) {
      if (!currentChatIds.has(chatId)) {
        if (typeof activeListeners.get(chatId) === "function") {
          activeListeners.get(chatId)();
        }
        activeListeners.delete(chatId);
        chatsMap.delete(chatId);
      }
    }

    if (currentChatIds.size === 0) {
      callback([]);
      return;
    }

    // Subscribe to new chats
    currentChatIds.forEach((chatId) => {
      if (!activeListeners.has(chatId)) {
        const metaRef = ref(rtdb, `chats/${chatId}/metadata`);
        const unsubMeta = onValue(metaRef, (metaSnap) => {
          const meta = metaSnap.val();
          if (meta) {
            chatsMap.set(chatId, { ...meta, id: chatId });
          } else {
            chatsMap.delete(chatId);
          }
          // Emit the sorted chats
          const chatsList = Array.from(chatsMap.values());
          callback(chatsList.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0)));
        });
        activeListeners.set(chatId, unsubMeta);
      }
    });
  });

  return () => {
    unsubscribeUserChats();
    activeListeners.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
    activeListeners.clear();
  };
};