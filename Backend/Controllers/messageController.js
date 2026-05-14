const Message = require("../Models/message");
const Conversation = require("../Models/conversation.js");

// ✅ Send message (save into DB)
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;
    const mediaUrl = req.file ? req.file.path : "";

    if (!conversationId || !senderId) {
      return res
        .status(400)
        .json({ message: "conversationId and senderId required" });
    }

    if (!text && !mediaUrl) {
      return res
        .status(400)
        .json({ message: "Either text or media required" });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      text: text || "",
      image: mediaUrl || "",
    });

    //  Update last message in conversation (for chat list preview)
    const lastMessageText = text || (mediaUrl ? "📸 Shared a media" : "");
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: lastMessageText,
      lastMessageSender: senderId,
      lastMessageAt: new Date(),
    });

    // Populate sender info before sending response
    const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName profilePic");

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Error sending message", error });
  }
};

// Get messages of a conversation

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName profilePic");

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
};


