const bcrypt   = require("bcryptjs");
const supabase = require("../config/supabase");

// ── @desc  Get user profile by ID (public)
// ── @route GET /api/users/:id
exports.getUserById = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, role, avatar, resume, company_name, company_description, company_logo, created_at")
            .eq("id", req.params.id)
            .maybeSingle();

        if (error) {
            console.error("Get user by id error:", error);
            return res.status(500).json({ message: "Database error" });
        }

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json(normaliseUser(user));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Update current user profile
// ── @route PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar, resume, companyName, companyDescription, companyLogo } = req.body;

        const updates = {};
        if (name               !== undefined) updates.name                = name;
        if (avatar             !== undefined) updates.avatar              = avatar;
        if (resume             !== undefined) updates.resume              = resume;

        // Employer-only fields
        if (req.user.role === "employer") {
            if (companyName        !== undefined) updates.company_name        = companyName;
            if (companyDescription !== undefined) updates.company_description = companyDescription;
            if (companyLogo        !== undefined) updates.company_logo        = companyLogo;
        }

        const { data: updated, error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", req.user._id)
            .select("id, name, email, role, avatar, resume, company_name, company_description, company_logo")
            .single();

        if (error) {
            console.error("Update profile error:", error);
            return res.status(500).json({ message: "Failed to update profile" });
        }

        return res.json(normaliseUser(updated));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Change password
// ── @route PUT /api/users/change-password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both currentPassword and newPassword are required" });
        }

        // Fetch current hashed password
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("id, password")
            .eq("id", req.user._id)
            .maybeSingle();

        if (fetchError || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const hashed = await bcrypt.hash(newPassword, 12);

        const { error: updateError } = await supabase
            .from("users")
            .update({ password: hashed })
            .eq("id", req.user._id);

        if (updateError) {
            console.error("Change password error:", updateError);
            return res.status(500).json({ message: "Failed to update password" });
        }

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── Internal normaliser ───────────────────────────────────────────────────────
function normaliseUser(u) {
    return {
        _id:                u.id,
        name:               u.name,
        email:              u.email,
        role:               u.role,
        avatar:             u.avatar              || "",
        resume:             u.resume              || "",
        companyName:        u.company_name        || "",
        companyDescription: u.company_description || "",
        companyLogo:        u.company_logo        || "",
    };
}
