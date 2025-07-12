const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../config/cloudinary');
const path = require('path');

const allowedFormats = ['jpg', 'jpeg', 'png'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'Crunchies',
    allowed_formats: allowedFormats,
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1); // e.g., 'png'
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Only ${allowedFormats.join(', ')} formats are allowed`), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;