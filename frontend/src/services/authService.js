import api from "../api/axios";

/**
 * authService.js — All authentication-related API calls.
 *
 * Why a service layer in the frontend?
 * Components should not contain raw API calls. Keeping API logic
 * in service files means:
 *   - Components stay clean and focused on UI
 *   - If the API URL changes, we update it in one place
 *   - Easy to mock during testing
 *
 * All functions are async and return the response data directly.
 * Error handling is done at the calling component level.
 */

/**
 * register — Sends registration data to the backend.
 *
 * @param {string} fullName
 * @param {string} email
 * @param {string} password
 * @returns {Object} { token, email, fullName, role }
 */
export const register = async (fullName, email, password) => {
  const response = await api.post("/auth/register", { fullName, email, password });
  return response.data;
};

/**
 * login — Sends login credentials to the backend.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Object} { token, email, fullName, role }
 */
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

/**
 * logout — Clears authentication data from localStorage.
 * No API call needed since JWT is stateless — just remove the token.
 */
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * getCurrentUser — Reads the stored user from localStorage.
 * Returns null if no user is logged in.
 *
 * @returns {Object|null} { email, fullName, role } or null
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
