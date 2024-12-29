import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import styles from './AuthScreenStyle';

export default function AuthScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  const [message, setMessage] = useState('');
  const navigation = useNavigation();

  async function registerForPushNotificationsAsync() {
    try {
      if (!Device.isDevice) {
        alert('Push Notifications require a physical device.');
        return null;
      }

      console.log('Requesting notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted.');
        return null;
      }

      console.log('Fetching push notification token...');
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      if (!token) {
        console.error('Failed to fetch push notification token.');
        return null;
      }

      console.log('Generated Notification Token:', token);
      return token;
    } catch (error) {
      console.error('Error during push notification setup:', error.message || error);
      return null;
    }
  }

  const saveTokenToServer = async (username, token) => {
    try {
      const response = await fetch('https://rust-mammoth-route.glitch.me/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to save token to server:', error);
        await AsyncStorage.setItem('unsavedToken', JSON.stringify({ username, token }));
        return false;
      }

      console.log('Token saved successfully.');
      return true;
    } catch (error) {
      console.error('Network error while saving token:', error);
      await AsyncStorage.setItem('unsavedToken', JSON.stringify({ username, token }));
      return false;
    }
  };

  const handleSubmit = async (isRegistration) => {
    if (activeAction) return;
    setActiveAction(isRegistration ? 'register' : 'login');

    const endpoint = isRegistration
      ? 'https://rust-mammoth-route.glitch.me/register'
      : 'https://rust-mammoth-route.glitch.me/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      setActiveAction(null);

      if (response.ok) {
        await AsyncStorage.setItem('username', username);
        const token = await registerForPushNotificationsAsync();

        if (token) {
          const success = await saveTokenToServer(username, token);
          if (!success) {
            setMessage('Failed to save token. Try again later.');
            return;
          }
        } else {
          console.warn('Token not generated.');
        }

        setMessage('Success! Redirecting...');
        navigation.navigate('ChatScreen', { username });
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Submission error:', error.message || error);
      setMessage('Network error. Please try again.');
      setActiveAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleSubmit(true)}
          disabled={activeAction === 'register'}
        >
          <Text style={styles.buttonText}>
            {activeAction === 'register' ? 'Registering...' : 'Register'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleSubmit(false)}
          disabled={activeAction === 'login'}
        >
          <Text style={styles.buttonText}>
            {activeAction === 'login' ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}