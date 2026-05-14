const router = require("express").Router();
const {
  createConversation,
  getUserConversations,
} = require("../Controllers/conversationController");

// ✅ Create conversation
router.post("/", createConversation);

// ✅ Get all conversations of a user
router.get("/:userId", getUserConversations);

module.exports = router;
