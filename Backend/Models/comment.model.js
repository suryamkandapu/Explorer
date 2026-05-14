const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feed', 
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    userProfilePic: {
      type: String,
      default: 'https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg', // Default profile picture URL
    },
    date:{
      type: Date,
      default: Date.now, // Automatically sets the date to now
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const CommentModel = mongoose.model('Comment', commentSchema);

module.exports= CommentModel;
