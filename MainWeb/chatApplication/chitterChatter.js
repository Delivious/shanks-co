// ================= SOCKET.IO SETUP =================
const socket = io();

// ================= STATE MANAGEMENT =================
let currentUsername = null;
let currentRoomId = null;
let usersInRoom = [];
let isConnected = false;

// Get DOM elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const roomIdInput = document.getElementById('roomIdInput');
const loginError = document.getElementById('loginError');

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const leaveBtn = document.getElementById('leaveBtn');
const copyRoomBtn = document.getElementById('copyRoomBtn');

const usernameDisplay = document.getElementById('usernameDisplay');
const userCount = document.getElementById('userCount');
const displayRoomId = document.getElementById('displayRoomId');
const typingIndicator = document.getElementById('typingIndicator');
const typingUsers = document.getElementById('typingUsers');
const roomTitle = document.getElementById('roomTitle');

// ================= UTILITY FUNCTIONS =================
function generateRoomId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function switchToChat() {
  loginScreen.classList.remove('active');
  chatScreen.classList.add('active');
}

function switchToLogin() {
  chatScreen.classList.remove('active');
  loginScreen.classList.add('active');
}

function showLoginError(message) {
  loginError.textContent = message;
}

function clearLoginError() {
  loginError.textContent = '';
}

function clearMessages() {
  messagesContainer.innerHTML = `
    <div class="welcome-message">
        <p>Welcome to the chat! Share your room ID with others to join.</p>
        <div class="room-id-display">
            <p>Room ID: <code id="displayRoomId">${currentRoomId}</code></p>
            <button type="button" id="copyRoomBtn" class="copy-btn">Copy Room ID</button>
        </div>
    </div>
  `;
  displayRoomId.textContent = currentRoomId;
  document.getElementById('copyRoomBtn').addEventListener('click', copyRoomToClipboard);
}

function addMessageToChat(username, message, timestamp, isSelf = false) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isSelf ? 'self' : 'other'}`;
  
  const messageContent = `
    <div class="message-header">
      <span class="username">${username}</span>
      <span class="timestamp">${formatTime(timestamp)}</span>
    </div>
    <div class="message-text">${escapeHtml(message)}</div>
  `;
  
  messageEl.innerHTML = messageContent;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
  const msgEl = document.createElement('div');
  msgEl.className = 'system-message';
  msgEl.textContent = text;
  messagesContainer.appendChild(msgEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateUserCount() {
  userCount.textContent = `Users: ${usersInRoom.length}`;
}

function updateTypingIndicator(typingUsernames) {
  if (typingUsernames.length === 0) {
    typingIndicator.style.display = 'none';
    return;
  }

  const displayNames = typingUsernames.filter(u => u !== currentUsername);
  if (displayNames.length === 0) {
    typingIndicator.style.display = 'none';
    return;
  }

  typingIndicator.style.display = 'block';
  if (displayNames.length === 1) {
    typingUsers.textContent = `${displayNames[0]} is typing...`;
  } else if (displayNames.length === 2) {
    typingUsers.textContent = `${displayNames[0]} and ${displayNames[1]} are typing...`;
  } else {
    typingUsers.textContent = `${displayNames.length} people are typing...`;
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function copyRoomToClipboard() {
  navigator.clipboard.writeText(currentRoomId).then(() => {
    const btn = copyRoomBtn;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
}

// ================= EVENT LISTENERS =================
// Login form
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearLoginError();

  const username = usernameInput.value.trim();
  const roomId = roomIdInput.value.trim() || generateRoomId();

  if (!username) {
    showLoginError('Username is required');
    return;
  }

  if (username.length > 20) {
    showLoginError('Username must be 20 characters or less');
    return;
  }

  currentUsername = username;
  currentRoomId = roomId;

  // Emit join room event
  socket.emit('chat:join-room', { roomId, username });
  switchToChat();
});

// Message input
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  } else {
    // Emit typing indicator
    socket.emit('chat:typing', { roomId: currentRoomId, username: currentUsername });
  }
});

messageInput.addEventListener('blur', () => {
  socket.emit('chat:stop-typing', { roomId: currentRoomId, username: currentUsername });
});

sendBtn.addEventListener('click', sendMessage);
leaveBtn.addEventListener('click', leaveChat);
copyRoomBtn.addEventListener('click', copyRoomToClipboard);

// ================= MESSAGE FUNCTIONS =================
function sendMessage() {
  const message = messageInput.value.trim();
  
  if (!message) return;

  socket.emit('chat:send-message', {
    roomId: currentRoomId,
    username: currentUsername,
    message
  });

  messageInput.value = '';
  messageInput.focus();
  socket.emit('chat:stop-typing', { roomId: currentRoomId, username: currentUsername });
}

function leaveChat() {
  socket.emit('chat:leave-room', { roomId: currentRoomId, username: currentUsername });
  
  currentUsername = null;
  currentRoomId = null;
  usersInRoom = [];
  
  switchToLogin();
  usernameInput.value = '';
  roomIdInput.value = '';
  clearLoginError();
  clearMessages();
}

// ================= SOCKET.IO EVENTS =================

// Receive message
socket.on('chat:message', (messageData) => {
  const isSelf = messageData.username === currentUsername;
  addMessageToChat(
    messageData.username,
    messageData.message,
    messageData.timestamp,
    isSelf
  );
});

// User joined
socket.on('chat:user-joined', (data) => {
  usersInRoom = data.usersInRoom;
  updateUserCount();
  
  if (data.username !== currentUsername) {
    addSystemMessage(`${data.username} joined the chat`);
  }
});

// User left
socket.on('chat:user-left', (data) => {
  usersInRoom = data.usersInRoom;
  updateUserCount();
  addSystemMessage(`${data.username} left the chat`);
});

// Message history
socket.on('chat:history', (messages) => {
  clearMessages();
  
  if (messages.length === 0) {
    return;
  }

  messages.forEach(msg => {
    const isSelf = msg.username === currentUsername;
    addMessageToChat(msg.username, msg.message, msg.timestamp, isSelf);
  });
});

// Typing update
socket.on('chat:typing-update', (typingUsernames) => {
  updateTypingIndicator(typingUsernames);
});

// Error
socket.on('chat:error', (error) => {
  showLoginError(error);
  console.error('Chat error:', error);
});

// Disconnect
socket.on('disconnect', () => {
  isConnected = false;
  console.log('Disconnected from server');
});

// Connect
socket.on('connect', () => {
  isConnected = true;
  console.log('Connected to server');
});
