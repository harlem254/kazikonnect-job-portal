const express = require("express");
const {
    applyForJob,
    getApplicationsByJob,
    getMyApplicants,
    getMyApplications,
    updateApplicationStatus,
    checkApplication,
} = require("../controllers/applicationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, applyForJob);
router.get("/my-applications", protect, getMyApplications);
router.get("/my-applicants", protect, getMyApplicants);
router.get("/check/:jobId", protect, checkApplication);
router.get("/job/:jobId", protect, getApplicationsByJob);
router.put("/:id/status", protect, updateApplicationStatus);

module.exports = router;
