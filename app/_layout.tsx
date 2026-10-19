import React from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppProvider } from '../context/AppContext';

// רישום הטיפול בהתראות בשורש המערכת
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}