const mongoose = require("mongoose");
const Conversation = require("../Models/conversation");

// Create new conversation (if not exists)
exports.createConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId and receiverId required" });
    }

    // ✅ Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const newConversation = await Conversation.create({
      members: [senderId, receiverId],
    });

    res.status(201).json(newConversation);
  } catch (error) {
    res.status(500).json({ message: "Error creating conversation", error });
  }
};

// ✅ Get all conversations of a user

exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      members: { $in: [new mongoose.Types.ObjectId(userId)] },
    })
      .sort({ updatedAt: -1 })
      .populate("members", "fullName profilePic email");

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching conversations", error });
  }
};
