import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Briefcase, Banknote, Building2,
  Bookmark, BookmarkCheck, Send, Loader, CheckCircle,
  AlertCircle, Calendar, Award, ChevronRight, X,
  FileText, ClipboardList
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { formatSalary, formatDate, getJobTypeStyle, timeAgo, getInitials } from "../../utils/Helper";
import { getSupabaseImageUrl } from "../../utils/supabase";
import demoJobs from "../../utils/demoJobs";
import toast from "react-hot-toast";

// ─── Overview row item ────────────────────────────────────────────────────────
const OverviewItem = ({ icon: Icon, label, value, iconColor }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
      <Icon size={16} />
    </div>
    <div>
      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  </div>
);

// ─── Bullet list section ──────────────────────────────────────────────────────
const BulletSection = ({ title, items, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6"
  >
    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

// ─── Cover Letter Modal ───────────────────────────────────────────────────────
const CoverLetterModal = ({ job, onClose, onSubmit, submitting }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const MAX = 2000;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <FileText size={17} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Apply for this Job</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate max-w-[240px]">
                  {job?.title} · {job?.company?.companyName || job?.company?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 tracking-wide mb-2">
              Cover Letter <span className="font-normal text-gray-400">(optional but recommended)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value.slice(0, MAX))}
              rows={8}
              placeholder={`Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job?.title} position at ${job?.company?.companyName || "your company"}...\n\nHighlight your relevant experience, skills, and why you're the right fit.`}
              className="w-full px-4 py-3 text-sm text-gray-800 dark:text-slate-100 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none leading-relaxed placeholder-gray-400 dark:placeholder-slate-500"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Paste or draft your tailored cover letter above
              </p>
              <span className={`text-xs font-medium ${coverLetter.length > MAX * 0.9 ? "text-orange-500" : "text-gray-400 dark:text-slate-500"}`}>
                {coverLetter.length}/{MAX}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-medium border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(coverLetter)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-blue-500/20"
            >
              {submitting ? (
                <><Loader size={15} className="animate-spin" /> Submitting...</>
              ) : (
                <><Send size={15} /> Confirm Submission</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isJobSeeker, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Check demo data first (IDs start with "d")
      const demoMatch = demoJobs.find((j) => j._id === jobId);
      if (demoMatch) {
        setJob(demoMatch);
        setLoading(false);
        return;
      }

      // Otherwise fetch from API
      try {
        const { data } = await axiosInstance.get(API.JOB_BY_ID(jobId));
        setJob(data);

        if (isAuthenticated && isJobSeeker) {
          const [savedRes, appliedRes] = await Promise.all([
            axiosInstance.get(API.CHECK_SAVED(jobId)),
            axiosInstance.get(API.CHECK_APPLICATION(jobId)),
          ]);
          setIsSaved(savedRes.data.saved);
          setHasApplied(appliedRes.data.applied);
        }
      } catch {
        toast.error("Job not found");
        navigate("/find-jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, isAuthenticated, isJobSeeker]); // eslint-disable-line

  const handleSaveToggle = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isJobSeeker) { toast.error("Only job seekers can save jobs"); return; }
    setSavingJob(true);
    try {
      if (isSaved) {
        await axiosInstance.delete(API.UNSAVE_JOB(jobId));
        setIsSaved(false);
        toast.success("Removed from saved jobs");
      } else {
        await axiosInstance.post(API.SAVED_JOBS, { jobId });
        setIsSaved(true);
        toast.success("Job saved!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setSavingJob(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isJobSeeker) { toast.error("Only job seekers can apply"); return; }
    setShowModal(true);
  };

  const handleSubmitApplication = async (coverLetter) => {
    setApplying(true);
    try {
      await axiosInstance.post(API.APPLICATIONS, {
        jobId,
        resume: user?.resume || "",
        coverLetter,
      });
      setHasApplied(true);
      setShowModal(false);
      toast.success("Application submitted! Track it in My Applications.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Application failed");
    } finally {
      setApplying(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!job) return null;

  const typeStyle = getJobTypeStyle(job.type);
  const isDemo = String(job._id || job.id || "").startsWith("d");

  // Normalise bullet arrays: for demo jobs use the arrays; for API jobs split description/requirements by newline
  const responsibilities = Array.isArray(job.responsibilities)
    ? job.responsibilities
    : (job.description || "").split("\n").filter(Boolean);

  const requirementsList = Array.isArray(job.requirements)
    ? job.requirements
    : (job.requirements || "").split("\n").filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      {/* ── Top Nav ── */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">KAZIKONNECT</span>
          </Link>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <button onClick={() => navigate("/find-jobs")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Find Jobs
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-600 dark:text-slate-300 font-medium truncate max-w-[180px]">{job.title}</span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Hero Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Company logo */}
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
              {job.company?.companyLogo ? (
                <img src={getSupabaseImageUrl(job.company.companyLogo)} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-xl font-bold text-gray-400 dark:text-slate-500">
                  {getInitials(job.company?.companyName || "Co")}
                </span>
              )}
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {job.title}
              </h1>
              <p className="text-gray-600 dark:text-slate-400 font-medium mt-1">
                {job.company?.companyName || job.company?.name}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                    <MapPin size={11} /> {job.location}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${typeStyle}`}>
                  {job.type}
                </span>
                {job.category && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
                    <Briefcase size={10} /> {job.category}
                  </span>
                )}
                {job.isClosed && (
                  <span className="inline-flex items-center text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                    Position Closed
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <span className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-slate-300 font-semibold">
                  <Banknote size={14} className="text-green-500" />
                  {formatSalary(job.salaryMin, job.salaryMax, "KSh")}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                  <Calendar size={13} className="text-blue-400" />
                  Posted {timeAgo(job.createdAt)}
                </span>
                {job.experience && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                    <Award size={13} className="text-amber-400" />
                    {job.experience} experience
                  </span>
                )}
              </div>
            </div>

            {/* Apply button — visible on desktop inline */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {job.isClosed ? (
                <span className="inline-flex items-center gap-2 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-4 py-2.5 rounded-xl font-medium">
                  <AlertCircle size={15} /> Closed
                </span>
              ) : hasApplied ? (
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-4 py-2.5 rounded-xl font-medium">
                    <CheckCircle size={15} /> Applied
                  </span>
                  <button
                    onClick={() => navigate("/my-applications")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ClipboardList size={12} /> Track in My Applications
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleApplyClick}
                  disabled={!isAuthenticated}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-blue-500/20"
                >
                  <Send size={15} /> Apply for this Job
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Main details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6"
            >
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Job Description</h2>
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </motion.div>

            {/* Key Responsibilities */}
            {responsibilities.length > 0 && (
              <BulletSection
                title="Key Responsibilities"
                items={responsibilities}
                delay={0.15}
              />
            )}

            {/* Requirements */}
            {requirementsList.length > 0 && (
              <BulletSection
                title="Requirements"
                items={requirementsList}
                delay={0.2}
              />
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-5">

            {/* Job Overview card */}
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 lg:sticky lg:top-24"
            >
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Job Overview</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Key details at a glance</p>

              <OverviewItem
                icon={Calendar}
                label="Date Posted"
                value={formatDate(job.createdAt)}
                iconColor="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              />
              <OverviewItem
                icon={Briefcase}
                label="Job Type"
                value={job.type || "—"}
                iconColor="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
              />
              <OverviewItem
                icon={Award}
                label="Experience"
                value={job.experience || "Not specified"}
                iconColor="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              />
              <OverviewItem
                icon={Banknote}
                label="Salary Range"
                value={formatSalary(job.salaryMin, job.salaryMax, "KSh")}
                iconColor="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
              />
              {job.location && (
                <OverviewItem
                  icon={MapPin}
                  label="Location"
                  value={job.location}
                  iconColor="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                />
              )}

              {/* Apply / Save — mobile + sidebar */}
              <div className="mt-5 space-y-2.5">
                {job.isClosed ? (
                  <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl p-3">
                    <AlertCircle size={15} /> This position is closed
                  </div>
                ) : hasApplied ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-xl p-3">
                    <CheckCircle size={15} /> You've already applied
                  </div>
                ) : (
                  <button
                    onClick={handleApplyClick}
                    disabled={applying}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-blue-500/20"
                  >
                    {applying ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                    Apply for this Job
                  </button>
                )}

                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 dark:text-slate-500 text-center">
                    <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</Link> to apply
                  </p>
                )}

                <button
                  onClick={handleSaveToggle}
                  disabled={savingJob}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    isSaved
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  {isSaved ? "Saved" : "Save Job"}
                </button>
              </div>
            </motion.div>

            {/* Company info card */}
            {(job.company?.companyName || job.company?.name) && (
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5"
              >
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">About the Company</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                    {job.company?.companyLogo ? (
                      <img src={getSupabaseImageUrl(job.company.companyLogo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
                        {getInitials(job.company?.companyName || "Co")}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {job.company?.companyName || job.company?.name}
                    </p>
                    {job.company?.email && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">{job.company.email}</p>
                    )}
                  </div>
                </div>
                {job.company?.companyDescription && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                    {job.company.companyDescription}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Cover Letter Modal ── */}
      {showModal && (
        <CoverLetterModal
          job={job}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitApplication}
          submitting={applying}
        />
      )}
    </div>
  );
};

export default JobDetails;
