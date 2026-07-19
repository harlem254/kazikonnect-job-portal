const supabase = require("../config/supabase");

// ── @desc  Save a job
// ── @route POST /api/saved-jobs
exports.saveJob = async (req, res) => {
    try {
        if (req.user.role !== "jobseeker") {
            return res.status(403).json({ message: "Only job seekers can save jobs" });
        }

        const { jobId } = req.body;

        // Verify job exists
        const { data: job } = await supabase
            .from("jobs")
            .select("id")
            .eq("id", jobId)
            .maybeSingle();

        if (!job) return res.status(404).json({ message: "Job not found" });

        // Unique constraint handles duplicates
        const { data: saved, error } = await supabase
            .from("saved_jobs")
            .insert({ jobseeker_id: req.user._id, job_id: jobId })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return res.status(400).json({ message: "Job already saved" });
            }
            console.error("Save job error:", error);
            return res.status(500).json({ message: "Failed to save job" });
        }

        return res.status(201).json({ _id: saved.id, ...saved });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Unsave a job
// ── @route DELETE /api/saved-jobs/:jobId
exports.unsaveJob = async (req, res) => {
    try {
        const { error, count } = await supabase
            .from("saved_jobs")
            .delete({ count: "exact" })
            .eq("jobseeker_id", req.user._id)
            .eq("job_id", req.params.jobId);

        if (error) {
            console.error("Unsave job error:", error);
            return res.status(500).json({ message: "Failed to remove saved job" });
        }

        if (count === 0) {
            return res.status(404).json({ message: "Saved job not found" });
        }

        return res.json({ message: "Job removed from saved list" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get all saved jobs for logged-in jobseeker
// ── @route GET /api/saved-jobs
exports.getSavedJobs = async (req, res) => {
    try {
        const { data: saved, error } = await supabase
            .from("saved_jobs")
            .select(`
                id, created_at,
                job:jobs!saved_jobs_job_id_fkey(
                    id, title, location, type, category,
                    salary_min, salary_max, is_closed, created_at,
                    company:users!jobs_company_id_fkey(id, name, company_name, company_logo)
                )
            `)
            .eq("jobseeker_id", req.user._id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Get saved jobs error:", error);
            return res.status(500).json({ message: "Failed to fetch saved jobs" });
        }

        const normalised = (saved || []).map((s) => ({
            _id:       s.id,
            createdAt: s.created_at,
            job: s.job
                ? {
                      _id:      s.job.id,
                      title:    s.job.title,
                      location: s.job.location  || "",
                      type:     s.job.type       || "",
                      category: s.job.category   || "",
                      salaryMin: s.job.salary_min || null,
                      salaryMax: s.job.salary_max || null,
                      isClosed:  s.job.is_closed,
                      createdAt: s.job.created_at,
                      company: s.job.company
                          ? {
                                _id:         s.job.company.id,
                                name:        s.job.company.name,
                                companyName: s.job.company.company_name || "",
                                companyLogo: s.job.company.company_logo || "",
                            }
                          : null,
                  }
                : null,
        }));

        return res.json(normalised);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Check if a job is saved by the current user
// ── @route GET /api/saved-jobs/check/:jobId
exports.checkSaved = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("saved_jobs")
            .select("id")
            .eq("jobseeker_id", req.user._id)
            .eq("job_id", req.params.jobId)
            .maybeSingle();

        if (error) {
            console.error("Check saved error:", error);
            return res.status(500).json({ message: "Database error" });
        }

        return res.json({ saved: !!data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
