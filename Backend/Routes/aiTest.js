const express = require("express");
const router = express.Router();

// remove OpenAI/test route; Gemini only

// Gemini integration
const { askGroq } = require("../AI/groqAgent");
const AIChat = require("../Models/aiChat.model");

// legacy test endpoint removed; only Gemini routes remain

// ---------- Gemini routes ----------

// fetch conversation history for a user
router.get("/gemini/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const chat = await AIChat.findOne({ userId });
    return res.status(200).json({ success: true, messages: chat ? chat.messages : [] });
  } catch (err) {
    console.error("Gemini history error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// send a new message to Gemini and save history
router.post("/gemini", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: "userId and message required" });
    }

    // call Gemini API
    const reply = await askGroq(message);

    // append to DB
    let chat = await AIChat.findOne({ userId });
    if (!chat) {
      chat = new AIChat({ userId, messages: [] });
    }
    chat.messages.push({ role: "user", text: message });
    chat.messages.push({ role: "assistant", text: reply });
    await chat.save();

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("Gemini chat error", err.response?.data || err.message);
    // propagate any returned error payload for easier debugging
    const msg = err.response?.data?.error || err.message;
    return res.status(500).json({ success: false, message: msg });
  }
});


// ✅ THIS LINE IS CRITICAL
module.exports = router;
