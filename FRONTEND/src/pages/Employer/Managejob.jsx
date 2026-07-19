import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,LayoutDashboard, Plus, Users, Building2,
  Loader, Pencil, Trash2, ToggleLeft, ToggleRight,
  MapPin, Clock, Search, X
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { formatSalary, timeAgo, getJobTypeStyle, getInitials } from "../../utils/Helper";
import EmployerNav from "../../components/EmployerNav";
import toast from "react-hot-toast";

// Reusable edit modal
const EditModal = ({ job, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: job.title || "",
    location: job.location || "",
    type: job.type || "",
    salaryMin: job.salaryMin || "",
    salaryMax: job.salaryMax || "",
    description: job.description || "",
    requirements: job.requirements || "",
  });
  const [saving, setSaving] = useState(false);
  const { JOB_TYPES } = require("../../utils/data");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.put(API.JOB_BY_ID(job._id), {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      });
      onSave(data);
      toast.success("Job updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Edit Job</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "Title", name: "title", type: "text" },
            { label: "Location", name: "location", type: "text" },
            { label: "Min Salary", name: "salaryMin", type: "number" },
            { label: "Max Salary", name: "salaryMax", type: "number" },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
              <input
                type={type}
                value={form[name]}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Job Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              {["Remote", "Full-Time", "Part-Time", "Contract", "Internship"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Requirements</label>
            <textarea
              value={form.requirements}
              onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : null} Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ManageJobs = () => {
  const { user, logout, isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isEmployer) { navigate("/find-jobs"); return; }
    fetchJobs();
  }, []); // eslint-disable-line

  const fetchJobs = async () => {
    try {
      const { data } = await axiosInstance.get(API.MY_JOBS);
      setJobs(data);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (jobId) => {
    setTogglingId(jobId);
    try {
      const { data } = await axiosInstance.put(API.TOGGLE_JOB_STATUS(jobId));
      setJobs((prev) => prev.map((j) => j._id === jobId ? { ...j, isClosed: data.isClosed } : j));
      toast.success(data.isClosed ? "Job closed" : "Job reopened");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    setDeletingId(jobId);
    try {
      await axiosInstance.delete(API.JOB_BY_ID(jobId));
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = (updatedJob) => {
    setJobs((prev) => prev.map((j) => j._id === updatedJob._id ? updatedJob : j));
    setEditingJob(null);
  };

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location || "").toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/employer-dashboard" },
    { label: "Post Job", icon: Plus, path: "/post-job" },
    { label: "Manage Jobs", icon: Briefcase, path: "/manage-jobs", active: true },
    { label: "Applicants", icon: Users, path: "/Applicants" },
    { label: "Company Profile", icon: Building2, path: "/company-profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors flex">

      <EmployerNav currentTab="manage" />

      <main className="flex-1 ml-60 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Jobs</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {jobs.length} total · {jobs.filter((j) => !j.isClosed).length} active
            </p>
          </div>
          <Link to="/post-job" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
            <Plus size={16} /> Post New Job
          </Link>
        </div>

        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{search ? "No matching jobs" : "No jobs posted yet"}</p>
            <Link to="/post-job" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              Post your first job →
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((job) => {
                const typeStyle = getJobTypeStyle(job.type);
                return (
                  <motion.div
                    key={job._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{job.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>{job.type}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.isClosed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {job.isClosed ? "Closed" : "Active"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} /> {job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          {formatSalary(job.salaryMin, job.salaryMax, "KSh")}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} /> {timeAgo(job.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle open/closed */}
                      <button
                        onClick={() => handleToggleStatus(job._id)}
                        disabled={togglingId === job._id}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title={job.isClosed ? "Reopen job" : "Close job"}
                      >
                        {togglingId === job._id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : job.isClosed ? (
                          <ToggleLeft size={18} />
                        ) : (
                          <ToggleRight size={18} className="text-green-500" />
                        )}
                      </button>

                      <button
                        onClick={() => setEditingJob(job)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(job._id)}
                        disabled={deletingId === job._id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === job._id ? <Loader size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </main>

      {editingJob && (
        <EditModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default ManageJobs;
