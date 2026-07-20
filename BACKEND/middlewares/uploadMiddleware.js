const multer = require("multer");
const path   = require("path");
const crypto = require("crypto");

// Memory storage — file lives in req.file.buffer, never touches disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk  = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, JPG, PNG, or WEBP images are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * Generate a collision-proof filename for Supabase Storage.
 * e.g. "1700000000000-a1b2c3d4e5f6a7b8.jpg"
 */
const generateUniqueFileName = (originalName) => {
    const ext    = path.extname(originalName).toLowerCase();
    const random = crypto.randomBytes(8).toString("hex");
    return `${Date.now()}-${random}${ext}`;
};

// Export both as named properties so callers use:
//   const { upload, generateUniqueFileName } = require('./uploadMiddleware');
// OR (backwards-compatible):
//   const upload = require('./uploadMiddleware');
//   upload.generateUniqueFileName(...)
upload.generateUniqueFileName = generateUniqueFileName;

module.exports = upload;
module.exports.generateUniqueFileName = generateUniqueFileName;
