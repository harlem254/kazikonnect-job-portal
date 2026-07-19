const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const supabase = require("../config/supabase");

// ── Helper: generate JWT ──────────────────────────────────────────────────────
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "60d" });

// ── Helper: shape the user response object ────────────────────────────────────
const userResponse = (user, token) => ({
    _id:                user.id,
    name:               user.name,
    email:              user.email,
    role:               user.role,
    token,
    avatar:             user.avatar              || "",
    resume:             user.resume              || "",
    companyName:        user.company_name        || "",
    companyDescription: user.company_description || "",
    companyLogo:        user.company_logo        || "",
});

// ── @desc  Register new user
// ── @route POST /api/auth/register
// ── @access Public
exports.register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            avatar,
            companyName,
            companyDescription,
            companyLogo,
            resume,
        } = req.body;

        // ── Basic input validation ────────────────────────────────────────────
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Name, email, password, and role are required" });
        }

        if (!["jobseeker", "employer"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'jobseeker' or 'employer'" });
        }

        // ── Check for existing email ──────────────────────────────────────────
        const { data: existing, error: lookupError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle();

        if (lookupError) {
            console.error("Register lookup error:", lookupError);
            return res.status(500).json({ message: "Database error during registration" });
        }

        if (existing) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }

        // ── Hash password ─────────────────────────────────────────────────────
        const hashedPassword = await bcrypt.hash(password, 12);

        // ── Insert new user ───────────────────────────────────────────────────
        const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
                name:                name.trim(),
                email:               email.toLowerCase().trim(),
                password:            hashedPassword,
                role,
                avatar:              avatar              || null,
                resume:              resume              || null,
                company_name:        companyName        || null,
                company_description: companyDescription || null,
                company_logo:        companyLogo        || null,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Register insert error:", insertError);
            // Catch unique-constraint race condition
            if (insertError.code === "23505") {
                return res.status(400).json({ message: "An account with this email already exists" });
            }
            return res.status(500).json({ message: "Failed to create account" });
        }

        return res.status(201).json(userResponse(newUser, generateToken(newUser.id)));
    } catch (err) {
        console.error("Register unexpected error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Login user
// ── @route POST /api/auth/login
// ── @access Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // ── Fetch user by email ───────────────────────────────────────────────
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle();

        if (error) {
            console.error("Login lookup error:", error);
            return res.status(500).json({ message: "Database error during login" });
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // ── Verify password ───────────────────────────────────────────────────
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        return res.json(userResponse(user, generateToken(user.id)));
    } catch (err) {
        console.error("Login unexpected error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ── @desc  Get logged-in user profile
// ── @route GET /api/auth/me
// ── @access Private
exports.getMe = async (req, res) => {
    // req.user is set by authMiddleware — just return it
    res.json(req.user);
};
