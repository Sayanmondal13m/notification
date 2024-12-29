import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import AuthScreen from './src/screens/AuthScreen';
import ChatScreen from './src/screens/ChatScreen';
import WebViewScreen from './src/screens/WebViewScreen';

const Stack = createStackNavigator();

export default function App() {
  // Configure how notifications are handled
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // Display notification as an alert
      shouldPlaySound: true, // Play notification sound
      shouldSetBadge: false, // Disable badge setting for notifications
    }),
  });

  useEffect(() => {
    // Foreground notification listener
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
    });

    // Background notification listener
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification clicked in background:', response);
      // Navigate to specific screens based on notification data if needed
      const screen = response.notification.request.content.data?.screen;
      const params = response.notification.request.content.data?.params;
      if (screen) {
        // You can navigate to the appropriate screen based on the notification data
        console.log('Navigate to:', screen, 'with params:', params);
      }
    });

    return () => {
      // Clean up listeners on component unmount
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH, // High importance for heads-up notifications
        sound: 'default', // Default notification sound
        vibrationPattern: [0, 250, 250, 250], // Optional vibration pattern
        lightColor: '#FF231F7C', // Optional light color for supported devices
      });
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ChatScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthScreen" component={AuthScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}