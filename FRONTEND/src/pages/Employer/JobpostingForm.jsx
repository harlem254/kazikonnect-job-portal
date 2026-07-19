import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Plus, Loader, AlertCircle, ChevronLeft,
  DollarSign, MapPin, Tag, FileText, AlignLeft
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import { CATEGORIES, JOB_TYPES } from "../../utils/data";
import EmployerNav from "../../components/EmployerNav";
import toast from "react-hot-toast";

// ─── Reusable field wrapper ───────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-600 dark:text-slate-300 tracking-wide">{label}</label>
    {children}
    {error && (
      <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
        <AlertCircle size={12} /> {error}
      </div>
    )}
  </div>
);

const inputBase =
  "w-full py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border rounded-xl outline-none transition-colors placeholder-gray-400 dark:placeholder-slate-500";
const inputOk  = "border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400";
const inputErr = "border-red-400 focus:border-red-500";

// ─── Main component ───────────────────────────────────────────────────────────
const JobPostingForm = () => {
  const { isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", description: "", requirements: "",
    location: "", category: "", type: "", salaryMin: "", salaryMax: "",
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated || !isEmployer) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())        e.title        = "Job title is required";
    if (!form.description.trim())  e.description  = "Description is required";
    if (!form.requirements.trim()) e.requirements = "Requirements are required";
    if (!form.type)                e.type         = "Job type is required";
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax))
      e.salaryMax = "Max salary must be greater than min salary";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.post(API.JOBS, {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      });
      toast.success("Job posted successfully!");
      navigate("/manage-jobs");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const card = "bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-4";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors flex">

      <EmployerNav currentTab="post" />

      <main className="flex-1 ml-60 p-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/manage-jobs")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Post a New Job</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Fill in the details to attract the right candidates
              </p>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Basic Info */}
            <div className={card}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Basic Information</h2>

              <Field label="Job Title *" error={errors.title}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Briefcase size={16} /></div>
                  <input type="text" name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Senior React Developer"
                    className={`${inputBase} pl-10 pr-4 ${errors.title ? inputErr : inputOk}`} />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category" error={errors.category}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Tag size={15} /></div>
                    <select name="category" value={form.category} onChange={handleChange}
                      className={`${inputBase} pl-9 pr-4 appearance-none ${inputOk}`}>
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </Field>

                <Field label="Job Type *" error={errors.type}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Briefcase size={15} /></div>
                    <select name="type" value={form.type} onChange={handleChange}
                      className={`${inputBase} pl-9 pr-4 appearance-none ${errors.type ? inputErr : inputOk}`}>
                      <option value="">Select type</option>
                      {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </Field>
              </div>

              <Field label="Location" error={errors.location}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><MapPin size={15} /></div>
                  <input type="text" name="location" value={form.location} onChange={handleChange}
                    placeholder="e.g. Nairobi, Kenya or Remote"
                    className={`${inputBase} pl-10 pr-4 ${inputOk}`} />
                </div>
              </Field>
            </div>

            {/* Compensation */}
            <div className={card}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Compensation (KSh)</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Min Salary" error={errors.salaryMin}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><DollarSign size={15} /></div>
                    <input type="number" name="salaryMin" value={form.salaryMin} onChange={handleChange}
                      placeholder="e.g. 50000" min="0"
                      className={`${inputBase} pl-9 pr-4 ${inputOk}`} />
                  </div>
                </Field>
                <Field label="Max Salary" error={errors.salaryMax}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><DollarSign size={15} /></div>
                    <input type="number" name="salaryMax" value={form.salaryMax} onChange={handleChange}
                      placeholder="e.g. 150000" min="0"
                      className={`${inputBase} pl-9 pr-4 ${errors.salaryMax ? inputErr : inputOk}`} />
                  </div>
                </Field>
              </div>
            </div>

            {/* Job Details */}
            <div className={card}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Job Details</h2>

              <Field label="Job Description *" error={errors.description}>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-3 text-gray-400"><AlignLeft size={15} /></div>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={5}
                    placeholder="Describe the role, responsibilities, and what makes this a great opportunity..."
                    className={`${inputBase} pl-10 pr-4 resize-none ${errors.description ? inputErr : inputOk}`} />
                </div>
              </Field>

              <Field label="Requirements *" error={errors.requirements}>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-3 text-gray-400"><FileText size={15} /></div>
                  <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={4}
                    placeholder="List the required skills, experience, and qualifications..."
                    className={`${inputBase} pl-10 pr-4 resize-none ${errors.requirements ? inputErr : inputOk}`} />
                </div>
              </Field>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading
                ? <><Loader size={16} className="animate-spin" /> Posting…</>
                : <><Plus size={16} /> Post Job</>
              }
            </button>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default JobPostingForm;
