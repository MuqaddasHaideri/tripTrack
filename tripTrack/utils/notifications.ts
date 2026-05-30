import { Platform } from 'react-native';
import { registerFcmTokenApi } from '../service/server';

let Notifications: any = null;
let Device: any = null;
let Constants: any = null;
let modulesLoaded = false;

function isExpoGo(): boolean {
  try {
    const C = require('expo-constants');
    return C?.default?.appOwnership === 'expo' || C?.appOwnership === 'expo';
  } catch {
    return false;
  }
}

function loadModules() {
  if (modulesLoaded) return;
  modulesLoaded = true;

  if (isExpoGo()) {
    console.log('Running in Expo Go — push notifications are not supported (SDK 53+). Use a development build.');
    return;
  }

  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    Constants = require('expo-constants');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.log('expo-notifications not available:', (e as Error).message);
  }
}

export async function registerForPushNotifications(token: string): Promise<string | null> {
  loadModules();

  if (!Notifications) {
    console.log('Push notifications not available. Use a development build.');
    return null;
  }

  console.log('registerForPushNotifications called, isDevice:', Device?.isDevice);

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Current notification permission status:', existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('Requesting notification permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission after request:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission NOT granted');
      return null;
    }

    console.log('Notification permission GRANTED, getting token...');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TripTrack',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#196F31',
      });
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId
      ?? Constants?.easConfig?.projectId;

    const pushTokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    const expoPushToken = pushTokenResult.data;

    console.log('Expo Push Token:', expoPushToken);

    await registerFcmTokenApi(expoPushToken, token);

    return expoPushToken;
  } catch (error: any) {
    console.log('Push notification setup failed:', error.message);
    console.log('This is expected in Expo Go. Use a development build for push notifications.');
    return null;
  }
}

export function addNotificationReceivedListener(
  callback: (notification: any) => void
) {
  loadModules();
  if (!Notifications) return { remove: () => {} };
  try {
    return Notifications.addNotificationReceivedListener(callback);
  } catch {
    return { remove: () => {} };
  }
}

export function addNotificationResponseListener(
  callback: (response: any) => void
) {
  loadModules();
  if (!Notifications) return { remove: () => {} };
  try {
    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch {
    return { remove: () => {} };
  }
}
