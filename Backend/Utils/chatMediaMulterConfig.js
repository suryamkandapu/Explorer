const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'explorer-chat-media',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'mkv'],
    resource_type: 'auto', // allows both image and video
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  }
});

module.exports = upload;
