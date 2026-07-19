import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Loader, Camera, Save, Upload, AlignLeft, Mail
} from "lucide-react";
import axiosInstance from "../../utils/axioInstance";
import API from "../../utils/ApiPath";
import { useAuth } from "../../Context/AuthContext";
import uploadImage from "../../utils/uploadImage";
import { getInitials } from "../../utils/Helper";
import EmployerNav from "../../components/EmployerNav";
import toast from "react-hot-toast";

const EmployerProfilePage = () => {
  const { user, isAuthenticated, isEmployer, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:               user?.name               || "",
    companyName:        user?.companyName        || "",
    companyDescription: user?.companyDescription || "",
  });
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [saving,        setSaving]        = useState(false);

  if (!isAuthenticated || !isEmployer) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === "avatar") { setAvatarFile(file); setAvatarPreview(ev.target.result); }
      else                   { setLogoFile(file);   setLogoPreview(ev.target.result);   }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = user?.avatar     || "";
      let logoUrl   = user?.companyLogo || "";
      if (avatarFile) { try { avatarUrl = await uploadImage(avatarFile); } catch { /* skip */ } }
      if (logoFile)   { try { logoUrl   = await uploadImage(logoFile);   } catch { /* skip */ } }

      const { data } = await axiosInstance.put(API.UPDATE_PROFILE, {
        name:               form.name,
        companyName:        form.companyName,
        companyDescription: form.companyDescription,
        avatar:    avatarUrl,
        companyLogo: logoUrl,
      });
      updateUser(data);
      setAvatarFile(null); setAvatarPreview(null);
      setLogoFile(null);   setLogoPreview(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || user?.avatar;
  const displayLogo   = logoPreview   || user?.companyLogo;

  const card = "bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700";
  const inputCls = "w-full px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors flex">

      <EmployerNav currentTab="profile" />

      <main className="flex-1 ml-60 p-6">
        <div className="max-w-2xl mx-auto">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage your company information and branding
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">

            {/* ── Personal Photo ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`${card} p-6`}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">Personal Photo</h2>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {displayAvatar
                      ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white text-xl font-bold">{getInitials(user?.name)}</span>
                    }
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera size={13} className="text-white" />
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "avatar")} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{user?.email}</p>
                </div>
              </div>
            </motion.div>

            {/* ── Account Info ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`${card} p-6 space-y-4`}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Account Information</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Your Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Email Address</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 rounded-xl">
                  <Mail size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                  <span className="text-sm text-gray-400 dark:text-slate-500">{user?.email}</span>
                </div>
              </div>
            </motion.div>

            {/* ── Company Info ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`${card} p-6 space-y-4`}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Company Information</h2>

              {/* Logo */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                    {displayLogo
                      ? <img src={displayLogo} alt="" className="w-full h-full object-contain p-1" />
                      : <Building2 className="w-7 h-7 text-gray-300 dark:text-slate-500" />
                    }
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <Upload size={15} /> Upload Logo
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo")} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Company Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Company Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Building2 size={15} /></div>
                  <input type="text" name="companyName" value={form.companyName} onChange={handleChange}
                    placeholder="Your company name" className={`${inputCls} pl-10`} />
                </div>
              </div>

              {/* Company Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Company Description</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-3 text-gray-400"><AlignLeft size={15} /></div>
                  <textarea name="companyDescription" value={form.companyDescription} onChange={handleChange}
                    rows={4} placeholder="Tell candidates about your company, culture, and mission..."
                    className={`${inputCls} pl-10 resize-none`} />
                </div>
              </div>
            </motion.div>

            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving
                ? <><Loader size={16} className="animate-spin" /> Saving…</>
                : <><Save size={16} /> Save Profile</>
              }
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EmployerProfilePage;
