-- =============================================================
--  KAZIKONNECT  –  Supabase / PostgreSQL Schema
--  Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
--  to create all required tables from scratch.
-- =============================================================

-- Enable UUID extension (already on by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- USERS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT        NOT NULL,
    email               TEXT        NOT NULL UNIQUE,
    password            TEXT        NOT NULL,          -- bcrypt hash
    role                TEXT        NOT NULL CHECK (role IN ('jobseeker', 'employer')),
    avatar              TEXT,
    resume              TEXT,
    -- employer-only fields
    company_name        TEXT,
    company_description TEXT,
    company_logo        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------
-- JOBS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id           BIGSERIAL   PRIMARY KEY,
    title        TEXT        NOT NULL,
    description  TEXT        NOT NULL,
    requirements TEXT        NOT NULL,
    location     TEXT,
    category     TEXT,
    type         TEXT        NOT NULL CHECK (type IN ('Remote', 'Full-Time', 'Part-Time', 'Internship', 'Contract')),
    company_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    salary_min   INTEGER,
    salary_max   INTEGER,
    is_closed    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast employer look-ups
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs(company_id);
-- Index for search queries
CREATE INDEX IF NOT EXISTS jobs_title_idx      ON jobs USING gin(to_tsvector('english', title));

-- -------------------------------------------------------------
-- APPLICATIONS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id           BIGSERIAL   PRIMARY KEY,
    job_id       BIGINT      NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume       TEXT,
    cover_letter TEXT,                                          -- optional cover letter
    status       TEXT        NOT NULL DEFAULT 'Applied'
                             CHECK (status IN ('Applied', 'In Review', 'Rejected', 'Accepted')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, applicant_id)   -- prevent duplicate applications
);

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS applications_job_id_idx       ON applications(job_id);
CREATE INDEX IF NOT EXISTS applications_applicant_id_idx ON applications(applicant_id);

-- -------------------------------------------------------------
-- SAVED JOBS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_jobs (
    id           BIGSERIAL   PRIMARY KEY,
    jobseeker_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id       BIGINT      NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (jobseeker_id, job_id)   -- prevent duplicate saves
);

CREATE INDEX IF NOT EXISTS saved_jobs_jobseeker_id_idx ON saved_jobs(jobseeker_id);

-- =============================================================
-- Row Level Security (RLS) — optional but recommended
-- Disable for service-role key (our backend uses service role,
-- so RLS is bypassed automatically).
-- Enable these policies if you later expose the anon key.
-- =============================================================
-- ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_jobs   ENABLE ROW LEVEL SECURITY;
