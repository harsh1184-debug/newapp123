import { createSlice } from '@reduxjs/toolkit';
import { chatsData } from '../chatData';

const initialState = {
  chats: chatsData,
  conversations:[],
  activeChatId: null,
  activeChatUser: null,
  messages: [],
  allUsers: [],
  loading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state,action)=>{
      state.conversations = action.payload;
    },
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload.chatId;
      state.activeChatUser = action.payload.user;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setAllUsers :(state,action) =>{
      state.allUsers = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearActiveChat:(state) =>{
      state.activeChatId = null;
      state.activeChatUser = null;
      state.messages = [];
    },
  },
});

export const { setConversations, setActiveChat, setMessages,setAllUsers, clearActiveChat, setLoading } = chatSlice.actions;
export default chatSlice.reducer;
