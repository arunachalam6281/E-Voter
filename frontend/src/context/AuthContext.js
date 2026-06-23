import React, { createContext, useContext, useState } from "react";
import { logout as logoutService } from "../services/authService";

/**
 * AuthContext.js — Global authentication state management using React Context.
 *
 * Why React Context for auth?
 * After login, many components need to know:
 *   - Is the user logged in?
 *   - What is their name and role?
 * Passing this as props through every component ("prop drilling") is messy.
 * Context provides a single global store for this shared state.
 *
 * How it works:
 *   1. AuthProvider wraps the whole app in App.js
 *   2. Any component calls useAuth() to get the current user and auth functions
 *   3. When login() is called, token and user are saved in localStorage
 *      AND in component state — so the UI re-renders immediately
 *
 * localStorage vs state:
 *   - localStorage persists across page refreshes
 *   - State drives live UI updates
 *   We use both: initialize state from localStorage on load.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage so login persists on page refresh
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  /**
   * login — Called after successful API response.
   * Saves token + user to both localStorage and component state.
   *
   * @param {Object} authData — { token, email, fullName, role }
   */
  const login = (authData) => {
    localStorage.setItem("token", authData.token);
    localStorage.setItem("user", JSON.stringify({
      email:      authData.email,
      fullName:   authData.fullName,
      role:       authData.role,
      isVerified: authData.isVerified,
    }));
    setToken(authData.token);
    setUser({
      email:      authData.email,
      fullName:   authData.fullName,
      role:       authData.role,
      isVerified: authData.isVerified,
    });
  };

  /**
   * logout — Clears all auth state and storage.
   */
  const logout = () => {
    logoutService();
    setToken(null);
    setUser(null);
  };

  /** isAdmin — Convenience check used for conditional rendering */
  const isAdmin = user?.role === "ADMIN";

  /** isAuthenticated — True if a valid token exists */
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — Custom hook to consume AuthContext.
 *
 * Usage in any component:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *
 * Throws an error if used outside of AuthProvider (helpful for debugging).
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
