const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'explorer-feeds', // folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif','mp4', 'mov'],
    resource_type: 'auto' // allows both images and videos
  }
});

const upload = multer({ storage });

module.exports = upload;









