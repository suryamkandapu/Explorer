const onlineUsers = new Map();

const socketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ New socket connected:", socket.id);

    // ✅ Add user
    socket.on("addUser", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);

      io.emit(
        "getOnlineUsers",
        Array.from(onlineUsers.keys())
      );
    });

    // ✅ Send message
    socket.on(
      "sendMessage",
      ({ senderId, receiverId, message }) => {
        if (!receiverId || !message) return;

        const receiverSocketId =
          onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit(
            "receiveMessage",
            {
              senderId,
              message,
            }
          );
        }
      }
    );

    // ✅ Disconnect
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit(
        "getOnlineUsers",
        Array.from(onlineUsers.keys())
      );

      console.log(
        "❌ Socket disconnected:",
        socket.id
      );
    });
  });
};

module.exports = socketHandlers;