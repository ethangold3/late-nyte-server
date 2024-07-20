let io;

module.exports = {
  init: function(socketIo) {
    io = socketIo;
    return io;
  },
  getIO: function() {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};