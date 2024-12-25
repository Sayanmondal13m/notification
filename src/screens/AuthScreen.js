import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './AuthScreenStyle'; // Import styles from the separate file

export default function AuthScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeAction, setActiveAction] = useState(null); // Tracks "register" or "login"
  const [message, setMessage] = useState('');
  const navigation = useNavigation(); 

  useEffect(() => {
    // Check if user is already logged in
    const checkLogin = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        validateUser(storedUsername);
      }
    };
    checkLogin();
  }, []);

  const validateUser = async (storedUsername) => {
    try {
      const response = await fetch('https://rust-mammoth-route.glitch.me/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: storedUsername, password: '' }), // Empty password for validation
      });

      if (response.ok) {
        navigation.navigate('ChatScreen', { username: storedUsername });
      } else {
        await AsyncStorage.removeItem('username'); // Clear invalid username
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handleSubmit = async (isRegistration) => {
    if (activeAction) return; // Prevent multiple simultaneous requests
    setActiveAction(isRegistration ? 'register' : 'login'); // Track action

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
      setActiveAction(null); // Reset action
      if (response.ok) {
        await AsyncStorage.setItem('username', username); // Store username
        setMessage('Success! Redirecting...');
        navigation.navigate('ChatScreen', { username });
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error');
      console.error('Submission error:', error);
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