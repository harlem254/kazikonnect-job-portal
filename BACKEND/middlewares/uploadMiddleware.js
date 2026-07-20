const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Use memory storage instead of disk storage for Supabase upload
const storage = multer.memoryStorage();

// Check file types to ensure only images are allowed
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed!"), false);
    }
};

// Initialize multer instance with memory storage
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Maximum 5MB file sizes
});

/**
 * Generate a unique filename for Supabase Storage
 * @param {string} originalName - Original file name
 * @returns {string} - Unique filename
 */
const generateUniqueFileName = (originalName) => {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomString}${ext}`;
};

module.exports = upload;
module.exports.generateUniqueFileName = generateUniqueFileName;