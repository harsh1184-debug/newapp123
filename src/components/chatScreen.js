import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { setActiveChat, setMessages, setConversations, setAllUsers, clearActiveChat } from '../redux/chatSlice';
import { Box, Typography, TextField, Avatar, IconButton, InputAdornment } from '@mui/material';
import { Logout, Search, AddComment, MoreVert, Send, ArrowBack, EmojiEmotions, Add, Mic } from '@mui/icons-material';
import { subscribeToAllUsers, getOrCreateChat, sendPrivateMessage, subscribeToPrivateMessages, subscribeToUserChats } from '../services/chatService';

function ChatScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { conversations, activeChatId, activeChatUser, messages, allUsers } = useSelector((state) => state.chat);
  const [typedMessage, setTypedMessage] = useState("");
  const [view, setView] = useState("users");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToAllUsers(user.uid, (users) => {
      dispatch(setAllUsers(users));
    });
    return unsubscribe;
  }, [user, dispatch]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserChats(user.uid, (chats) => {
      dispatch(setConversations(chats));
    });
    return () => unsubscribe();
  }, [user, dispatch]);

  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = subscribeToPrivateMessages(activeChatId, (msgs) => {
      dispatch(setMessages(msgs));
    });
    return () => unsubscribe();
  }, [activeChatId, dispatch]);

  const handleUserClick = useCallback(async (otherUser) => {
    if (!user) return;
    const chatId = await getOrCreateChat(user, otherUser);
    dispatch(setActiveChat({ chatId, user: otherUser }));
    setView("chat");
  }, [user, dispatch]);

  const handleSend = async () => {
    console.log("handleSend triggered:", {
      typedMessage: typedMessage.trim(),
      activeChatId,
      userUid: user?.uid,
      activeChatUserUid: activeChatUser?.uid
    });
    if (typedMessage.trim() && activeChatId && user && activeChatUser) {
      try {
        await sendPrivateMessage(activeChatId, typedMessage, user, activeChatUser);
        console.log("Message sent successfully!");
        setTypedMessage('');
      } catch (err) {
        console.error("Failed to send message:", err);
        alert("Failed to send message: " + err.message + "\n\nNote: If this is a 'Permission denied' error, please verify that your Firebase Realtime Database Security Rules allow read/write access for authenticated users.");
      }
    } else {
      console.warn("handleSend blocked due to missing fields:", {
        hasText: !!typedMessage.trim(),
        hasChatId: !!activeChatId,
        hasUser: !!user,
        hasActiveChatUser: !!activeChatUser
      });
    }
  };

  const handleBack = () => {
    dispatch(clearActiveChat());
    setView("users");
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#111' }}>
      <Box sx={{ display: 'flex', flex: 1, height: '100%' }}>
        {/* Left Sidebar */}
        <Box sx={{
          width: view === "chat" ? { xs: 0, md: 350 } : 350,
          borderRight: '1px solid #2a2a2a', bgcolor: '#151717',
          display: 'flex', flexDirection: 'column', height: '100%',
          overflow: { xs: view === "chat" ? 'hidden' : 'visible', md: 'visible' }, flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#151717' }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>WhatsApp</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: '#fff' }}><AddComment /></IconButton>
              <IconButton sx={{ color: '#fff' }} onClick={() => dispatch(logout())}><Logout /></IconButton>
            </Box>
          </Box>

          <Box sx={{ px: 2, pt: 0, pb: 1, bgcolor: '#151717' }}>
            <TextField fullWidth size="small" placeholder="Search users..." variant="outlined"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: '#888', fontSize: "20px" }} /></InputAdornment> } }}
              sx={{
                '& .MuiInputBase-root': { backgroundColor: '#303131', borderRadius: '50px', color: '#fff' },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiInputBase-input': { fontSize: '14px' },
                '& .MuiInputBase-input::placeholder': { color: '#AFAFAF', opacity: 1, fontSize: "14px" },
              }}
            />
          </Box>

          <Box sx={{
            flex: 1, overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#555', borderRadius: '10px' },
          }}>
            <Typography variant="subtitle2" sx={{ color: '#888', px: 2, py: 1 }}>ALL USERS</Typography>
            {allUsers.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#666', px: 2, py: 2, textAlign: 'center' }}>
                No other users found. Share this app with others!
              </Typography>
            ) : (
              allUsers.map((u) => {
                const conv = conversations.find((c) => c.participants && Object.keys(c.participants).includes(u.uid));
                const lastMsg = conv?.lastMessage || "Click to start chatting";
                return (
                  <Box key={u.uid} onClick={() => handleUserClick(u)}
                    sx={{
                      p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                      bgcolor: activeChatUser?.uid === u.uid ? '#303131' : '#151717',
                      '&:hover': { bgcolor: '#252525' },
                    }}
                  >
                    <Avatar src={u.photoURL || ""} sx={{ bgcolor: '#075E54' }}>{getInitials(u.displayName)}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>{u.displayName}</Typography>
                      <Typography variant="body2" sx={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg}</Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{
          flex: 1, flexDirection: 'column', bgcolor: '#1a1a1a', height: '100%',
          display: { xs: view === "chat" ? 'flex' : 'none', md: 'flex' },
        }}>
          {activeChatUser ? (
            <>
              <Box sx={{ p: 2, bgcolor: '#151717', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <IconButton sx={{ color: '#fff', display: { md: 'none' } }} onClick={handleBack}><ArrowBack /></IconButton>
                <Avatar src={activeChatUser.photoURL || ""} sx={{ bgcolor: '#075E54' }}>{getInitials(activeChatUser.displayName)}</Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', lineHeight: 1.2 }}>{activeChatUser.displayName}</Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>Online</Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#ffffff99' }}><MoreVert /></IconButton>
              </Box>

              <Box sx={{
                flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5,
                backgroundImage: `url("https://i.pinimg.com/564x/d3/6b/cc/d36bcceceaa1d390489ec70d93154311.jpg")`,
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#555', borderRadius: '10px' },
              }}>
                {messages.length === 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <Typography variant="body1" sx={{ color: '#888' }}>Send a message to start chatting</Typography>
                  </Box>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ bgcolor: isMe ? '#075E54' : '#2a2a2a', p: 1.5, borderRadius: 2, maxWidth: '60%', boxShadow: 1 }}>
                        {!isMe && <Typography variant="caption" sx={{ color: '#0bc', display: 'block', mb: 0.5 }}>{msg.senderName}</Typography>}
                        <Typography variant="body2" sx={{ color: '#fff' }}>{msg.text}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ p: 2, bgcolor: '#151717', display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
                <TextField fullWidth size="small" placeholder="Type a message"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconButton size="small" sx={{ color: '#888', p: 0.2 }}>
                            <EmojiEmotions fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#888', p: 0.2 }}>
                            <Add fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" sx={{ color: '#888', p: 0.2 }}>
                            <Mic fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { bgcolor: '#303131', borderRadius: '50px', color: '#fff', pl: 1.5, pr: 1.5 },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiInputBase-input::placeholder': { color: '#888', opacity: 1 },
                  }}
                />
                <IconButton sx={{ color: '#fff', bgcolor: '#075E54', borderRadius: '50%', p: 1.5, '&:hover': { bgcolor: '#055242' } }} onClick={handleSend}>
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666' }}>Select a user to start chatting</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ChatScreen;