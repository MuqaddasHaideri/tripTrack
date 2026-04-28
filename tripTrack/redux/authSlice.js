import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const user = await AsyncStorage.getItem('userInfo');
    const isGuest = await AsyncStorage.getItem('isGuest');

    if (isGuest === 'true') {
      return { isGuest: true };
    }

    //  Logged-in user session
    if (token && user) {
      return {
        token,
        user: JSON.parse(user),
        isGuest: false,
      };
    }

  } catch (e) {
    console.error('Failed to load user', e);
  }

  //  Default (not logged in, not guest)
  return { isGuest: false };
});


const authSlice = createSlice({
  name: 'auth',

  initialState: {
    user: null,
    token: null,
    isGuest: false,       //  KEY ADDITION
    isInitialized: false, //  IMPORTANT FOR LOADER
  },

  reducers: {
updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        AsyncStorage.setItem('userInfo', JSON.stringify(state.user));
      }
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;

      state.user = user;
      state.token = token;
      state.isGuest = false;

     
      AsyncStorage.setItem('userToken', token);
      AsyncStorage.setItem('userInfo', JSON.stringify(user));
      AsyncStorage.removeItem('isGuest'); 
    },

    
    continueAsGuest: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = true;
      AsyncStorage.setItem('isGuest', 'true');
      AsyncStorage.removeItem('userToken');
      AsyncStorage.removeItem('userInfo');
    },
deleteAccount: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = false;
      
      // Clear all persistent data
      AsyncStorage.removeItem('userToken');
      AsyncStorage.removeItem('userInfo');
      AsyncStorage.removeItem('isGuest');
      // If you stored an onboarding flag, you might want to keep that 
      // so they don't see onboarding again, just the login.
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = false;

      // Clear storage
      AsyncStorage.removeItem('userToken');
      AsyncStorage.removeItem('userInfo');
      AsyncStorage.removeItem('isGuest');
    },
    
  },

 
  extraReducers: (builder) => {
    builder.addCase(loadUser.fulfilled, (state, action) => {

      if (action.payload?.isGuest) {
        state.isGuest = true;
      } else if (action.payload?.user) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isGuest = false;
      }

      state.isInitialized = true;
    });
  },
});

export const {
  setCredentials,
  continueAsGuest, 
  logout,
  updateUser,
  deleteAccount
} = authSlice.actions;

export default authSlice.reducer;