import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import io from 'socket.io-client';
import * as DocumentPicker from 'expo-document-picker';
import styles from './MessageScreenStyle';

const socket = io('https://rust-mammoth-route.glitch.me'); // Replace with your server URL

const stickerUrls = [
  'https://example.com/stickers/s-1.gif',
  'https://example.com/stickers/s-2.gif',
  'https://example.com/stickers/s-3.gif',
];

export default function MessageScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatWith } = route.params;

  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const messageListRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('username').then((storedUsername) => {
      if (!storedUsername) {
        navigation.navigate('AuthScreen');
        return;
      }
      setUsername(storedUsername);

      fetch('https://rust-mammoth-route.glitch.me/fetch-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: storedUsername, user2: chatWith }),
      })
        .then((res) => res.json())
        .then((data) => setMessages(data.messages || []));

      fetch('https://rust-mammoth-route.glitch.me/clear-unread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer: storedUsername, chatWith }),
      });

      socket.emit('message-seen', { viewer: storedUsername, sender: chatWith });
    });

    socket.on(`message-received-${username}`, handleIncomingMessage);
    socket.on(`typing-${username}`, handleTyping);
    socket.on(`message-seen-${username}`, handleSeen);

    return () => {
      socket.off(`message-received-${username}`, handleIncomingMessage);
      socket.off(`typing-${username}`, handleTyping);
      socket.off(`message-seen-${username}`, handleSeen);
    };
  }, [username, chatWith]);

  const handleIncomingMessage = ({ from, message }) => {
    if (from === chatWith) {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    }
  };

  const handleTyping = ({ from }) => {
    if (from === chatWith) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 5000);
    }
  };

  const handleSeen = ({ viewer }) => {
    if (viewer === chatWith) {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, seen: true }))
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !file) return;

    setSending(true);

    const message = {
      from: username,
      to: chatWith,
      message: newMessage.trim(),
      file: file ? file.uri : null,
      fileName: file ? file.name : null,
      replyTo: replyingTo ? { text: replyingTo.text, sender: replyingTo.sender } : null,
    };

    socket.emit('send-message', message);

    setMessages((prev) => [
      ...prev,
      {
        sender: username,
        text: newMessage.trim(),
        file: file ? file.uri : null,
        fileName: file ? file.name : null,
        timestamp: new Date().toISOString(),
        replyTo: replyingTo,
        seen: false,
      },
    ]);

    setNewMessage('');
    setFile(null);
    setReplyingTo(null);
    setSending(false);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    }, 200);
    setShowScrollToBottom(false);
  };

  const handleTypingIndicator = (text) => {
    setNewMessage(text);
    socket.emit('typing', { from: username, to: chatWith });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={messageListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          onScroll={() => setShowScrollToBottom(true)}
          renderItem={({ item }) => (
            <View style={[
              styles.message,
              item.sender === username ? styles.sent : styles.received,
            ]}>
              {item.replyTo && <Text style={styles.replyText}>Replying to: {item.replyTo.text}</Text>}
              {item.text && <Text>{item.text}</Text>}
              {item.sender === username && item.seen && <Text style={styles.seenText}>Seen</Text>}
            </View>
          )}
        />

        {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}

        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={handleTypingIndicator}
            placeholder="Type a message"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text>{sending ? 'Sending...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}