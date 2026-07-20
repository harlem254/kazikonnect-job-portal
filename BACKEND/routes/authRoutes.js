const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { uploadImageToSupabase } = require("../config/storage");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

// Route for handling image uploads (Avatar / Company Logo)
router.post("/upload-image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Generate unique filename and upload to Supabase
        const fileName = upload.generateUniqueFileName(req.file.originalname);
        console.log("Generated filename:", fileName);
        
        const imageUrl = await uploadImageToSupabase(
            req.file.buffer,
            fileName,
            req.file.mimetype
        );
        
        console.log("Supabase returned imageUrl:", imageUrl);

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ 
            message: "Failed to upload image",
            error: error.message 
        });
    }
});

module.exports = router;