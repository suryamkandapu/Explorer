const axios = require("axios");

/**
 * Send a prompt to Groq API
 */
async function askGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not defined");
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000
      }
    );

    return response.data?.choices?.[0]?.message?.content || "No response";

  } catch (error) {

    console.error(
      "Groq API error:",
      error.response?.data || error.message
    );

    throw error;
  }
}

module.exports = { askGroq };