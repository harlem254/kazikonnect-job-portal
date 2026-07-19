import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Briefcase, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, Loader, Building2, Banknote,
  LayoutGrid, List, ChevronDown, X
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { formatSalary, timeAgo, getJobTypeStyle, getInitials } from "../../utils/Helper";
import { JOB_TYPES } from "../../utils/data";
import demoJobs from "../../utils/demoJobs";
import JobSeekerNav from "../../components/JobSeekerNav";
import toast from "react-hot-toast";

// ─── Job Card ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, savedIds, onToggleSave, onView, appliedIds }) => {
  const isSaved = savedIds.has(job._id);
  const isApplied = job.status === "Applied" || appliedIds.has(job._id);
  const typeStyle = getJobTypeStyle(job.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-slate-900/40 transition-all duration-200 cursor-pointer group flex flex-col gap-4"
      onClick={() => onView(job._id)}
    >
      {/* Top row: logo + title + bookmark */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
            {job.company?.companyLogo ? (
              <img src={job.company.companyLogo} alt="" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
                {getInitials(job.company?.companyName || "Co")}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
              {job.company?.companyName || job.company?.name || "Company"}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(job._id, isSaved); }}
          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
            isSaved ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:text-blue-500 hover:bg-blue-50"
          }`}
        >
          {isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
        </button>
      </div>

      {/* Middle row: badges */}
      <div className="flex flex-wrap gap-2">
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
            <MapPin size={10} /> {job.location}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${typeStyle}`}>
          {job.type}
        </span>
        {job.category && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
            <Briefcase size={10} /> {job.category}
          </span>
        )}
      </div>

      {/* Bottom row: salary + action */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-700">
        <div className="flex items-center gap-1 text-gray-900 dark:text-white font-bold text-sm">
          <Banknote size={14} className="text-green-500 shrink-0" />
          {formatSalary(job.salaryMin, job.salaryMax, "KSh")}
        </div>
        {isApplied ? (
          <span className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-lg cursor-default">
            Applied
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onView(job._id); }}
            className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Apply Now
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Accordion section for sidebar ───────────────────────────────────────────
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-800 dark:text-slate-200"
      >
        {title}
        <ChevronDown size={15} className={`text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const JobSeekerDashboard = () => {
  const { user, isAuthenticated, isJobSeeker, logout } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Search banner state (controlled separately so search fires on button click)
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // Sidebar filter state
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  // Active API params (committed on search/apply filter)
  const [activeParams, setActiveParams] = useState({
    search: "", location: "", types: [], salaryMin: "", salaryMax: "",
  });

  const fetchJobs = useCallback(async (params, page = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit: 12 });
      if (params.search) qs.set("search", params.search);
      if (params.location) qs.set("location", params.location);
      if (params.types?.length === 1) qs.set("type", params.types[0]);
      if (params.salaryMin) qs.set("salaryMin", params.salaryMin);
      if (params.salaryMax) qs.set("salaryMax", params.salaryMax);

      const { data } = await axiosInstance.get(`${API.JOBS}?${qs}`);
      const results = data.jobs || [];
      setJobs(results.length > 0 ? results : demoJobs);
      setPagination({ page: data.page || 1, pages: data.pages || 1, total: data.total || demoJobs.length });
    } catch {
      setJobs(demoJobs);
      setPagination({ page: 1, pages: 1, total: demoJobs.length });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSavedIds = useCallback(async () => {
    if (!isAuthenticated || !isJobSeeker) return;
    try {
      const { data } = await axiosInstance.get(API.SAVED_JOBS);
      setSavedIds(new Set(data.map((s) => s.job?._id)));
    } catch { /* silent */ }
  }, [isAuthenticated, isJobSeeker]);

  useEffect(() => {
    fetchJobs(activeParams, 1);
    fetchSavedIds();
  }, []); // eslint-disable-line

  // Fire when sidebar filters change (types or salary)
  const applyFilters = (overrides = {}) => {
    const next = {
      search: searchInput,
      location: locationInput,
      types: selectedTypes,
      salaryMin,
      salaryMax,
      ...overrides,
    };
    setActiveParams(next);
    fetchJobs(next, 1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handleTypeToggle = (type) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(next);
    applyFilters({ types: next });
  };

  const handleSalaryApply = () => applyFilters();

  const handleClearAll = () => {
    setSearchInput("");
    setLocationInput("");
    setSelectedTypes([]);
    setSalaryMin("");
    setSalaryMax("");
    const empty = { search: "", location: "", types: [], salaryMin: "", salaryMax: "" };
    setActiveParams(empty);
    fetchJobs(empty, 1);
  };

  const handlePageChange = (p) => {
    fetchJobs(activeParams, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleSave = async (jobId, isSaved) => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isJobSeeker) { toast.error("Only job seekers can save jobs"); return; }
    try {
      if (isSaved) {
        await axiosInstance.delete(API.UNSAVE_JOB(jobId));
        setSavedIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
        toast.success("Removed from saved jobs");
      } else {
        await axiosInstance.post(API.SAVED_JOBS, { jobId });
        setSavedIds((prev) => new Set([...prev, jobId]));
        toast.success("Job saved!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const hasActiveFilters = selectedTypes.length > 0 || salaryMin || salaryMax || searchInput || locationInput;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      <JobSeekerNav currentTab="browse" />

      {/* Content — offset for desktop sidebar, top bar on tablet, bottom bar on mobile */}
      <div className="lg:pl-60 pt-0 lg:pt-0">
        <div className="pt-14 lg:pt-0">

      {/* ── Top sub-header (desktop only) ── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Browse Jobs</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Discover open positions across Kenya and beyond
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 sm:pb-8">

        {/* ── Search Banner ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Find Your Dream Job</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Discover {pagination.total > 0 ? `${pagination.total.toLocaleString()}` : "thousands of"} open positions from top companies worldwide.
          </p>

          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-col md:flex-row items-stretch gap-0 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm">
              {/* Keyword */}
              <div className="flex items-center gap-2 flex-1 px-4 py-3">
                <Search size={18} className="text-gray-400 dark:text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, company, or keywords"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full text-sm outline-none text-gray-700 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
                />
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-600 self-stretch my-2" />

              {/* Location */}
              <div className="flex items-center gap-2 px-4 py-3 md:w-52 border-t border-gray-100 dark:border-slate-600 md:border-t-0">
                <MapPin size={16} className="text-gray-400 dark:text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="City or country"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full text-sm outline-none text-gray-700 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="m-1.5 px-7 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shrink-0"
              >
                Search Jobs
              </button>
            </div>
          </form>
        </div>

        {/* ── Grid: Sidebar + Results ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Sticky Sidebar Filters ── */}
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 self-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Filter Jobs</h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                  >
                    <X size={12} /> Clear All
                  </button>
                )}
              </div>

              {/* Job Type */}
              <FilterSection title="Job Type">
                <div className="space-y-2.5">
                  {JOB_TYPES.map((t) => (
                    <label key={t.value} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(t.value)}
                        onChange={() => handleTypeToggle(t.value)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Salary Range */}
              <FilterSection title="Salary Range">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-400 dark:text-slate-500 block mb-1">Min Salary (KSh)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 dark:text-slate-500 block mb-1">Max Salary (KSh)</label>
                    <input
                      type="number"
                      placeholder="e.g. 200000"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSalaryApply}
                    className="w-full py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Apply Salary Filter
                  </button>
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* ── RIGHT: Results ── */}
          <div className="flex-1 min-w-0">

            {/* Sub-header row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{jobs.length}</span> job{jobs.length !== 1 ? "s" : ""}
                {pagination.total > jobs.length && (
                  <span className="text-gray-400 dark:text-slate-500"> of {pagination.total.toLocaleString()}</span>
                )}
              </p>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"}`}
                  title="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"}`}
                  title="List view"
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Job grid / list */}
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-28 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <Briefcase className="w-12 h-12 text-gray-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">No jobs found</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters</p>
                <button onClick={handleClearAll} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className={viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "flex flex-col gap-3"
                }>
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      savedIds={savedIds}
                      appliedIds={appliedIds}
                      onToggleSave={handleToggleSave}
                      onView={(id) => navigate(`/job/${id}`)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
