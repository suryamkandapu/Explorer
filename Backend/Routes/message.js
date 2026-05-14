const router = require("express").Router();
const { sendMessage, getMessages } = require("../Controllers/messageController");
const chatMediaUpload = require("../Utils/chatMediaMulterConfig");

// ✅ Save message (with optional media)
router.post("/", chatMediaUpload.single("media"), sendMessage);

// ✅ Get messages by conversationId
router.get("/:conversationId", getMessages);

module.exports = router;
