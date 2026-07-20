require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

// Supabase client — imported here to validate env vars at startup
const supabase = require("./config/supabase");

const authRoutes        = require("./routes/authRoutes.js");
const jobRoutes         = require("./routes/jobRoutes.js");
const applicationRoutes = require("./routes/applicationRoutes.js");
const userRoutes        = require("./routes/userRoutes.js");
const savedJobRoutes    = require("./routes/savedJobRoutes.js");
const analyticsRoutes   = require("./routes/analyticsRoutes.js");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// With credentials: true, origin cannot be "*" — it must match the request Origin exactly.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        // Non-browser clients (curl, health checks) send no Origin header
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/jobs",         jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/saved-jobs",   savedJobRoutes);
app.use("/api/analytics",    analyticsRoutes);

// ── Static uploads ────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", db: "supabase" }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, async () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Database: Supabase (${process.env.SUPABASE_URL})`);

    // Startup connectivity check — confirms the DB is reachable and the table exists
    try {
        const { error } = await supabase.from("users").select("id").limit(1);
        if (error) {
            console.error("⚠️  Supabase connectivity check FAILED:", error.message);
            console.error("   Code:", error.code);
            console.error("   Hint:", error.hint || "Run config/schema.sql in your Supabase SQL editor");
        } else {
            console.log("✅  Supabase connected — users table is reachable");
        }
    } catch (e) {
        console.error("⚠️  Supabase startup check threw an exception:", e.message);
    }
});
