import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, ClipboardList, ArrowLeft, Loader, Building2,
  MapPin, Calendar, RefreshCw, ChevronRight, Clock,
  CheckCircle, XCircle, Eye, Search, FileText, Bookmark
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { timeAgo, formatDate, getJobTypeStyle, getInitials } from "../../utils/Helper";
import { getSupabaseImageUrl } from "../../utils/supabase";
import JobSeekerNav from "../../components/JobSeekerNav";
import toast from "react-hot-toast";

// ─── Status config — drives badge colour, icon, progress bar, and label ───────
const STATUS_CONFIG = {
  Applied: {
    label:    "Applied",
    icon:     Clock,
    bar:      "w-1/4",
    badge:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    border:   "border-l-blue-500",
    progress: "bg-blue-500",
    ring:     "ring-blue-500/20",
    step:     1,
  },
  "In Review": {
    label:    "In Review",
    icon:     Eye,
    bar:      "w-2/4",
    badge:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    border:   "border-l-amber-500",
    progress: "bg-amber-500",
    ring:     "ring-amber-500/20",
    step:     2,
  },
  Accepted: {
    label:    "Accepted",
    icon:     CheckCircle,
    bar:      "w-full",
    badge:    "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    border:   "border-l-green-500",
    progress: "bg-green-500",
    ring:     "ring-green-500/20",
    step:     3,
  },
  Rejected: {
    label:    "Rejected",
    icon:     XCircle,
    bar:      "w-full",
    badge:    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    border:   "border-l-red-500",
    progress: "bg-red-500",
    ring:     "ring-red-500/20",
    step:     3,
  },
};

const PIPELINE = ["Applied", "In Review", "Accepted / Rejected"];

