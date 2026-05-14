const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://explorer-k7p9.onrender.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }

  return io;
};

module.exports = { initSocket, getIO };