import axios from "axios";
import { BASE_URL } from "./ApiPath";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — but ONLY redirect when a session actually exists.
// An unauthenticated request to a public endpoint can also return 401,
// and we must not redirect the user away mid-navigation in that case.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");

      // Only redirect if we had a token and the server explicitly rejected it.
      // This avoids redirect loops when the server is down (no response at all)
      // or when an unauthenticated public request gets a 401.
      if (storedUser?.token) {
        localStorage.removeItem("user");
        // Use replace so hitting "back" doesn't re-trigger the failed request
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
