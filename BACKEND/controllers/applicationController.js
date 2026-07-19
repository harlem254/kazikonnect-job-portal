const supabase = require("../config/supabase");

// ── @desc  Apply for a job
// ── @route POST /api/applications
exports.applyForJob = async (req, res) => {
    try {
        if (req.user.role !== "jobseeker") {
            return res.status(403).json({ message: "Only job seekers can apply for jobs" });
        }

        const { jobId, resume, coverLetter } = req.body;

        // Cast to integer — Supabase BIGSERIAL requires a number, not a string
        const jobIdInt = parseInt(jobId, 10);
        if (!jobId || isNaN(jobIdInt)) {
            return res.status(400).json({ message: "Invalid job ID" });
        }

        // Verify job exists and is open
        const { data: job, error: jobError } = await supabase
            .from("jobs")
            .select("id, is_closed, company_id")
            .eq("id", jobIdInt)
            .maybeSingle();

        if (jobError || !job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.is_closed) {
            return res.status(400).json({ message: "This job is no longer accepting applications" });
        }

        // Insert — unique constraint (job_id, applicant_id) handles duplicate detection
        const { data: application, error: insertError } = await supabase
            .from("applications")
            .insert({
                job_id:       jobIdInt,
                applicant_id: req.user._id,
                resume:       resume || req.user.resume || null,
                cover_letter: coverLetter || null,
                status:       "Applied",
            })
            .select()
            .single();

        if (insertError) {
            if (insertError.code === "23505") {
                return res.status(400).json({ message: "You have already applied for this job" });
            }
            console.error("Apply error:", insertError);
            return res.status(500).json({ message: "Failed to submit application" });
        }

        return res.status(201).json(normaliseApp(application));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get applications for a specific job (employer view)
// ── @route GET /api/applications/job/:jobId
exports.getApplicationsByJob = async (req, res) => {
    try {
        // Verify employer owns the job
        const { data: job } = await supabase
            .from("jobs")
            .select("id, company_id")
            .eq("id", parseInt(req.params.jobId, 10))
            .maybeSingle();

        if (!job) return res.status(404).json({ message: "Job not found" });

        if (job.company_id !== req.user._id) {
            return res.status(403).json({ message: "Not authorized to view these applications" });
        }

        const { data: apps, error } = await supabase
            .from("applications")
            .select(`
                *,
                applicant:users!applications_applicant_id_fkey(id, name, email, avatar, resume),
                job:jobs!applications_job_id_fkey(id, title)
            `)
            .eq("job_id", parseInt(req.params.jobId, 10))
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Get applications by job error:", error);
            return res.status(500).json({ message: "Failed to fetch applications" });
        }

        return res.json((apps || []).map(normaliseApp));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get all applicants for all of employer's jobs
// ── @route GET /api/applications/my-applicants
exports.getMyApplicants = async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ message: "Only employers can view applicants" });
        }

        // Get all job IDs belonging to this employer
        const { data: myJobs } = await supabase
            .from("jobs")
            .select("id")
            .eq("company_id", req.user._id);

        if (!myJobs || myJobs.length === 0) return res.json([]);

        const jobIds = myJobs.map((j) => j.id);

        const { data: apps, error } = await supabase
            .from("applications")
            .select(`
                *,
                applicant:users!applications_applicant_id_fkey(id, name, email, avatar, resume),
                job:jobs!applications_job_id_fkey(id, title, location, type)
            `)
            .in("job_id", jobIds)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Get my applicants error:", error);
            return res.status(500).json({ message: "Failed to fetch applicants" });
        }

        return res.json((apps || []).map(normaliseApp));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get applications submitted by logged-in jobseeker
// ── @route GET /api/applications/my-applications
exports.getMyApplications = async (req, res) => {
    try {
        if (req.user.role !== "jobseeker") {
            return res.status(403).json({ message: "Only job seekers can view their applications" });
        }

        const { data: apps, error } = await supabase
            .from("applications")
            .select(`
                *,
                job:jobs!applications_job_id_fkey(
                    id, title, location, type, is_closed,
                    company:users!jobs_company_id_fkey(id, name, company_name, company_logo)
                )
            `)
            .eq("applicant_id", req.user._id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Get my applications error:", error);
            return res.status(500).json({ message: "Failed to fetch applications" });
        }

        return res.json((apps || []).map(normaliseApp));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Update application status (employer)
// ── @route PUT /api/applications/:id/status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["Applied", "In Review", "Rejected", "Accepted"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Verify the application belongs to one of this employer's jobs
        const { data: app } = await supabase
            .from("applications")
            .select(`id, status, job:jobs!applications_job_id_fkey(id, company_id)`)
            .eq("id", req.params.id)
            .maybeSingle();

        if (!app) return res.status(404).json({ message: "Application not found" });

        if (app.job.company_id !== req.user._id) {
            return res.status(403).json({ message: "Not authorized to update this application" });
        }

        const { data: updated, error } = await supabase
            .from("applications")
            .update({ status })
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) {
            console.error("Update application status error:", error);
            return res.status(500).json({ message: "Failed to update status" });
        }

        return res.json(normaliseApp(updated));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Check if current user applied for a specific job
// ── @route GET /api/applications/check/:jobId
exports.checkApplication = async (req, res) => {
    try {
        const { data: app, error } = await supabase
            .from("applications")
            .select("id, status")
            .eq("job_id", parseInt(req.params.jobId, 10))
            .eq("applicant_id", req.user._id)
            .maybeSingle();

        if (error) {
            console.error("Check application error:", error);
            return res.status(500).json({ message: "Failed to check application" });
        }

        return res.json({ applied: !!app, application: app ? normaliseApp(app) : null });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── Internal normaliser ───────────────────────────────────────────────────────
function normaliseApp(a) {
    if (!a) return null;
    const result = {
        _id:         a.id,
        id:          a.id,
        resume:      a.resume      || "",
        coverLetter: a.cover_letter || "",
        status:      a.status,
        createdAt:   a.created_at,
        updatedAt:   a.updated_at,
    };

    if (a.applicant) {
        result.applicant = {
            _id:    a.applicant.id,
            name:   a.applicant.name,
            email:  a.applicant.email,
            avatar: a.applicant.avatar || "",
            resume: a.applicant.resume || "",
        };
    }

    if (a.job) {
        result.job = {
            _id:      a.job.id,
            title:    a.job.title,
            location: a.job.location || "",
            type:     a.job.type     || "",
            isClosed: a.job.is_closed,
            company:  a.job.company
                ? {
                      _id:         a.job.company.id,
                      name:        a.job.company.name,
                      companyName: a.job.company.company_name || "",
                      companyLogo: a.job.company.company_logo || "",
                  }
                : undefined,
        };
    }

    return result;
}
