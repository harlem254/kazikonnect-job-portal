import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,LayoutDashboard,Plus,Briefcase,Building2, Loader, Search, ExternalLink, ChevronDown,
  Mail, FileText, Clock, X, User, MapPin, Calendar,
  CheckCircle, XCircle, Eye, ChevronRight,
  Award, BookOpen
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { timeAgo, formatDate, getInitials } from "../../utils/Helper";
import EmployerNav from "../../components/EmployerNav";
import toast from "react-hot-toast";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  Applied:     { color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500",   icon: Clock       },
  "In Review": { color: "bg-amber-100 text-amber-700", dot: "bg-amber-500",  icon: Eye         },
  Accepted:    { color: "bg-green-100 text-green-700", dot: "bg-green-500",  icon: CheckCircle },
  Rejected:    { color: "bg-red-100 text-red-700",     dot: "bg-red-500",    icon: XCircle     },
};

const STATUS_ACTIONS = ["Applied", "In Review", "Accepted", "Rejected"];
const STATUS_OPTIONS  = ["All", ...STATUS_ACTIONS];

// ─── Full-screen Applicant Detail Drawer ─────────────────────────────────────
const ApplicantDrawer = ({ app, onClose, onStatusChange, updatingId }) => {
  if (!app) return null;

  const applicant = app.applicant || {};
  const job       = app.job       || {};
  const meta      = STATUS_META[app.status] || STATUS_META["Applied"];
  const StatusIcon = meta.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer panel */}
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Applicant Details</span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-sm text-gray-500 truncate max-w-[180px]">{job.title}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Hero card */}
            <div className="px-6 pt-6 pb-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/30">
                    {applicant.avatar ? (
                      <img src={applicant.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">{getInitials(applicant.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold leading-tight">{applicant.name || "Applicant"}</h2>
                    <p className="text-blue-100 text-sm mt-0.5">{applicant.email}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 border border-white/30`}>
                        <StatusIcon size={11} />
                        {app.status}
                      </span>
                      <span className="text-xs text-blue-100 flex items-center gap-1">
                        <Calendar size={11} /> Applied {timeAgo(app.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job applied for */}
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Applied For</p>
                <p className="text-sm font-semibold text-gray-900">{job.title || "—"}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {job.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={10} /> {job.location}
                    </span>
                  )}
                  {job.type && (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {job.type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact details */}
            <Section title="Contact Information" icon={User}>
              <InfoRow icon={Mail} label="Email">
                <a href={`mailto:${applicant.email}`} className="text-sm text-blue-600 hover:underline">
                  {applicant.email}
                </a>
              </InfoRow>
              <InfoRow icon={Clock} label="Application Date">
                <span className="text-sm text-gray-700">{formatDate(app.createdAt)}</span>
              </InfoRow>
              {app.updatedAt && app.updatedAt !== app.createdAt && (
                <InfoRow icon={Calendar} label="Last Updated">
                  <span className="text-sm text-gray-700">{formatDate(app.updatedAt)}</span>
                </InfoRow>
              )}
            </Section>

            {/* Resume */}
            <Section title="Resume & Portfolio" icon={FileText}>
              {app.resume || applicant.resume ? (
                <a
                  href={app.resume || applicant.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-700">View Resume / CV</p>
                    <p className="text-xs text-blue-500 truncate">{app.resume || applicant.resume}</p>
                  </div>
                  <ExternalLink size={14} className="text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-gray-400 italic">No resume attached</p>
              )}
            </Section>

            {/* Cover letter */}
            {app.coverLetter && (
              <Section title="Cover Letter" icon={BookOpen}>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {app.coverLetter}
                  </p>
                </div>
              </Section>
            )}

            {/* Status management */}
            <Section title="Update Application Status" icon={Award}>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ACTIONS.map((s) => {
                  const sm  = STATUS_META[s];
                  const SI  = sm.icon;
                  const isActive = app.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => onStatusChange(app._id, s)}
                      disabled={updatingId === app._id || isActive}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all
                        ${isActive
                          ? `${sm.color} border-transparent ring-2 ring-offset-1 ${sm.dot.replace("bg-", "ring-")}`
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        }`}
                    >
                      {updatingId === app._id && !isActive
                        ? <Loader size={13} className="animate-spin" />
                        : <SI size={13} />
                      }
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Contextual message */}
              {app.status === "Accepted" && (
                <div className="mt-3 flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
                  <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-700 font-medium">
                    You've accepted this candidate. Reach out to them via email to arrange the next steps.
                  </p>
                </div>
              )}
              {app.status === "Rejected" && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">
                    This application has been declined. The candidate can see this status in their tracker.
                  </p>
                </div>
              )}
            </Section>

            <div className="h-8" />
          </div>

          {/* ── Footer action ── */}
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
            <a
              href={`mailto:${applicant.email}?subject=Re: Your application for ${job.title}`}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-blue-500/20"
            >
              <Mail size={15} /> Contact Applicant
            </a>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
  <div className="px-6 pb-5">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon size={13} className="text-gray-500" />
      </div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  </div>
);

