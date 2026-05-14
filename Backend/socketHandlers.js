const onlineUsers = new Map(); // userId => socketId

const socketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(" New socket connected:", socket.id);

    //  Join user
    socket.on("addUser", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    //  Send message real-time
    socket.on("sendMessage", ({ senderId, receiverId, message }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          senderId,
          message,
        });
      }
    });

    //  Disconnect user
    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

module.exports = socketHandlers;
