const Message = require("../Models/message");
const Conversation = require("../Models/conversation.js");

// ✅ Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    const mediaUrl = req.file ? req.file.path : "";

    // ✅ Validation
    if (!conversationId || !senderId) {
      return res.status(400).json({
        success: false,
        message: "conversationId and senderId required",
      });
    }

    if (!text && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Either text or media required",
      });
    }

    // ✅ Create message
    const newMessage = await Message.create({
      conversationId,
      senderId,
      text: text || "",
      image: mediaUrl || "",
    });

    // ✅ Update conversation preview
    const lastMessageText =
      text || (mediaUrl ? "📸 Shared a media" : "");

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: lastMessageText,
      lastMessageSender: senderId,
      lastMessageAt: new Date(),
    });

    // ✅ Populate sender details
    const populatedMessage = await Message.findById(
      newMessage._id
    ).populate("senderId", "fullName profilePic");

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });

  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

// ✅ Get messages of a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required",
      });
    }

    const messages = await Message.find({
      conversationId,
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName profilePic");

    return res.status(200).json({
      success: true,
      messages,
    });

  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};