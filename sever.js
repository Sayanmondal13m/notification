const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// File to store user data
const dataFilePath = path.join(__dirname, 'users.json');

// Helper functions to manage persistent storage
function loadUserData() {
  if (fs.existsSync(dataFilePath)) {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  }
  return {};
}

function saveUserData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Initialize users object
let users = loadUserData();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Accept any file type
    cb(null, true);
  },
});

// Create HTTP and WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Real-time communication with Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected.');

  // Handle sending messages
socket.on('send-message', ({ from, to, message, file, replyTo }) => {
  if (users[from] && users[to]) {
    const msg = { sender: from, text: message, file: file || null, timestamp: new Date().toISOString(), seen: false, replyTo: replyTo || null };

    // Initialize message structures
    if (!users[from].messages) users[from].messages = {};
    if (!users[to].messages) users[to].messages = {};

    if (!users[from].messages[to]) users[from].messages[to] = [];
    if (!users[to].messages[from]) users[to].messages[from] = [];

    // Add the message to both users
    users[from].messages[to].push(msg);
    users[to].messages[from].push(msg);

    // Ensure the sender appears at the top of the receiver's chat list
    users[to].chatList = [from, ...users[to].chatList.filter((user) => user !== from)];

    // Ensure the receiver appears at the top of the sender's chat list
    users[from].chatList = [to, ...users[from].chatList.filter((user) => user !== to)];

    // Increment unread count for the recipient
    if (!users[to].unread) users[to].unread = {};
    if (!users[to].unread[from]) users[to].unread[from] = 0;
    users[to].unread[from] += 1;

    saveUserData(users);

    // Notify the recipient about the new message and chat list update
    io.emit(`message-received-${to}`, { from, message: msg });
    io.emit(`chat-list-updated-${to}`, {
      chatList: users[to].chatList,
      unread: users[to].unread,
    });

    // Notify the sender about the updated chat list
    io.emit(`chat-list-updated-${from}`, {
      chatList: users[from].chatList,
    });
    
   if (!tokens[to]) return;

    // Delay 2 seconds before sending notification
    setTimeout(async () => {
      const seenMessages = users[to].messages[from].filter((m) => m.seen).length;
      if (seenMessages === 0) {
        const notification = {
          to: tokens[to],
          sound: 'default',
          title: `${from} sent you a message`,
          body: message,
          data: { from },
        };

        if (Expo.isExpoPushToken(tokens[to])) {
          try {
            await expo.sendPushNotificationsAsync([notification]);
          } catch (error) {
            console.error('Error sending notification:', error);
          }
        }
      }
    }, 2000);
  }
});

  // Handle typing indicator
  socket.on('typing', ({ from, to }) => {
    io.emit(`typing-${to}`, { from });
  });

  // Handle message seen
// Handle message seen
socket.on('message-seen', ({ viewer, sender }) => {
  if (users[sender] && users[sender].messages && users[sender].messages[viewer]) {
    // Update only unseen messages
    users[sender].messages[viewer] = users[sender].messages[viewer].map((msg) =>
      !msg.seen ? { ...msg, seen: true } : msg
    );
    saveUserData(users);

    // Notify the sender about seen status
    io.emit(`message-seen-${sender}`, { viewer });
  }
});

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Update Chat List
app.post('/update-chat-list', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2 || !users[user1] || !users[user2]) {
    return res.status(400).json({ message: 'Both users are required' });
  }

  // Add user2 to user1's chat list if not already added
  if (!users[user1].chatList.includes(user2)) {
    users[user1].chatList = [user2, ...users[user1].chatList];
  }

  // Add user1 to user2's chat list if not already added
  if (!users[user2].chatList.includes(user1)) {
    users[user2].chatList = [user1, ...users[user2].chatList];
  }

  saveUserData(users);

  // Emit real-time updates to both users
  io.emit(`chat-list-updated-${user1}`, {
    chatList: users[user1].chatList,
    unread: users[user1].unread || {},
  });
  io.emit(`chat-list-updated-${user2}`, {
    chatList: users[user2].chatList,
    unread: users[user2].unread || {},
  });

  return res.status(200).json({ message: 'Chat list updated successfully' });
});

