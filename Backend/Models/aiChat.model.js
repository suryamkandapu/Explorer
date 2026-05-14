const mongoose = require("mongoose");

const aiChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    // array of messages; role = "user" or "assistant"
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        text: { type: String, trim: true, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIChat", aiChatSchema);
