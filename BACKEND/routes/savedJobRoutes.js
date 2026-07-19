const express = require("express");
const {
    saveJob,
    unsaveJob,
    getSavedJobs,
    checkSaved,
} = require("../controllers/savedJobController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getSavedJobs);
router.get("/check/:jobId", protect, checkSaved);
router.post("/", protect, saveJob);
router.delete("/:jobId", protect, unsaveJob);

module.exports = router;
