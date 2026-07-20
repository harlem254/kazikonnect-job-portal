import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, User, FileText, Bookmark, LogOut,
  Menu, X, Sun, Moon, ChevronRight
} from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { getInitials } from "../utils/Helper";
import { getSupabaseImageUrl } from "../utils/supabase";

// ─── Nav items definition ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    tab:   "browse",
    label: "Browse Jobs",
    icon:  Briefcase,
    to:    "/find-jobs",
    description: "Search available positions",
  },
  {
    tab:   "profile",
    label: "My Profile",
    icon:  User,
    to:    "/profile",
    description: "Edit your credentials & CV",
  },
  {
    tab:   "applications",
    label: "My Applications",
    icon:  FileText,
    to:    "/my-applications",
    description: "Track live application status",
  },
  {
    tab:   "saved",
    label: "Saved Jobs",
    icon:  Bookmark,
    to:    "/saved-jobs",
    description: "View bookmarked positions",
  },
];

// ─── Active item style helpers ─────────────────────────────────────────────────
const activeItemCls =
  "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25";

const inactiveItemCls =
  "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white";

// ─── Component ────────────────────────────────────────────────────────────────
const JobSeekerNav = ({ currentTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark mode — reads same localStorage key used by the dashboard
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("kazi-theme") === "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("kazi-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("kazi-theme", "light");
    }
  }, [darkMode]);

  // Mobile drawer open/close
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  const handleNavClick = (to) => {
    setDrawerOpen(false);
    navigate(to);
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate("/");
  };

  // ── Sidebar content (shared between desktop & drawer) ──────────────────────
  const SidebarContent = ({ compact = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 ${compact ? "px-4 py-5" : "px-5 py-6"} border-b border-gray-100 dark:border-slate-700`}>
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center shrink-0">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        {!compact && (
          <span className="font-bold text-gray-900 dark:text-white text-sm tracking-wide">
            KAZIKONNECT
          </span>
        )}
      </div>

      {/* Section label */}
      {!compact && (
        <p className="px-5 pt-5 pb-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
          Job Seeker
        </p>
      )}

      {/* Nav items */}
      <nav className={`flex-1 space-y-1 ${compact ? "px-2 py-4" : "px-3 pb-4"}`}>
        {NAV_ITEMS.map(({ tab, label, icon: Icon, to, description }) => {
          const isActive = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleNavClick(to)}
              title={compact ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 font-medium
                ${compact ? "justify-center p-3" : "px-3 py-2.5"}
                ${isActive ? activeItemCls : inactiveItemCls}`}
            >
              <Icon size={18} className="shrink-0" />
              {!compact && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  {!isActive && (
                    <p className="text-[10px] font-normal opacity-60 truncate mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {!compact && isActive && (
                <ChevronRight size={14} className="shrink-0 opacity-70" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user info + theme toggle + logout */}
      <div className={`border-t border-gray-100 dark:border-slate-700 ${compact ? "px-2 py-3 space-y-2" : "px-4 py-4 space-y-3"}`}>
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode((p) => !p)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className={`w-full flex items-center gap-2.5 rounded-xl transition-colors
            text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700
            ${compact ? "justify-center p-2.5" : "px-3 py-2"}`}
        >
          {darkMode
            ? <Sun size={16} className="text-amber-400 shrink-0" />
            : <Moon size={16} className="shrink-0" />}
          {!compact && (
            <span className="text-xs font-medium">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>

        {/* User avatar + name */}
        {!compact && (
          <button
            onClick={() => handleNavClick("/profile")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatar
                ? <img src={getSupabaseImageUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-[11px] font-bold">{getInitials(user?.name)}</span>
              }
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name || "Job Seeker"}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 rounded-xl transition-colors
            text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
            ${compact ? "justify-center p-2.5" : "px-3 py-2"}`}
        >
          <LogOut size={15} className="shrink-0" />
          {!compact && <span className="text-xs font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR  (lg and up)  — fixed left, full height
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col
        bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700
        shadow-sm z-30">
        <SidebarContent />
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLET HEADER  (sm–lg)  — top bar with hamburger
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40
        bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shadow-sm
        flex items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">KAZIKONNECT</span>
        </Link>

        {/* Current page label */}
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 hidden sm:block">
          {NAV_ITEMS.find((n) => n.tab === currentTab)?.label ?? "Dashboard"}
        </span>

        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Hamburger Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 z-50
                bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 shadow-xl"
            >
              {/* Close button */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10"
              >
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE BOTTOM BAR  (< sm)  — sticky bottom navigation
      ══════════════════════════════════════════════════════════════════════ */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40
        bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700
        shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex items-stretch">
        {NAV_ITEMS.map(({ tab, label, icon: Icon, to }) => {
          const isActive = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleNavClick(to)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative
                ${isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"}`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="bottom-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[9px] font-semibold leading-tight ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}>
                {label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default JobSeekerNav;
