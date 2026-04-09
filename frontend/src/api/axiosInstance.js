import axios from "axios";

// ✅ Dynamically set backend URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ✅ Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // optional (useful for cookies later)
});

// ==============================
// 🔐 REQUEST INTERCEPTOR
// ==============================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// ⚠️ RESPONSE INTERCEPTOR
// ==============================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔴 Handle unauthorized access
    if (error.response?.status === 401) {
      console.warn("⚠️ Session expired. Redirecting to login...");

      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      // redirect safely
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // 🔴 Optional: handle server errors
    if (error.response?.status === 500) {
      console.error("🔥 Server error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;