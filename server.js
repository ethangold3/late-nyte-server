const express = require('express');

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const gameRoutes = require('./src/routes/gameRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const connectDB = require('./src/config/database');
const socketManager = require('./src/socketManager');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


connectDB();

io.on('connection', (socket) => {
  console.log('A user connected. Socket ID:', socket.id);

  socket.on('joinRoom', (gameId) => {
    console.log(`Socket ${socket.id} joining room ${gameId}`);
    socket.join(gameId);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected. Socket ID: ${socket.id}. Reason: ${reason}`);
  });
});


app.use('/api/game', gameRoutes);

// Routes (we'll add these later)
// app.use('/api/users', require('./src/routes/users'));
// app.use('/api/games', require('./src/routes/games'));
app.use('/api/health', require('./src/routes/health'));
app.use(errorHandler);

socketManager.init(io);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io };