import axios from "axios";

/**
 * api.js — Pre-configured Axios instance for all API calls.
 *
 * Why a custom instance instead of using axios directly?
 *
 * 1. Base URL is set once here — all service files just call
 *    api.post('/auth/login') instead of repeating the full URL.
 *
 * 2. Request Interceptor — automatically attaches the JWT token
 *    to every outgoing request. Without this, every service call
 *    would have to manually add the Authorization header.
 *
 * 3. Response Interceptor — centrally handles 401 Unauthorized
 *    by clearing the token and redirecting to login.
 *    This prevents stale tokens from causing silent failures.
 */
const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ────────────────────────────────────────────────────
// Runs before every request is sent.
// Reads the JWT token from localStorage and adds it to the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ───────────────────────────────────────────────────
// Runs after every response is received.
// If backend returns 401, clear the token and redirect to login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