// ─── Main ApplicationViewer page ──────────────────────────────────────────────
const ApplicationViewer = () => {
  const { user, logout, isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId]     = useState(null);
  const [selectedApp, setSelectedApp]   = useState(null); // drawer

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isEmployer)      { navigate("/find-jobs"); return; }
    fetchApplications();
  }, []); // eslint-disable-line

  const fetchApplications = async () => {
    try {
      const { data } = await axiosInstance.get(API.MY_APPLICANTS);
      setApplications(data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      const { data } = await axiosInstance.put(API.UPDATE_APPLICATION_STATUS(appId), { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => a._id === appId ? { ...a, status: data.status } : a)
      );
      // Keep drawer in sync
      if (selectedApp?._id === appId) {
        setSelectedApp((prev) => ({ ...prev, status: data.status }));
      }
      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const matchStatus = statusFilter === "All" || app.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      app.applicant?.name?.toLowerCase().includes(q) ||
      app.applicant?.email?.toLowerCase().includes(q) ||
      app.job?.title?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Status counts for filter bar
  const counts = STATUS_ACTIONS.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, { All: applications.length });

  const navItems = [
    { label: "Dashboard",       icon: LayoutDashboard, path: "/employer-dashboard" },
    { label: "Post Job",        icon: Plus,            path: "/post-job"           },
    { label: "Manage Jobs",     icon: Briefcase,       path: "/manage-jobs"        },
    { label: "Applicants",      icon: Users,           path: "/Applicants", active: true },
    { label: "Company Profile", icon: Building2,       path: "/company-profile"    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors flex">

      <EmployerNav currentTab="applicants" />

      {/* ── Main ── */}
      <main className="flex-1 ml-60 p-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Applicants</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {applications.length} total · click any card to view full details
            </p>
          </div>
        </div>

        {/* Stat pills */}
        {applications.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {STATUS_ACTIONS.map((s) => {
              const sm = STATUS_META[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
                  className={`rounded-2xl p-4 text-left transition-all border ${
                    statusFilter === s
                      ? `${sm.color} border-transparent ring-2 ring-offset-1`
                      : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:shadow-sm"
                  }`}
                >
                  <p className={`text-2xl font-bold ${statusFilter === s ? "" : "text-gray-900"}`}>
                    {counts[s] || 0}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${statusFilter === s ? "" : "text-gray-500"}`}>
                    {s}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, or job…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300 bg-white dark:bg-slate-800"
                }`}
              >
                {s}
                {s !== "All" && counts[s] > 0 && (
                  <span className="ml-1 opacity-70">{counts[s]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <Users className="w-12 h-12 text-gray-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">
              {search || statusFilter !== "All" ? "No matching applications" : "No applications yet"}
            </p>
          </div>

        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const sm = STATUS_META[app.status] || STATUS_META["Applied"];
              const StatusIcon = sm.icon;

              return (
                <motion.div
                  key={app._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm dark:hover:shadow-slate-900/30 transition-shadow group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                    {app.applicant?.avatar ? (
                      <img src={app.applicant.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{getInitials(app.applicant?.name)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{app.applicant?.name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sm.color}`}>
                        <StatusIcon size={10} /> {app.status}
                      </span>
                      {app.coverLetter && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                          Cover Letter
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {app.job?.title}
                      {app.job?.location && <> · <MapPin size={9} className="inline mb-0.5" /> {app.job.location}</>}
                      <span className="text-gray-400"> · {timeAgo(app.createdAt)}</span>
                    </p>
                  </div>

                  {/* Quick status selector */}
                  <div className="shrink-0 hidden sm:flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        disabled={updatingId === app._id}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100 appearance-none pr-6 cursor-pointer disabled:opacity-50"
                      >
                        {STATUS_ACTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {updatingId === app._id
                        ? <Loader size={11} className="absolute right-1.5 top-2 animate-spin text-blue-500" />
                        : <ChevronDown size={10} className="absolute right-1.5 top-2 text-gray-400 pointer-events-none" />
                      }
                    </div>

                    {/* View full profile button */}
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <User size={12} /> View Profile
                    </button>
                  </div>

                  {/* Mobile: tap whole card to view */}
                  <button
                    className="sm:hidden p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                    onClick={() => setSelectedApp(app)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Applicant Detail Drawer ── */}
      {selectedApp && (
        <ApplicantDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
        />
      )}
    </div>
  );
};

export default ApplicationViewer;
