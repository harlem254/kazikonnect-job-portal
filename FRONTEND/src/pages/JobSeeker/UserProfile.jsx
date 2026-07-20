import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, Briefcase, Loader,
  FileText, Save, Camera, Eye
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import uploadImage from "../../utils/uploadImage";
import { getInitials } from "../../utils/Helper";
import JobSeekerNav from "../../components/JobSeekerNav";
import toast from "react-hot-toast";

const UserProfile = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:   user?.name   || "",
    resume: user?.resume || "",
  });
  const [avatarFile,      setAvatarFile]      = useState(null);
  const [avatarPreview,   setAvatarPreview]   = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = user?.avatar || "";
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          avatarUrl = await uploadImage(avatarFile);
        } catch {
          toast.error("Avatar upload failed — saving without new photo");
        } finally {
          setUploadingAvatar(false);
        }
      }

      const { data } = await axiosInstance.put(API.UPDATE_PROFILE, {
        name:   form.name,
        avatar: avatarUrl,
        resume: form.resume,
      });

      // Update context directly from the PUT response — it already
      // has the fresh avatar URL, no need for a second GET_ME call.
      updateUser({ ...data, token: user.token });

      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Backend always returns the full public URL — use it directly.
  // avatarPreview is the local blob shown immediately after picking a file,
  // before the save completes.
  const displayAvatar = avatarPreview || user?.avatar || "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      <JobSeekerNav currentTab="profile" />

      {/* Content offset: lg sidebar + tablet top bar + mobile bottom bar */}
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage your credentials and personal information
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">

            {/* ── Avatar ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6"
            >
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">
                Profile Photo
              </h2>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{getInitials(user?.name)}</span>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera size={13} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 capitalize">{user?.role}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">JPG or PNG · max 5 MB</p>
                </div>
              </div>
            </motion.div>

            {/* ── Personal Info ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-4"
            >
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Personal Information
              </h2>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-400 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500">Email cannot be changed</p>
              </div>

              {/* Account type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-wide">
                  Account Type
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 rounded-xl">
                  <Briefcase size={15} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-sm text-gray-600 dark:text-slate-300 capitalize">{user?.role}</span>
                </div>
              </div>
            </motion.div>

            {/* ── Resume ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6"
            >
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">
                Resume / Portfolio
              </h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-wide">
                  Resume URL
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <FileText size={15} />
                  </div>
                  <input
                    type="url"
                    name="resume"
                    value={form.resume}
                    onChange={handleChange}
                    placeholder="https://your-resume-link.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Link to your Google Drive, Dropbox, or any public resume URL
                </p>
              </div>

              {form.resume && (
                <a
                  href={form.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Eye size={13} /> View current resume
                </a>
              )}
            </motion.div>

            {/* ── Save button ── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {uploadingAvatar ? "Uploading photo…" : "Saving…"}
                </>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
