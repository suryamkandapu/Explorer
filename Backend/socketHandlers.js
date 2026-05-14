const onlineUsers = new Map();

const socketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(
      "✅ New socket connected:",
      socket.id
    );

    // ✅ Add user
    socket.on("addUser", (userId) => {
      if (!userId) return;

      // ✅ store user -> socket mapping
      onlineUsers.set(
        userId.toString(),
        socket.id
      );

      console.log(
        "🟢 ONLINE USERS:",
        Array.from(onlineUsers.entries())
      );

      io.emit(
        "getOnlineUsers",
        Array.from(onlineUsers.keys())
      );
    });

    // ✅ Send realtime message
    socket.on(
  "sendMessage",
  ({ senderId, receiverId, message }) => {

    console.log("📩 SEND MESSAGE EVENT");

    // ✅ DEBUG ONLINE USERS
    console.log("ONLINE USERS:");
    console.log(
      Array.from(onlineUsers.entries())
    );

    console.log("senderId:", senderId);
    console.log("receiverId:", receiverId);
    console.log("message:", message);

    if (!receiverId || !message) {
      console.log(
        "❌ Missing receiverId or message"
      );
      return;
    }

    // ✅ get receiver socket
    const receiverSocketId =
      onlineUsers.get(
        receiverId.toString()
      );

    console.log(
      "receiverSocketId:",
      receiverSocketId
    );

    // ✅ emit to receiver
    if (receiverSocketId) {

      io.to(receiverSocketId).emit(
        "receiveMessage",
        {
          senderId,
          message,
        }
      );

      console.log(
        "✅ Message emitted successfully"
      );

    } else {

      console.log(
        "❌ Receiver not online"
      );
    }
  }
);

    // ✅ Disconnect
    socket.on("disconnect", () => {

      for (const [
        userId,
        socketId,
      ] of onlineUsers.entries()) {

        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          console.log(
            `❌ User disconnected: ${userId}`
          );

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