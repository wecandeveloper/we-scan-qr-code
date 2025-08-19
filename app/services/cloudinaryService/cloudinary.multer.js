// cloudinary.multer.js
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, jpeg, and png formats are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;