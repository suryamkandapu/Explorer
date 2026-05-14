const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");

const connectDb = require("./Mongodb/connectDb");
const { connectRedis } = require("./Redis/redisClient");

const userRoutes = require("./Routes/user");
const uploadRoutes = require("./Routes/addFeed");
const commentRoutes = require("./Routes/comment");

const { initSocket } = require("./socket");
const socketHandlers = require("./socketHandlers");

const conversationRoutes = require('./Routes/conversation');
const messageRoutes = require('./Routes/message');

const aiTestRoutes = require("./Routes/aiTest");

const app = express();
const port = process.env.PORT || 8000;

/* ✅ Important for Render / proxies */
app.set("trust proxy", 1);

/* ✅ CORS FIX */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://explorer-k7p9.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Debug logging */
app.use((req, res, next) => {
  console.log("➡️ REQUEST HIT:", req.method, req.url);
  next();
});

/* Static folders */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploadsProfiles", express.static(path.join(__dirname, "uploadsProfiles")));

/* Routes */
app.use("/user", userRoutes);
app.use("/", uploadRoutes);
app.use("/comments", commentRoutes);

app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes);

app.use("/api/ai", aiTestRoutes);

/* Test route */
app.get("/ping", (req, res) => res.send("pong"));

/* DB connections */
connectRedis();
connectDb();

/* HTTP + Socket */
const server = http.createServer(app);
const io = initSocket(server);
socketHandlers(io);

/* Start server */
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});