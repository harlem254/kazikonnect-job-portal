import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Plus, Users, Clock,
  ChevronRight, Loader, Building2,
  CheckCircle, Eye, LayoutDashboard
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { timeAgo, getInitials } from "../../utils/Helper";
import { getSupabaseImageUrl } from "../../utils/supabase";
import EmployerNav from "../../components/EmployerNav";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5"
  >
    <div className="mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? "—"}</p>
    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
  </motion.div>
);

const EmployerDashboard = () => {
  const { user, logout, isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isEmployer) { navigate("/find-jobs"); return; }
    fetchDashboardData();
  }, []); // eslint-disable-line

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, jobsRes, applicantsRes] = await Promise.all([
        axiosInstance.get(API.ANALYTICS),
        axiosInstance.get(API.MY_JOBS),
        axiosInstance.get(API.MY_APPLICANTS),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentJobs(jobsRes.data.slice(0, 5));
      setRecentApplicants(applicantsRes.data.slice(0, 5));
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/employer-dashboard", active: true },
    { label: "Post Job", icon: Plus, path: "/post-job" },
    { label: "Manage Jobs", icon: Briefcase, path: "/manage-jobs" },
    { label: "Applicants", icon: Users, path: "/Applicants" },
    { label: "Company Profile", icon: Building2, path: "/company-profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors flex">

      <EmployerNav currentTab="dashboard" />

      <main className="flex-1 ml-60 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {user?.companyName || "Your company"} · Employer Dashboard
            </p>
          </div>
          <Link
            to="/post-job"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Post a Job
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Briefcase}    label="Jobs Posted"         value={analytics?.totalJobsPosted ?? 0}             sub={`${analytics?.activeJobs ?? 0} active`}         color="bg-blue-100 text-blue-600"   />
              <StatCard icon={Users}        label="Total Applications"  value={analytics?.totalApplicationsReceived ?? 0}   sub={`${analytics?.recentApplications ?? 0} this week`} color="bg-purple-100 text-purple-600" />
              <StatCard icon={CheckCircle}  label="Hired"               value={analytics?.totalHired ?? 0}                  sub="Accepted candidates"                            color="bg-green-100 text-green-600"  />
              <StatCard icon={Clock}        label="In Review"           value={analytics?.inReview ?? 0}                    sub="Awaiting decision"                              color="bg-yellow-100 text-yellow-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Jobs */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Jobs</h2>
                  <Link to="/manage-jobs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    View all <ChevronRight size={13} />
                  </Link>
                </div>
                {recentJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-slate-500">No jobs posted yet</p>
                    <Link to="/post-job" className="mt-2 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline">Post your first job</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <div key={job._id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.title}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{timeAgo(job.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.isClosed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                            {job.isClosed ? "Closed" : "Active"}
                          </span>
                          <Link to="/manage-jobs" className="p-1 text-gray-400 hover:text-blue-600">
                            <Eye size={14} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Applicants */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Applicants</h2>
                  <Link to="/Applicants" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    View all <ChevronRight size={13} />
                  </Link>
                </div>
                {recentApplicants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-slate-500">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplicants.map((app) => (
                      <div key={app._id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                          {app.applicant?.avatar
                            ? <img src={getSupabaseImageUrl(app.applicant.avatar)} alt="" className="w-full h-full object-cover" />
                            : <span className="text-white text-xs font-bold">{getInitials(app.applicant?.name)}</span>
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{app.applicant?.name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{app.job?.title}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          app.status === "Accepted"  ? "bg-green-100 text-green-600"  :
                          app.status === "Rejected"  ? "bg-red-100 text-red-600"      :
                          app.status === "In Review" ? "bg-yellow-100 text-yellow-600":
                          "bg-blue-100 text-blue-600"
                        }`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;
