const fs = require('fs');
const path = require('path');

// Create uploadsProfiles directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploadsProfiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploadsProfiles directory');
}

// Instructions for user
console.log(`
╔════════════════════════════════════════════════════════════════╗
║          GEMINI AI AVATAR SETUP                               ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  1. Save the AI image you received as:                         ║
║     Backend/uploadsProfiles/gemini-avatar.png                  ║
║                                                                 ║
║  2. The image will be available at:                            ║
║     http://localhost:8000/uploadsProfiles/gemini-avatar.png    ║
║                                                                 ║
║  3. Then restart the backend:                                  ║
║     npm start                                                  ║
║                                                                 ║
║  4. The Gemini AI avatar will appear in:                       ║
║     - Chat header                                              ║
║     - Chat message bubbles                                     ║
║     - Conversation list                                        ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
`);

console.log(`Directory path: ${uploadDir}`);
console.log(`✅ Ready to receive the gemini-avatar.png file`);
