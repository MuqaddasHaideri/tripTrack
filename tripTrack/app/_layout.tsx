
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../redux/store'; 
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from '../redux/authSlice';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function AppWrapper() {
   const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
                   <Stack.Screen name="onBoarding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
     

        <Stack.Screen name="driver/login" options={{ presentation: 'modal' }} />
               <Stack.Screen name="driver/Map" options={{ presentation: 'modal' }} />
              <Stack.Screen name="passenger/login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="passenger/signup" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="passenger/schedule" options={{ presentation: 'modal' }} />
      </Stack>
           <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function RootContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser()); 
  }, [dispatch]);

  return <AppWrapper />;
}

export default function RootLayout() {
  const queryClient = new QueryClient();
  return (
   
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
      <RootContent />
      </QueryClientProvider>
    </Provider>
  );
}