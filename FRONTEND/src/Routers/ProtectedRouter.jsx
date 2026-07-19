import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { Loader } from "lucide-react";

const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, user, authChecking } = useAuth();

  // Wait for the initial token-validation call to finish before
  // making any redirect decisions. Without this, pressing "back"
  // causes a split-second redirect to /login while the check runs.
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader className="w-7 h-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Navigate
        to={user?.role === "employer" ? "/employer-dashboard" : "/find-jobs"}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
