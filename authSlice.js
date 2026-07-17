import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { signInWithGoogle, logoutUser } from "../services/authService";
import { createUserProfile } from "../services/chatService";

export const loginUser = createAsyncThunk("auth/loginUser", async () => {
  const user = await signInWithGoogle();
  await createUserProfile(user);
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    role: "user",
  };
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await logoutUser();
});


const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
      })


      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
      })
      
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;