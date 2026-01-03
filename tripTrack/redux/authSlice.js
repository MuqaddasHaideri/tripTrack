import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const user = await AsyncStorage.getItem('userInfo');
    if (token && user) {
      return { token, user: JSON.parse(user) };
    }
  } catch (e) {
    console.error("Failed to load user", e);
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isInitialized: false, 
  },
  reducers: {

    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      AsyncStorage.setItem('userToken', token);
      AsyncStorage.setItem('userInfo', JSON.stringify(user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      AsyncStorage.removeItem('userToken');
      AsyncStorage.removeItem('userInfo');
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadUser.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
      }
      state.isInitialized = true;
    });
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;