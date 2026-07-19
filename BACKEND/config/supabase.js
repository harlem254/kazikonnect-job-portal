const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the service-role key for server-side ops (bypasses RLS).
// Falls back to anon key if service role is not configured.
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "Missing Supabase environment variables. " +
        "Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are set in .env"
    );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        // We manage auth with our own JWT — disable Supabase session management
        persistSession:   false,
        autoRefreshToken: false,
    },
});

module.exports = supabase;
