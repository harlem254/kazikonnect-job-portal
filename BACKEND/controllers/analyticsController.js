const supabase = require("../config/supabase");

// ── @desc  Get analytics for the logged-in employer
// ── @route GET /api/analytics
exports.getAnalytics = async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ message: "Only employers can view analytics" });
        }

        const employerId = req.user._id;

        // All jobs for this employer
        const { data: myJobs, error: jobsError } = await supabase
            .from("jobs")
            .select("id, is_closed")
            .eq("company_id", employerId);

        if (jobsError) {
            console.error("Analytics jobs error:", jobsError);
            return res.status(500).json({ message: "Failed to fetch analytics" });
        }

        const jobIds     = (myJobs || []).map((j) => j.id);
        const totalJobs  = jobIds.length;
        const activeJobs = (myJobs || []).filter((j) => !j.is_closed).length;
        const closedJobs = totalJobs - activeJobs;

        if (jobIds.length === 0) {
            return res.json({
                totalJobsPosted:         0,
                activeJobs:              0,
                closedJobs:              0,
                totalApplicationsReceived: 0,
                totalHired:              0,
                inReview:                0,
                rejected:                0,
                recentApplications:      0,
            });
        }

        // All applications for this employer's jobs
        const { data: allApps, error: appsError } = await supabase
            .from("applications")
            .select("id, status, created_at")
            .in("job_id", jobIds);

        if (appsError) {
            console.error("Analytics applications error:", appsError);
            return res.status(500).json({ message: "Failed to fetch analytics" });
        }

        const apps = allApps || [];

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        return res.json({
            totalJobsPosted:           totalJobs,
            activeJobs,
            closedJobs,
            totalApplicationsReceived: apps.length,
            totalHired:                apps.filter((a) => a.status === "Accepted").length,
            inReview:                  apps.filter((a) => a.status === "In Review").length,
            rejected:                  apps.filter((a) => a.status === "Rejected").length,
            recentApplications:        apps.filter((a) => a.created_at >= sevenDaysAgo).length,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
