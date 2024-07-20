const GameSession = require('../models/GameSession');

function initializeWebSockets(io) {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinGame', async (gameId) => {
      socket.join(gameId);
      const game = await GameSession.findOne({ gameId });
      if (game) {
        io.to(gameId).emit('gameUpdate', game);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return {
    emitGameUpdate: async (gameId) => {
      const game = await GameSession.findOne({ gameId });
      if (game) {
        io.to(gameId).emit('gameUpdate', game);
      }
    }
  };
}

module.exports = initializeWebSockets;