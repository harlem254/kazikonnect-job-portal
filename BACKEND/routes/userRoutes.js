const express = require("express");
const {
    getUserById,
    updateProfile,
    changePassword,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// ── Static/specific routes MUST come before dynamic /:id ──────────────────────
// If /:id is registered first, Express path-to-regexp throws
// "Missing parameter name" when it tries to parse "/profile" as a param segment.
router.put("/profile",         protect, updateProfile);
router.put("/change-password", protect, changePassword);

// ── Dynamic route last ─────────────────────────────────────────────────────────
router.get("/:id", getUserById);

module.exports = router;
