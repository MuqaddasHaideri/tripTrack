
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
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
                <Stack.Screen name="(auth)/signup" options={{ presentation: 'modal' }} />


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

// import { Stack, useRouter, useSegments } from 'expo-router';
// import { Provider, useDispatch, useSelector } from 'react-redux';
// import { store } from '../redux/store';
// import { useEffect } from 'react';
// import { loadUser } from '../redux/authSlice';
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { StatusBar } from 'expo-status-bar';
// import { useColorScheme, View, ActivityIndicator } from 'react-native';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// function AppWrapper() {
//   const colorScheme = useColorScheme();
//   const { user, isInitialized } = useSelector((state: any) => state.auth);
//   const segments = useSegments();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isInitialized) return;

//     const inAuthGroup = segments === '(auth)' || segments === 'onboarding';

//     if (!user) {
//       // If no user, keep them in Onboarding or Login
//       if (!inAuthGroup) {
//         router.replace('/onBoarding');
//       }
//     } else {
//       // If user is logged in, redirect them away from Auth screens based on Role
//       if (inAuthGroup) {
//         if (user.role === 'driver') {
//           router.replace('/driver/Map');
//         } else if (user.role === 'admin') {
//           // router.replace('/admin/dashboard'); // Future admin screen
//         } else {
//           router.replace('/(tabs)'); // For passengers
//         }
//       }
//     }
//   }, [user, isInitialized, segments]);

//   if (!isInitialized) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#021a11' }}>
//         <ActivityIndicator size="large" color="#00C853" />
//       </View>
//     );
//   }

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Stack screenOptions={{ headerShown: false }}>
//         {/* Public Screens */}
//         <Stack.Screen name="onBoarding" options={{ presentation: 'fullScreenModal' }} />
        
//         {/* Unified Auth Group */}
//         <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
//         <Stack.Screen name="(auth)/signup" options={{ animation: 'fade' }} />

//         {/* Passenger Main App */}
//         <Stack.Screen name="(tabs)" />

//         {/* Driver Specific Screens */}
//         <Stack.Screen name="driver/Map" options={{ gestureEnabled: false }} />

//         {/* Admin Screens (Add later) */}
//         {/* <Stack.Screen name="admin/dashboard" /> */}
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }

// function RootContent() {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(loadUser());
//   }, [dispatch]);

//   return <AppWrapper />;
// }

// const queryClient = new QueryClient();

// export default function RootLayout() {
//   return (
//     <Provider store={store}>
//       <QueryClientProvider client={queryClient}>
//         <RootContent />
//       </QueryClientProvider>
//     </Provider>
//   );
// }