require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeminiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing API key:", apiKey ? apiKey.substring(0, 10) + "..." : "NOT SET");

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env");
    return;
  }

  // Try multiple model names (free tier often only has limited access)
  const modelsToTry = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro",
    "gemini-pro-vision",
  ];

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTry) {
    try {
      console.log(`\n🔄 Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Say hello in one sentence");
      const response = await result.response;
      const text = response.text();

      console.log(`✅ SUCCESS with ${modelName}!`);
      console.log("Response:", text);
      return;
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message.split("\n")[0]);
    }
  }

  console.error("\n❌ None of the models worked. Your API key may be restricted or expired.");
  console.error("Please check: https://ai.google.dev/pricing");
}

testGeminiKey();
