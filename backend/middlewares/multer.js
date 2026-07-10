// backend/middlewares/multer.js
const multer = require("multer");
const path = require("path");

// Temporary storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder where files are temporarily stored
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Optional file filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, and PDF allowed."), false);
  }
  cb(null, true);
};

// ✅ Export the multer instance (not .single)
const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
