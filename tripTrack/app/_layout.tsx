import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '../redux/store';
import { useEffect } from 'react';
import { loadUser } from '../redux/authSlice';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function AppWrapper() {
  const colorScheme = useColorScheme();


  const { user, isGuest, isInitialized } = useSelector((state: any) => state.auth);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;


     const inAuthGroup = segments.includes('(auth)') || segments.includes('onBoarding');
    const inAdminGroup = segments.includes('(admin)');
    const inPassengerGroup = segments.includes('(tabs)') || segments.includes('passenger');
    const inPendingApproval = segments.includes('driver');

    if (!user && !isGuest) {
      if (!inAuthGroup && !inPendingApproval) {
        router.replace('/onBoarding');
      }
    }


    if (user && user.role === 'admin') {
      if (inAuthGroup || inPassengerGroup || !inAdminGroup) {
        router.replace('/(admin)/dashboard');
      }
      return;
    }

    if (user && user.role !== 'admin') {
      // Keep passengers out of auth or admin screens
      if (inAuthGroup || inAdminGroup) {
        router.replace('/(tabs)');
      }
      return;
    }

   const inProtectedPassengerScreen =
  segments.includes('profileScreen') ||
  segments.includes('report-issue') ||
  segments.includes('favouriteRoutes');

if (isGuest && inProtectedPassengerScreen) {
  router.replace('/(tabs)');
  return;
}

    //  GUEST USER
    // if (isGuest) {
    //   if (inAuthGroup) {
    //     router.replace('/(tabs)');
    //   }
    // }

  }, [user, isGuest, isInitialized, segments]);

  //Loader while restoring
  if (!isInitialized) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F9F4'
      }}>
        <ActivityIndicator size="large" color="#196F31" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>

        <Stack.Screen name="onBoarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="driver/Map" />
        <Stack.Screen name="driver/PendingApproval" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="passenger/schedule" options={{ presentation: 'modal' }} />
 <Stack.Screen name="passenger/profileScreen" options={{ presentation: 'modal' }} />
         <Stack.Screen name="passenger/report-issue" options={{ presentation: 'modal' }} />
         <Stack.Screen name="passenger/favouriteRoutes" options={{ presentation: 'modal' }} />
        <Stack.Screen name="passenger/announcements" options={{ presentation: 'modal' }} />
<Stack.Screen name="(admin)" options={{ animation: 'slide_from_right' }} />
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

//   const { user, isGuest, isInitialized } = useSelector((state: any) => state.auth);

//   const segments = useSegments();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isInitialized) return;

//     const inAuthGroup =
//       segments.includes('(auth)') || segments.includes('onBoarding');

//     // NOT LOGGED IN & NOT GUEST 
//     if (!user && !isGuest) {
//       if (!inAuthGroup) {
//         router.replace('/onBoarding');
//       }
//     }

//     // LOGGEDIN USER
//     if (user) {
//       if (inAuthGroup) {
//           router.replace('/(tabs)');
        
//       }
//     }

//     //  GUEST USER
//     // if (isGuest) {
//     //   if (inAuthGroup) {
//     //     router.replace('/(tabs)');
//     //   }
//     // }

//   }, [user, isGuest, isInitialized, segments]);

//   //Loader while restoring
//   if (!isInitialized) {
//     return (
//       <View style={{
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#F0F9F4'
//       }}>
//         <ActivityIndicator size="large" color="#196F31" />
//       </View>
//     );
//   }

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Stack screenOptions={{ headerShown: false }}>

//         <Stack.Screen name="onBoarding" options={{ animation: 'fade' }} />
//         <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
//         <Stack.Screen name="(tabs)" />
//         <Stack.Screen name="driver/Map" />
//         <Stack.Screen name="passenger/schedule" options={{ presentation: 'modal' }} />
//  <Stack.Screen name="passenger/profileScreen" options={{ presentation: 'modal' }} />
//          <Stack.Screen name="passenger/report-issue" options={{ presentation: 'modal' }} />
//          <Stack.Screen name="passenger/favouriteRoutes" options={{ presentation: 'modal' }} />

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

// export default function RootLayout() {
//   const queryClient = new QueryClient();

//   return (
//     <Provider store={store}>
//       <QueryClientProvider client={queryClient}>
//         <RootContent />
//       </QueryClientProvider>
//     </Provider>
//   );
// }