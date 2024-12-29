import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';

import styles from './ChatScreenStyle';

const socket = io('https://rust-mammoth-route.glitch.me'); // Replace with your backend server URL
const APP_VERSION = '1.0.0'; // Hardcoded app version

export default function ChatScreen() {
  const [username, setUsername] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({});
  const [chatList, setChatList] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const initializeChat = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
        fetchChatList(storedUsername);

        // Listen for real-time updates for the current user
        socket.on(`chat-list-updated-${storedUsername}`, ({ chatList, unread }) => {
          setChatList(
            chatList.map((user) => ({
              username: user,
              unread: unread[user] || 0,
            }))
          );
        });
      } else {
        navigation.navigate('AuthScreen'); // Redirect if not logged in
      }
    };

    initializeChat();

    return () => {
      socket.off(); // Clean up socket listeners
    };
  }, []);

  const fetchChatList = async (storedUsername) => {
    try {
      const response = await fetch('https://rust-mammoth-route.glitch.me/fetch-chat-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: storedUsername }),
      });

      const data = await response.json();
      if (data.chatList) {
        setChatList(data.chatList.map(({ username, unread }) => ({ username, unread })));
      }
    } catch (err) {
      console.error('Error fetching chat list:', err);
    }
  };

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('https://rust-mammoth-route.glitch.me/check-version');
        const data = await response.json();

        if (data.latestVersion !== APP_VERSION) {
          setShowUpdateButton(true);
          setUpdateInfo(data);
        }
      } catch (error) {
        console.error('Error checking version:', error);
      }
    };

    checkVersion();
  }, []);

  const handleUpdate = () => {
    if (!updateInfo.downloadUrl) {
      Alert.alert('Error', 'Download URL is not available.');
      return;
    }
  
    Linking.openURL(updateInfo.downloadUrl)
      .catch((err) => {
        console.error('Failed to open link:', err);
        Alert.alert('Error', 'Unable to open the download link.');
      });
  };  

  const handleLogout = async () => {
    await AsyncStorage.removeItem('username');
    navigation.navigate('AuthScreen'); // Redirect to login screen
  };

  const handleSearch = async () => {
    if (!searchUsername) return;

    try {
      const response = await fetch('https://rust-mammoth-route.glitch.me/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: searchUsername }),
      });

      if (response.ok) {
        setSearchResult(searchUsername); // Set search result
      } else {
        setSearchResult(null);
        Alert.alert('User not found.');
      }
    } catch (err) {
      console.error('Error searching user:', err);
    }
  };

  const handleAddChat = async () => {
    if (!searchResult) return;

    try {
      const response = await fetch('https://rust-mammoth-route.glitch.me/update-chat-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: username, user2: searchResult }),
      });

      if (response.ok) {

        // Emit event to notify server and other clients
        socket.emit('chat-updated', { user1: username, user2: searchResult });

        setSearchResult(null); // Clear the search result
      } else {
        Alert.alert('Failed to add user to chat list.');
      }
    } catch (err) {
      console.error('Error adding chat:', err);
    }
  };

  const handleDeleteChat = async (user) => {
    try {
      const response = await fetch('https://rust-mammoth-route.glitch.me/delete-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: username, user2: user }),
      });

      if (response.ok) {
        // Emit event to update chat list in real time
        socket.emit('chat-updated', { user1: username, user2: user });
      } else {
        Alert.alert('Failed to delete chat.');
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleChatClick = (user) => {
    fetch('https://rust-mammoth-route.glitch.me/clear-unread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewer: username, chatWith: user }),
    })
      .then(() => console.log(`Unread count cleared for chat with ${user}`))
      .catch((err) => console.error('Error clearing unread:', err));
  
    navigation.navigate('WebViewScreen', {
      chatWith: user,
      currentUsername: username,
      goBackToChatScreen: true,
    });
  };  

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Page</Text>
        <View style={styles.userInfo}>
          <Text style={styles.loggedIn}>Logged in as: {username}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        {showUpdateButton && (
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
        >
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      )}
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search username"
          value={searchUsername}
          onChangeText={setSearchUsername}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Result */}
      {searchResult && (
        <View style={styles.searchResult}>
          <Text>User found: {searchResult}</Text>
          <TouchableOpacity style={styles.addChatButton} onPress={handleAddChat}>
            <Text style={styles.addChatText}>Add to Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={chatList}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <View style={styles.chatCard}>
            <Text style={styles.chatUser}>
              {item.username} {item.unread > 0 && `(${item.unread})`}
            </Text>
            <View style={styles.chatButtons}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => handleChatClick(item.username)}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteChat(item.username)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noChats}>No chats available. Start a conversation!</Text>}
      />
    </SafeAreaView>
  );
}