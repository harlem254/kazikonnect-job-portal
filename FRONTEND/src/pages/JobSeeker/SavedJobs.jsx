import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, MapPin, Clock, Trash2,
  Loader, Building2, Banknote
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { formatSalary, timeAgo, getJobTypeStyle } from "../../utils/Helper";
import { getSupabaseImageUrl } from "../../utils/supabase";
import JobSeekerNav from "../../components/JobSeekerNav";
import toast from "react-hot-toast";

const SavedJobs = () => {
  const { isAuthenticated, isJobSeeker } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isJobSeeker) { navigate("/find-jobs"); return; }
    fetchSavedJobs();
  }, []); // eslint-disable-line

  const fetchSavedJobs = async () => {
    try {
      const { data } = await axiosInstance.get(API.SAVED_JOBS);
      setSavedJobs(data);
    } catch {
      toast.error("Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId) => {
    setRemovingId(jobId);
    try {
      await axiosInstance.delete(API.UNSAVE_JOB(jobId));
      setSavedJobs((prev) => prev.filter((s) => s.job?._id !== jobId));
      toast.success("Removed from saved jobs");
    } catch {
      toast.error("Failed to remove job");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      <JobSeekerNav currentTab="saved" />

      {/* Content offset: lg sidebar + tablet top bar + mobile bottom bar */}
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">

          {/* Page heading */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saved Jobs</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>

          ) : savedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-center px-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Bookmark className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">No saved jobs yet</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Browse jobs and bookmark the ones you like
              </p>
              <button
                onClick={() => navigate("/find-jobs")}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Browse Jobs
              </button>
            </div>

          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {savedJobs.map((saved) => {
                  const job = saved.job;
                  if (!job) return null;
                  const typeStyle = getJobTypeStyle(job.type);

                  return (
                    <motion.div
                      key={saved._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm dark:hover:shadow-slate-900/30 transition-shadow"
                    >
                      {/* Clickable job info */}
                      <div
                        className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                        onClick={() => navigate(`/job/${job._id}`)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-slate-600">
                          {job.company?.companyLogo ? (
                            <img src={getSupabaseImageUrl(job.company.companyLogo)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                            {job.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {job.company?.companyName || job.company?.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>
                              {job.type}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                <MapPin size={10} /> {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                              <Banknote size={10} /> {formatSalary(job.salaryMin, job.salaryMax, "KSh")}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                              <Clock size={10} /> Saved {timeAgo(saved.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => navigate(`/job/${job._id}`)}
                          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                          View Job
                        </button>
                        <button
                          onClick={() => handleRemove(job._id)}
                          disabled={removingId === job._id}
                          className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove"
                        >
                          {removingId === job._id
                            ? <Loader size={16} className="animate-spin" />
                            : <Trash2 size={16} />
                          }
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedJobs;
