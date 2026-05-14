const FeedModel = require("../Models/UserFeed.model");
const jwt = require("jsonwebtoken");
const CommentModel = require("../Models/comment.model");

const JWT_SECRET = process.env.JWT_SECRET;

const { redisClient } = require("../Redis/redisClient");

// ✅ Redis key helper
const commentsKey = (postId) => `comments:${postId}`;

const addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { text: comment } = req.body;

    const token =
      req.cookies.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.id;
    const fullName = decoded.fullName;
    const userProfilePic = decoded.profilePic;

    if (!decoded || !userId || !fullName || !userProfilePic) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const post = await FeedModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const newComment = new CommentModel({
      postId,
      userId,
      fullName,
      userProfilePic,
      date: new Date(),
      text: comment,
    });

    await newComment.save();

    // ✅ Clear Redis cache safely
    if (redisClient) {
      await redisClient.del(commentsKey(postId));
    }

    return res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });

  } catch (err) {
    console.error("Add comment error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getComments = async (req, res) => {
  try {
    const postId = req.params.postId;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    // ✅ Check Redis cache safely
    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(commentsKey(postId));
    }

    if (cached) {
      console.log("Comments fetched from cache");

      return res.status(200).json({
        success: true,
        message: "Comments retrieved successfully (cached)",
        comments: JSON.parse(cached),
      });
    }

    // ✅ Fetch from MongoDB
    const comments = await CommentModel.find({
      postId,
    }).sort({ date: -1 });

    // ✅ Save to Redis safely
    if (redisClient) {
      await redisClient.setEx(
        commentsKey(postId),
        60,
        JSON.stringify(comments)
      );
    }

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      comments,
    });

  } catch (err) {
    console.error("Get comments error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const token =
      req.cookies.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const userIdFromToken = decoded.id;

    if (!decoded || !userIdFromToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const commentId = req.params.commentId;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "No commentId received",
      });
    }

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.userId.toString() !== userIdFromToken) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    await CommentModel.findByIdAndDelete(commentId);

    // ✅ Clear Redis cache safely
    if (redisClient) {
      await redisClient.del(
        commentsKey(comment.postId.toString())
      );
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });

  } catch (err) {
    console.error("Delete comment error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
};