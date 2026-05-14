const mongoose = require("mongoose");
const Conversation = require("../Models/conversation");

// ✅ Create new conversation (if not exists)
exports.createConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "senderId and receiverId required",
      });
    }

    // ✅ Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        conversation: existingConversation,
      });
    }

    // ✅ Create new conversation
    const newConversation = await Conversation.create({
      members: [senderId, receiverId],
    });

    return res.status(201).json({
      success: true,
      conversation: newConversation,
    });

  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Error creating conversation",
      error: error.message,
    });
  }
};

// ✅ Get all conversations of a user
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const conversations = await Conversation.find({
      members: {
        $in: [new mongoose.Types.ObjectId(userId)],
      },
    })
      .sort({ updatedAt: -1 })
      .populate("members", "fullName profilePic email");

    return res.status(200).json({
      success: true,
      conversations,
    });

  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};