import messaging from '@react-native-firebase/messaging';

// Request Notification Permission
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// Get FCM Token
export async function getToken(username) {
  try {
    const token = await messaging().getToken();
    await fetch('https://rust-mammoth-route.glitch.me/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, token }),
    });
  } catch (error) {
    console.error('FCM Token Error:', error);
  }
}

// Handle Incoming Messages
export function onMessageListener() {
  messaging().onMessage(async (remoteMessage) => {
    console.log('FCM Message:', remoteMessage);
  });
}

// Handle Background and Quit State Notifications
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);
});
