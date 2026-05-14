const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],

    // optional: store last message preview (faster chat list)
    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
