import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, Plus, Users, Building2, LayoutDashboard,
  LogOut, Sun, Moon
} from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { getInitials } from "../utils/Helper";

const NAV_ITEMS = [
  { label: "Dashboard",       icon: LayoutDashboard, path: "/employer-dashboard", tab: "dashboard"  },
  { label: "Post Job",        icon: Plus,            path: "/post-job",            tab: "post"       },
  { label: "Manage Jobs",     icon: Briefcase,       path: "/manage-jobs",         tab: "manage"     },
  { label: "Applicants",      icon: Users,           path: "/Applicants",          tab: "applicants" },
  { label: "Company Profile", icon: Building2,       path: "/company-profile",     tab: "profile"    },
];

const EmployerNav = ({ currentTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark mode — uses the same localStorage key as the jobseeker nav
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-60 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700
      flex flex-col fixed left-0 top-0 h-full z-30 transition-colors">

      {/* ── Logo ── */}
      <div className="p-5 border-b border-gray-100 dark:border-slate-700">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">KAZIKONNECT</span>
        </Link>
      </div>

      {/* ── Section label ── */}
      <p className="px-5 pt-5 pb-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
        Employer
      </p>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, path, tab }) => {
          const isActive = currentTab === tab;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: theme + user + logout ── */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-3">

        {/* Dark / Light toggle */}
        <button
          onClick={() => setDarkMode((p) => !p)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium
            text-gray-500 dark:text-slate-400
            hover:bg-gray-100 dark:hover:bg-slate-700
            transition-colors"
        >
          {darkMode
            ? <Sun size={15} className="text-amber-400 shrink-0" />
            : <Moon size={15} className="shrink-0" />
          }
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>

        {/* User card */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-bold">{getInitials(user?.name)}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
              {user?.companyName || "Employer"}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium
            text-gray-500 dark:text-slate-400
            hover:text-red-500 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            rounded-lg transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default EmployerNav;
