const multer = require("multer");
const path = require("path");

// Configure storage location and file naming rules
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // This folder must exist at your backend root directory
        cb(null, "uploads/"); 
    },
    filename: function (req, file, cb) {
        // Renames files smoothly: fieldname-timestamp.extension (e.g., image-171829304.jpg)
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

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

// Initialize multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Maximum 5MB file sizes
});

module.exports = upload;