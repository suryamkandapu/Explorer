const FeedModel = require("../Models/UserFeed.model");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const { redisClient } = require("../Redis/redisClient");

// ✅ Redis key helpers
const feedKey = (userId) => `feed:${userId}`;
const userPostsKey = (userId) => `userPosts:${userId}`;
const postKey = (postId) => `post:${postId}`;
const likedProfilesKey = (postId) => `likedProfiles:${postId}`;

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { description } = req.body;

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const fullName = decoded.fullName;
    const userProfilePic = decoded.profilePic;

    if (!decoded || !userId || !fullName) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const newFeed = new FeedModel({
      description: description || "",
      mediaUrl: req.file?.url || req.file?.path,
      userId: userId,
      fullName: fullName,
      userProfilePic:
        userProfilePic ||
        "https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg",
    });

    await newFeed.save();

    // ✅ Clear caches (because new post affects feed + user posts)
    await redisClient.del(feedKey(userId));
    await redisClient.del(userPostsKey(userId));

    return res.status(200).json({
      success: true,
      message: "File uploaded and saved to DB successfully",
      data: newFeed,
    });
  } catch (err) {
    console.error("File upload error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getFeedData = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIdFromToken = decoded.id;

    if (!decoded || !userIdFromToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Try Redis Cache
    const cached = await redisClient.get(feedKey(userIdFromToken));
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Feed data retrieved successfully (cached)",
        data: JSON.parse(cached),
        currentUserId: userIdFromToken,
      });
    }

    // ✅ Fetch from MongoDB
    const feeds = await FeedModel.find({
      userId: { $ne: userIdFromToken },
    }).sort({ createdAt: -1 });

    // ✅ Cache for 60 seconds
    await redisClient.setEx(feedKey(userIdFromToken), 60, JSON.stringify(feeds));

    res.status(200).json({
      success: true,
      message: "Feed data retrieved successfully",
      data: feeds,
      currentUserId: userIdFromToken,
    });
  } catch (err) {
    console.error("Error fetching feeds:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ✅ Redis cache
    const cached = await redisClient.get(userPostsKey(userId));
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "User posts retrieved successfully (cached)",
        userPosts: JSON.parse(cached),
      });
    }

    const userPosts = await FeedModel.find({ userId }).sort({ createdAt: -1 });

    // ✅ Cache for 60 seconds
    await redisClient.setEx(userPostsKey(userId), 60, JSON.stringify(userPosts));

    res.status(200).json({
      success: true,
      message: "User posts retrieved successfully",
      userPosts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const handleLikesOnPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIdFromToken = decoded.id;

    if (!decoded || !userIdFromToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const post = await FeedModel.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const isLiked = post.likes.some((id) => id.toString() === userIdFromToken);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userIdFromToken);
    } else {
      post.likes.push(userIdFromToken);
    }

    await post.save();

    // ✅ Clear cache for this post + liked profiles
    await redisClient.del(postKey(postId));
    await redisClient.del(likedProfilesKey(postId));

    // ✅ Clear feed cache for current user (because likes count changes UI)
    await redisClient.del(feedKey(userIdFromToken));

    res.status(200).json({
      success: true,
      message: "Post liked/unLiked successfully",
      liked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error("Error handling likes on post:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const handleDeletePost = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIdFromToken = decoded.id;

    if (!decoded || !userIdFromToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const postId = req.params.postId;
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "No postId is received",
      });
    }

    const post = await FeedModel.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userId.toString() !== userIdFromToken) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }

    await FeedModel.findByIdAndDelete(postId);

    // ✅ Clear caches
    await redisClient.del(postKey(postId));
    await redisClient.del(likedProfilesKey(postId));
    await redisClient.del(userPostsKey(userIdFromToken));
    await redisClient.del(feedKey(userIdFromToken));

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const fetchPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    // ✅ Redis cache
    const cached = await redisClient.get(postKey(postId));
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Post fetched successfully (cached)",
        post: JSON.parse(cached),
      });
    }

    const post = await FeedModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // ✅ Cache for 60 seconds
    await redisClient.setEx(postKey(postId), 60, JSON.stringify(post));

    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchLikedProfiles = async (req, res) => {
  try {
    const { postId } = req.params;

    // ✅ Redis cache
    const cached = await redisClient.get(likedProfilesKey(postId));
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Liked profiles fetched successfully (cached)",
        likedProfiles: JSON.parse(cached),
      });
    }

    const post = await FeedModel.findById(postId).populate(
      "likes",
      "fullName profilePic"
    );

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // ✅ Cache 60 seconds
    await redisClient.setEx(
      likedProfilesKey(postId),
      60,
      JSON.stringify(post.likes)
    );

    return res.status(200).json({
      success: true,
      likedProfiles: post.likes,
    });
  } catch (err) {
    console.error("Fetch liked profiles error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  uploadFile,
  getFeedData,
  getUserPosts,
  handleLikesOnPost,
  handleDeletePost,
  fetchPost,
  fetchLikedProfiles,
};
