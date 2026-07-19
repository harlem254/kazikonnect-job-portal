const supabase = require("../config/supabase");

// ── @desc  Create a new job posting
// ── @route POST /api/jobs
// ── @access Private (employer)
exports.createJob = async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ message: "Only employers can post jobs" });
        }

        const { title, description, requirements, location, category, type, salaryMin, salaryMax } = req.body;

        if (!title || !description || !requirements || !type) {
            return res.status(400).json({ message: "title, description, requirements, and type are required" });
        }

        const { data: job, error } = await supabase
            .from("jobs")
            .insert({
                title,
                description,
                requirements,
                location:   location   || null,
                category:   category   || null,
                type,
                company_id: req.user._id,
                salary_min: salaryMin  || null,
                salary_max: salaryMax  || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Create job error:", error);
            return res.status(500).json({ message: "Failed to create job" });
        }

        return res.status(201).json(normaliseJob(job));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get all jobs with search and filters (public)
// ── @route GET /api/jobs
exports.getJobs = async (req, res) => {
    try {
        const { search, category, type, location, salaryMin, salaryMax, page = 1, limit = 12 } = req.query;

        let query = supabase
            .from("jobs")
            .select(`
                *,
                company:users!jobs_company_id_fkey(id, name, company_name, company_logo)
            `, { count: "exact" })
            .eq("is_closed", false)
            .order("created_at", { ascending: false });

        if (search) {
            // ilike is case-insensitive LIKE in PostgreSQL via supabase-js
            query = query.or(
                `title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
            );
        }

        if (category) query = query.eq("category", category);
        if (type)     query = query.eq("type", type);
        if (location) query = query.ilike("location", `%${location}%`);

        if (salaryMin) query = query.gte("salary_min", parseInt(salaryMin));
        if (salaryMax) query = query.lte("salary_max", parseInt(salaryMax));

        const pageNum  = parseInt(page);
        const pageSize = parseInt(limit);
        const from = (pageNum - 1) * pageSize;
        const to   = from + pageSize - 1;

        query = query.range(from, to);

        const { data: jobs, error, count } = await query;

        if (error) {
            console.error("Get jobs error:", error);
            return res.status(500).json({ message: "Failed to fetch jobs" });
        }

        return res.json({
            jobs:  (jobs || []).map(normaliseJob),
            total: count || 0,
            page:  pageNum,
            pages: Math.ceil((count || 0) / pageSize),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get single job by ID
// ── @route GET /api/jobs/:id
exports.getJobById = async (req, res) => {
    try {
        const { data: job, error } = await supabase
            .from("jobs")
            .select(`
                *,
                company:users!jobs_company_id_fkey(id, name, email, company_name, company_logo, company_description)
            `)
            .eq("id", req.params.id)
            .maybeSingle();

        if (error) {
            console.error("Get job by id error:", error);
            return res.status(500).json({ message: "Failed to fetch job" });
        }

        if (!job) return res.status(404).json({ message: "Job not found" });

        return res.json(normaliseJob(job));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get jobs posted by the logged-in employer
// ── @route GET /api/jobs/my-jobs
exports.getMyJobs = async (req, res) => {
    try {
        if (req.user.role !== "employer") {
            return res.status(403).json({ message: "Only employers can view their jobs" });
        }

        const { data: jobs, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("company_id", req.user._id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Get my jobs error:", error);
            return res.status(500).json({ message: "Failed to fetch jobs" });
        }

        return res.json((jobs || []).map(normaliseJob));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Update a job posting
// ── @route PUT /api/jobs/:id
exports.updateJob = async (req, res) => {
    try {
        // Verify ownership
        const { data: existing, error: fetchError } = await supabase
            .from("jobs")
            .select("id, company_id")
            .eq("id", req.params.id)
            .maybeSingle();

        if (fetchError || !existing) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (existing.company_id !== req.user._id) {
            return res.status(403).json({ message: "Not authorized to update this job" });
        }

        const { title, description, requirements, location, category, type, salaryMin, salaryMax } = req.body;

        const updates = {};
        if (title        !== undefined) updates.title        = title;
        if (description  !== undefined) updates.description  = description;
        if (requirements !== undefined) updates.requirements = requirements;
        if (location     !== undefined) updates.location     = location;
        if (category     !== undefined) updates.category     = category;
        if (type         !== undefined) updates.type         = type;
        if (salaryMin    !== undefined) updates.salary_min   = salaryMin;
        if (salaryMax    !== undefined) updates.salary_max   = salaryMax;

        const { data: updated, error: updateError } = await supabase
            .from("jobs")
            .update(updates)
            .eq("id", req.params.id)
            .select()
            .single();

        if (updateError) {
            console.error("Update job error:", updateError);
            return res.status(500).json({ message: "Failed to update job" });
        }

        return res.json(normaliseJob(updated));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Delete a job posting
// ── @route DELETE /api/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from("jobs")
            .select("id, company_id")
            .eq("id", req.params.id)
            .maybeSingle();

        if (fetchError || !existing) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (existing.company_id !== req.user._id) {
            return res.status(403).json({ message: "Not authorized to delete this job" });
        }

        const { error: deleteError } = await supabase
            .from("jobs")
            .delete()
            .eq("id", req.params.id);

        if (deleteError) {
            console.error("Delete job error:", deleteError);
            return res.status(500).json({ message: "Failed to delete job" });
        }

        return res.json({ message: "Job deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Toggle job open/closed
// ── @route PUT /api/jobs/:id/toggle-status
exports.toggleJobStatus = async (req, res) => {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from("jobs")
            .select("id, company_id, is_closed")
            .eq("id", req.params.id)
            .maybeSingle();

        if (fetchError || !existing) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (existing.company_id !== req.user._id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { data: updated, error: updateError } = await supabase
            .from("jobs")
            .update({ is_closed: !existing.is_closed })
            .eq("id", req.params.id)
            .select()
            .single();

        if (updateError) {
            console.error("Toggle job status error:", updateError);
            return res.status(500).json({ message: "Failed to update status" });
        }

        return res.json(normaliseJob(updated));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── Internal: map snake_case DB columns → camelCase API response ──────────────
function normaliseJob(j) {
    if (!j) return null;
    return {
        _id:          j.id,
        id:           j.id,
        title:        j.title,
        description:  j.description,
        requirements: j.requirements,
        location:     j.location   || "",
        category:     j.category   || "",
        type:         j.type,
        salaryMin:    j.salary_min || null,
        salaryMax:    j.salary_max || null,
        isClosed:     j.is_closed,
        createdAt:    j.created_at,
        updatedAt:    j.updated_at,
        // Nested company (present when joined)
        company: j.company
            ? {
                  _id:                j.company.id,
                  name:               j.company.name,
                  companyName:        j.company.company_name        || "",
                  companyLogo:        j.company.company_logo        || "",
                  companyDescription: j.company.company_description || "",
                  email:              j.company.email               || "",
              }
            : undefined,
    };
}
