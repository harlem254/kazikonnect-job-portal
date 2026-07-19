const express = require("express");
const {
    createJob,
    getJobs,
    getJobById,
    getMyJobs,
    updateJob,
    deleteJob,
    toggleJobStatus,
} = require("../controllers/jobController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.get("/my-jobs", protect, getMyJobs);
router.get("/:id", getJobById);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.put("/:id/toggle-status", protect, toggleJobStatus);
router.delete("/:id", protect, deleteJob);

module.exports = router;
