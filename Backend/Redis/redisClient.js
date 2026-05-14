

const { createClient } = require("redis");

let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("error", (err) =>
    console.log("❌ Redis Error:", err)
  );
}

const connectRedis = async () => {
  try {
    if (redisClient && !redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Redis Connected");
    } else {
      console.log("⚠️ REDIS_URL not found. Skipping Redis connection.");
    }
  } catch (error) {
    console.log("❌ Redis Connection Failed:", error.message);
  }
};

module.exports = { redisClient, connectRedis };