// Register Endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (users[username]) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  users[username] = { password, chatList: [], messages: {}, unread: {} };
  saveUserData(users); // Save updated users
  return res.status(201).json({ message: 'User registered successfully' });
});

// Login Endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (users[username] && (password === '' || users[username].password === password)) {
    return res.status(200).json({
      message: 'Login successful',
      chatList: users[username].chatList,
    });
  }

  return res.status(401).json({ message: 'Invalid username or password' });
});

// Validate Username
app.post('/validate', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (users[username]) {
    return res.status(200).json({ message: 'Username valid' });
  }

  return res.status(401).json({ message: 'Invalid username' });
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, fileUrl });
});

// Serve uploaded files with proper CORS headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fetch Chat List
app.post('/fetch-chat-list', (req, res) => {
  const { username } = req.body;

  if (!username || !users[username]) {
    return res.status(400).json({ message: 'Invalid username' });
  }

  const chatListWithUnread = users[username].chatList.map((chatUser) => ({
    username: chatUser,
    unread: users[username].unread && users[username].unread[chatUser] ? users[username].unread[chatUser] : 0,
  }));

  return res.status(200).json({ chatList: chatListWithUnread });
});

// Update Chat List
app.post('/update-chat-list', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2 || !users[user1] || !users[user2]) {
    return res.status(400).json({ message: 'Both users are required' });
  }

  if (!users[user1].chatList.includes(user2)) {
    users[user1].chatList = [user2, ...users[user1].chatList];
  }
  if (!users[user2].chatList.includes(user1)) {
    users[user2].chatList = [user1, ...users[user2].chatList];
  }

  saveUserData(users);

  // Emit real-time updates to both users
  io.emit(`chat-list-updated-${user1}`, { chatList: users[user1].chatList });
  io.emit(`chat-list-updated-${user2}`, { chatList: users[user2].chatList });

  return res.status(200).json({ message: 'Chat list updated' });
});

// Fetch Messages Between Two Users
app.post('/fetch-messages', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Both users are required' });
  }

  if (users[user1] && users[user1].messages && users[user1].messages[user2]) {
    return res.status(200).json({ messages: users[user1].messages[user2] });
  }

  return res.status(200).json({ messages: [] });
});

// Clear Unread Messages
app.post('/clear-unread', (req, res) => {
  const { viewer, chatWith } = req.body;

  if (!viewer || !chatWith || !users[viewer] || !users[chatWith]) {
    return res.status(400).json({ message: 'Invalid users' });
  }

  if (users[viewer].unread && users[viewer].unread[chatWith]) {
    users[viewer].unread[chatWith] = 0; // Reset unread count
    saveUserData(users);

    // Notify the viewer about the updated unread counts
    io.emit(`chat-list-updated-${viewer}`, {
      chatList: users[viewer].chatList,
      unread: users[viewer].unread,
    });
  }

  return res.status(200).json({ message: 'Unread count cleared for specific sender' });
});

// Delete Chat
app.post('/delete-chat', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2 || !users[user1] || !users[user2]) {
    return res.status(400).json({ message: 'Invalid users' });
  }

  // Remove user2 from user1's chat list
  users[user1].chatList = users[user1].chatList.filter((u) => u !== user2);

  // Remove user1 from user2's chat list
  users[user2].chatList = users[user2].chatList.filter((u) => u !== user1);

  // Clear messages between the two users
  if (users[user1].messages) delete users[user1].messages[user2];
  if (users[user2].messages) delete users[user2].messages[user1];

  // Save the updated users data
  saveUserData(users);

  // Notify clients to update their chat lists
  io.emit(`chat-list-updated-${user1}`, { chatList: users[user1].chatList, unread: users[user1].unread });
  io.emit(`chat-list-updated-${user2}`, { chatList: users[user2].chatList, unread: users[user2].unread });

  return res.status(200).json({ message: 'Chat deleted successfully' });
});

// Start the Server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});