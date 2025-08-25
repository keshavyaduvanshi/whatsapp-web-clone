// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || '*'
}));

// Create HTTP server for optional Socket.IO
const server = http.createServer(app);
let io = null;
if ((process.env.SOCKET_ENABLED || 'false') === 'true') {
  const { Server } = require('socket.io');
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL || '*' } });
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
  });
  // make io globally available via app
  app.set('io', io);
}

// Routes
const messagesRouter = require('./routes/messages');
const conversationsRouter = require('./routes/conversations');
const webhookRouter = require('./routes/webhook');

app.use('/messages', messagesRouter);
app.use('/conversations', conversationsRouter);
app.use('/webhook', webhookRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Root route
app.get('/', (req, res) => {
  res.send('🚀 WhatsApp Clone Backend is running on Render!');
});

// If frontend build is present (React)
if (process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
