import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axioInstance";
import API from "../utils/ApiPath";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // True while the initial token-validation call is in-flight.
  // Pages must wait for this to be false before making auth decisions.
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Re-validate token on mount — but ONLY clear the user on a real 401,
  // not on network errors or server errors (500, ECONNREFUSED, etc.)
  useEffect(() => {
    if (!user?.token) {
      setAuthChecking(false);
      return;
    }

    axiosInstance
      .get(API.GET_ME)
      .then((res) => {
        // Merge fresh profile data into stored user (keeps token intact)
        setUser((prev) => ({ ...prev, ...res.data }));
      })
      .catch((err) => {
        const status = err.response?.status;
        // Only log out on 401 (invalid/expired token).
        // 500, network errors, DB down → keep the session alive so
        // back-navigation and offline browsing still work.
        if (status === 401) {
          setUser(null);
        }
        // Any other error: leave user as-is — they can still browse
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(API.LOGIN, { email, password });
      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      return { success: true, role: data.role };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(API.REGISTER, payload);
      setUser(data);
      toast.success("Account created successfully!");
      return { success: true, role: data.role };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    toast.success("Logged out successfully");
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  const isAuthenticated = !!user;
  const isEmployer  = user?.role === "employer";
  const isJobSeeker = user?.role === "jobseeker";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authChecking,   // expose so ProtectedRoute can wait before redirecting
        isAuthenticated,
        isEmployer,
        isJobSeeker,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
