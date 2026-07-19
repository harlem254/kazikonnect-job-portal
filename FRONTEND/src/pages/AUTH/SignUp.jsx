import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Lock, Eye, EyeOff, Upload,
  UserCheck, Briefcase, Loader, AlertCircle,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import uploadImage from "../../utils/uploadImage";

// ─── Validation helpers ───────────────────────────────────────────────────────
const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  return "";
};

// ─── Reusable input field wrapper ────────────────────────────────────────────
const InputField = ({ label, error, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-600 tracking-wide">{label}</label>
    <div className="relative">
      {/* Icon — pointer-events-none so it never intercepts clicks */}
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Icon size={17} />
        </div>
      )}
      {children}
    </div>
    {error && (
      <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-0.5">
        <AlertCircle size={13} />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const SignUp = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Single flat state object — all text inputs live here
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "jobseeker",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(""); // top-level banner error
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Single handleChange for ALL text inputs ───────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update the field
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear top banner when user starts fixing things
    if (formError) setFormError("");
  };

  // ── Avatar picker ─────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Client-side validation — returns true only when everything is clean ───
  const validateForm = () => {
    const errs = {};

    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required";
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) errs.email = emailErr;

    const passwordErr = validatePassword(formData.password);
    if (passwordErr) {
      errs.password = passwordErr;
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setFormError("Please fix the errors below before continuing.");
      return false;
    }

    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    // Upload avatar if one was picked
    let avatarUrl = "";
    if (avatarFile) {
      setUploadingAvatar(true);
      try {
        avatarUrl = await uploadImage(avatarFile);
      } catch {
        // Non-fatal — continue without avatar
      } finally {
        setUploadingAvatar(false);
      }
    }

    const result = await register({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      avatar: avatarUrl,
    });

    if (result.success) {
      navigate(result.role === "employer" ? "/employer-dashboard" : "/find-jobs");
    } else {
      // Show the API error in the top banner
      setFormError(result.message || "Registration failed. Please try again.");
    }
  };

  const isSubmitting = loading || uploadingAvatar;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px] bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">KAZIKONNECT</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-sm text-gray-500 mt-1">Join thousands of professionals today</p>
        </div>

        {/* ── Top-level error banner ── */}
        {formError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="on" className="space-y-5">

          {/* ── Full Name ── */}
          <InputField label="Full Name *" error={errors.fullName} icon={User}>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors
                ${errors.fullName
                  ? "border-red-400 focus:border-red-500 bg-red-50/30"
                  : "border-gray-200 focus:border-blue-500 bg-white"
                }`}
            />
          </InputField>

          {/* ── Email ── */}
          <InputField label="Email Address *" error={errors.email} icon={Mail}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors
                ${errors.email
                  ? "border-red-400 focus:border-red-500 bg-red-50/30"
                  : "border-gray-200 focus:border-blue-500 bg-white"
                }`}
            />
          </InputField>

          {/* ── Password ── */}
          <InputField label="Password *" error={errors.password} icon={Lock}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className={`w-full rounded-xl border py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition-colors
                ${errors.password
                  ? "border-red-400 focus:border-red-500 bg-red-50/30"
                  : "border-gray-200 focus:border-blue-500 bg-white"
                }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </InputField>

          {/* ── Confirm Password ── */}
          <InputField label="Confirm Password *" error={errors.confirmPassword} icon={Lock}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className={`w-full rounded-xl border py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition-colors
                ${errors.confirmPassword
                  ? "border-red-400 focus:border-red-500 bg-red-50/30"
                  : "border-gray-200 focus:border-blue-500 bg-white"
                }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </InputField>

          {/* ── Profile Picture ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 tracking-wide">
              Profile Picture <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              {/* Preview circle */}
              <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  : <User size={22} className="text-gray-400" />
                }
              </div>
              {/* File picker */}
              <div className="flex-1">
                <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-gray-300 py-3 px-4 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                  <Upload size={15} className="text-gray-500" />
                  <span>{avatarFile ? avatarFile.name : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG or WEBP · max 5 MB</p>
              </div>
            </div>
          </div>

          {/* ── Role selector ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 tracking-wide">I am a *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "jobseeker", label: "Job Seeker", Icon: UserCheck },
                { value: "employer", label: "Employer",   Icon: Briefcase  },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: value }))}
                  className={`flex flex-col items-center py-4 rounded-xl border-2 transition-all
                    ${formData.role === value
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                >
                  <Icon
                    size={26}
                    className={formData.role === value ? "text-blue-600" : "text-gray-400"}
                  />
                  <span className={`text-sm font-semibold mt-2 ${formData.role === value ? "text-blue-700" : "text-gray-700"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>{uploadingAvatar ? "Uploading photo…" : "Creating Account…"}</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
