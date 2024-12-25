import React from 'react';
import { SafeAreaView, StyleSheet, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen({ route, navigation }) {
  const { chatWith, currentUsername } = route.params;

  const url = `https://chat-app-steel-xi.vercel.app/message?chatWith=${chatWith}&currentUsername=${currentUsername}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: url }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="compatibility"
          onMessage={(event) => {
            if (event.nativeEvent.data === 'exit') {
              navigation.navigate('ChatScreen'); // Navigate back to ChatScreen on exit
            }
          }}
          onError={(error) => console.error('WebView Error:', error.nativeEvent)}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? 'blue' : undefined, // Adjust background for Android
  },
  webViewContainer: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? 25 : 0, // Add margin for Android status bar
  },
});