// ─── Pipeline stepper ─────────────────────────────────────────────────────────
const PipelineStepper = ({ status }) => {
  const cfg   = STATUS_CONFIG[status] || STATUS_CONFIG["Applied"];
  const steps = PIPELINE;

  return (
    <div className="flex items-center gap-0 w-full mt-3">
      {steps.map((step, i) => {
        const done    = cfg.step > i;
        const active  = cfg.step === i + 1;
        const isLast  = i === steps.length - 1;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${done || active
                  ? `${cfg.progress} border-transparent text-white`
                  : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500"
                }`}
              >
                {done && !active ? "✓" : i + 1}
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight hidden sm:block
                ${done || active ? "text-gray-700 dark:text-slate-200" : "text-gray-400 dark:text-slate-500"}`}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-colors
                ${done ? cfg.progress : "bg-gray-200 dark:bg-slate-700"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Single application card ──────────────────────────────────────────────────
const ApplicationCard = ({ app }) => {
  const cfg      = STATUS_CONFIG[app.status] || STATUS_CONFIG["Applied"];
  const StatusIcon = cfg.icon;
  const job      = app.job || {};
  const company  = job.company || {};
  const typeStyle = getJobTypeStyle(job.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700
        border-l-4 ${cfg.border} shadow-sm hover:shadow-md dark:hover:shadow-slate-900/40
        transition-all duration-200 overflow-hidden ring-1 ${cfg.ring}`}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          {/* Logo + job info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
              {company.companyLogo ? (
                <img src={getSupabaseImageUrl(company.companyLogo)} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500">
                  {getInitials(company.companyName || company.name || "Co")}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                to={`/job/${job._id || job.id}`}
                className="font-semibold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
              >
                {job.title || "Job Title"}
              </Link>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                {company.companyName || company.name || "Company"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                    <MapPin size={10} /> {job.location}
                  </span>
                )}
                {job.type && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>
                    {job.type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}>
            <StatusIcon size={12} />
            {cfg.label}
          </div>
        </div>

        {/* Pipeline stepper */}
        <PipelineStepper status={app.status} />

        {/* Bottom meta row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
              <Calendar size={11} /> Applied {timeAgo(app.createdAt)}
            </span>
            {app.updatedAt && app.updatedAt !== app.createdAt && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                <RefreshCw size={10} /> Updated {timeAgo(app.updatedAt)}
              </span>
            )}
          </div>
          <Link
            to={`/job/${job._id || job.id}`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View Job <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Status-specific message strip */}
      {app.status === "Accepted" && (
        <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-900/40 px-5 py-2.5">
          <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle size={13} />
            Congratulations! The employer has accepted your application. Expect to hear from them soon.
          </p>
        </div>
      )}
      {app.status === "Rejected" && (
        <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/40 px-5 py-2.5">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <XCircle size={13} />
            This application was not successful. Keep applying — the right role is out there.
          </p>
        </div>
      )}
      {app.status === "In Review" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/40 px-5 py-2.5">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Eye size={13} />
            A hiring manager is reviewing your profile. Stay patient!
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const MyApplications = () => {
  const { isAuthenticated, isJobSeeker, user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lastUpdated, setLastUpdated]   = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data } = await axiosInstance.get(API.MY_APPLICATIONS);
      setApplications(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error("Failed to load applications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isJobSeeker)     { navigate("/find-jobs"); return; }
    fetchApplications();
  }, []); // eslint-disable-line

  // Real-time polling — refresh every 30 seconds silently
  useEffect(() => {
    const interval = setInterval(() => fetchApplications(true), 30000);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = applications.filter((app) => {
    const matchStatus = statusFilter === "All" || app.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      app.job?.title?.toLowerCase().includes(q) ||
      app.job?.company?.companyName?.toLowerCase().includes(q) ||
      app.job?.company?.name?.toLowerCase().includes(q) ||
      app.job?.location?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Summary counts ────────────────────────────────────────────────────────
  const counts = {
    All:        applications.length,
    Applied:    applications.filter((a) => a.status === "Applied").length,
    "In Review":applications.filter((a) => a.status === "In Review").length,
    Accepted:   applications.filter((a) => a.status === "Accepted").length,
    Rejected:   applications.filter((a) => a.status === "Rejected").length,
  };

  const FILTERS = ["All", "Applied", "In Review", "Accepted", "Rejected"];

  const filterStyle = (f) => {
    if (f === statusFilter) {
      const active = {
        All:          "bg-gray-800 dark:bg-white text-white dark:text-gray-900",
        Applied:      "bg-blue-600 text-white",
        "In Review":  "bg-amber-500 text-white",
        Accepted:     "bg-green-600 text-white",
        Rejected:     "bg-red-500 text-white",
      };
      return active[f] || "bg-gray-800 text-white";
    }
    return "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      <JobSeekerNav currentTab="applications" />

      <div className="lg:pl-60 pt-14 lg:pt-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8 space-y-6">

        {/* ── Page title + refresh ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                <ClipboardList size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-11">
              {applications.length > 0
                ? `${applications.length} application${applications.length !== 1 ? "s" : ""} · auto-refreshes every 30 s`
                : "Track every job you've applied to in one place"}
            </p>
          </div>

          <button
            onClick={() => fetchApplications(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── Summary stat pills ── */}
        {applications.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Applied",    count: counts["Applied"],     color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-900/20"  },
              { label: "In Review",  count: counts["In Review"],   color: "text-amber-600 dark:text-amber-400",bg: "bg-amber-50 dark:bg-amber-900/20" },
              { label: "Accepted",   count: counts["Accepted"],    color: "text-green-600 dark:text-green-400",bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "Rejected",   count: counts["Rejected"],    color: "text-red-600 dark:text-red-400",   bg: "bg-red-50 dark:bg-red-900/20"    },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by job title, company, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${filterStyle(f)}`}
              >
                {f}
                {counts[f] > 0 && (
                  <span className="ml-1.5 opacity-70">{counts[f]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Last updated notice ── */}
        {lastUpdated && !loading && (
          <p className="text-xs text-gray-400 dark:text-slate-600 -mt-2 flex items-center gap-1">
            <Clock size={11} /> Last updated {formatDate(lastUpdated)} at {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Loading your applications…</p>
          </div>

        ) : applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-center px-6"
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">No applications yet</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xs">
              Start applying to jobs and all your applications will appear here with live status updates.
            </p>
            <Link
              to="/find-jobs"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-blue-500/20"
            >
              <Search size={15} /> Browse Jobs
            </Link>
          </motion.div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <Search className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">No matching applications</p>
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); }}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>

        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filtered.map((app) => (
                <ApplicationCard key={app._id || app.id} app={app} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Bottom nav links ── */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { to: "/find-jobs",  icon: Search,   label: "Browse Jobs", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"       },
            { to: "/saved-jobs", icon: Bookmark, label: "Saved Jobs",  color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400" },
            { to: "/profile",    icon: FileText, label: "My Profile",  color: "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300"         },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80 ${color}`}
            >
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>

      </div>
      </div>
    </div>
  );
};

export default MyApplications;
