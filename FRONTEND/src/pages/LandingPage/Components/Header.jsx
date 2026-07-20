import React from "react";
import { motion } from "framer-motion";
import { Briefcase, LogOut, LayoutDashboard } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { getInitials } from "../../../utils/Helper";
import { getSupabaseImageUrl } from "../../../utils/supabase";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">KAZIKONNECT</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/find-jobs"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Find Jobs
            </Link>
            <button
              onClick={() =>
                navigate(
                  isAuthenticated && user?.role === "employer"
                    ? "/employer-dashboard"
                    : "/login"
                )
              }
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              For Employers
            </button>
          </nav>

          {/* Auth Area */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={getSupabaseImageUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{getInitials(user?.name)}</span>
                  )}
                </div>

                <span className="text-gray-700 font-medium text-sm hidden sm:block">
                  {user?.name?.split(" ")[0]}
                </span>

                <Link
                  to={user?.role === "employer" ? "/employer-dashboard" : "/find-jobs"}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>

                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
