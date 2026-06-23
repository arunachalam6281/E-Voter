import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ── Auth pages (Module 1 — unchanged) ──────────────────────────────────────
import Login    from "./pages/Login";
import Register from "./pages/Register";

// ── Admin pages (Module 2) ──────────────────────────────────────────────────
import AdminDashboard  from "./pages/admin/AdminDashboard";
import ElectionList    from "./pages/admin/ElectionList";
import CreateElection  from "./pages/admin/CreateElection";
import EditElection    from "./pages/admin/EditElection";
import ElectionDetail  from "./pages/admin/ElectionDetail";

// ── Admin pages (Module 3) ──────────────────────────────────────────────────
import CandidateList   from "./pages/admin/CandidateList";
import CreateCandidate from "./pages/admin/CreateCandidate";
import EditCandidate   from "./pages/admin/EditCandidate";

// ── Voter pages (Module 2) ──────────────────────────────────────────────────
import ElectionsVoter  from "./pages/voter/ElectionsVoter";

// ── Voter pages (Module 3) ──────────────────────────────────────────────────
import CandidatesVoter from "./pages/voter/CandidatesVoter";

// ── Voter pages (Module 4) ──────────────────────────────────────────────────
import VotingPage      from "./pages/voter/VotingPage";

// ── Admin pages (Module 4) ──────────────────────────────────────────────────
import VoteStatistics  from "./pages/admin/VoteStatistics";

// ── Admin pages (Module 5) ──────────────────────────────────────────────────
import AdminResultPage from "./pages/admin/AdminResultPage";

// ── Voter pages (Module 5) ──────────────────────────────────────────────────
import ElectionResultPage from "./pages/voter/ElectionResultPage";

/**
 * ProtectedRoute — Guards routes by authentication and optional role check.
 * Unchanged from Module 1. Reused by all protected routes below.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole && user?.role !== requiredRole)
    return <Navigate to="/login" replace />;

  return children;
};

/**
 * AppRoutes — All application routes.
 *
 * Module 1 routes:   /login, /register  (public)
 * Module 2 routes:   /admin/** (ADMIN)  /voter/* (VOTER)
 *
 * Admin routes:
 *   /admin/dashboard              → stats cards
 *   /admin/elections              → election table
 *   /admin/elections/create       → create form
 *   /admin/elections/:id          → detail view
 *   /admin/elections/:id/edit     → edit form
 *
 * Voter routes:
 *   /voter/elections              → read-only election cards
 *   /voter/dashboard              → redirects to /voter/elections
 */
const AppRoutes = () => (
  <Routes>
    {/* Default */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Public — Module 1 */}
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* ── Admin routes ────────────────────────────────────── */}
    <Route path="/admin/dashboard"
      element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />

    <Route path="/admin/elections"
      element={<ProtectedRoute requiredRole="ADMIN"><ElectionList /></ProtectedRoute>} />

    <Route path="/admin/elections/create"
      element={<ProtectedRoute requiredRole="ADMIN"><CreateElection /></ProtectedRoute>} />

    <Route path="/admin/elections/:id"
      element={<ProtectedRoute requiredRole="ADMIN"><ElectionDetail /></ProtectedRoute>} />

    <Route path="/admin/elections/:id/edit"
      element={<ProtectedRoute requiredRole="ADMIN"><EditElection /></ProtectedRoute>} />

    {/* ── Admin routes (Module 3) ───────────────────────── */}
    <Route path="/admin/candidates"
      element={<ProtectedRoute requiredRole="ADMIN"><ElectionList /></ProtectedRoute>} />

    <Route path="/admin/elections/:electionId/candidates"
      element={<ProtectedRoute requiredRole="ADMIN"><CandidateList /></ProtectedRoute>} />

    <Route path="/admin/elections/:electionId/candidates/create"
      element={<ProtectedRoute requiredRole="ADMIN"><CreateCandidate /></ProtectedRoute>} />

    <Route path="/admin/candidates/:id/edit"
      element={<ProtectedRoute requiredRole="ADMIN"><EditCandidate /></ProtectedRoute>} />

    {/* ── Voter routes ────────────────────────────────────── */}
    <Route path="/voter/dashboard"
      element={<ProtectedRoute requiredRole="VOTER"><Navigate to="/voter/elections" replace /></ProtectedRoute>} />

    <Route path="/voter/elections"
      element={<ProtectedRoute requiredRole="VOTER"><ElectionsVoter /></ProtectedRoute>} />

    <Route path="/voter/elections/:electionId/candidates"
      element={<ProtectedRoute requiredRole="VOTER"><CandidatesVoter /></ProtectedRoute>} />

    {/* ── Voter routes (Module 4) ───────────────────────────────────── */}
    <Route path="/voter/elections/:electionId/vote"
      element={<ProtectedRoute requiredRole="VOTER"><VotingPage /></ProtectedRoute>} />

    {/* ── Admin routes (Module 4) ───────────────────────────────────── */}
    <Route path="/admin/statistics"
      element={<ProtectedRoute requiredRole="ADMIN"><VoteStatistics /></ProtectedRoute>} />

    <Route path="/admin/elections/:electionId/statistics"
      element={<ProtectedRoute requiredRole="ADMIN"><VoteStatistics /></ProtectedRoute>} />

    {/* ── Admin routes (Module 5) ───────────────────────────────────── */}
    <Route path="/admin/results"
      element={<ProtectedRoute requiredRole="ADMIN"><AdminResultPage /></ProtectedRoute>} />

    <Route path="/admin/elections/:electionId/results"
      element={<ProtectedRoute requiredRole="ADMIN"><AdminResultPage /></ProtectedRoute>} />

    {/* ── Voter routes (Module 5) ───────────────────────────────────── */}
    <Route path="/voter/elections/:electionId/results"
      element={<ProtectedRoute requiredRole="VOTER"><ElectionResultPage /></ProtectedRoute>} />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
