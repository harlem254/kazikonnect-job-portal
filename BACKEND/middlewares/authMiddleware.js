const jwt      = require("jsonwebtoken");
const supabase = require("../config/supabase");

// ── Middleware: protect routes with JWT ───────────────────────────────────────
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const token   = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user from Supabase (excludes password)
        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, role, avatar, resume, company_name, company_description, company_logo, created_at")
            .eq("id", decoded.id)
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        // Normalise field names so controllers can use _id / companyName as before
        req.user = {
            _id:                user.id,
            id:                 user.id,
            name:               user.name,
            email:              user.email,
            role:               user.role,
            avatar:             user.avatar              || "",
            resume:             user.resume              || "",
            companyName:        user.company_name        || "",
            companyDescription: user.company_description || "",
            companyLogo:        user.company_logo        || "",
        };

        return next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token invalid or expired" });
        }
        console.error("Auth middleware error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { protect };
