import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Sidebar — Fixed left navigation panel shared by all admin pages.
 *
 * Uses NavLink which automatically adds an active state when the
 * current URL matches the link's `to` prop — used for highlight styling.
 *
 * The sidebar is 240px wide. Every admin page wraps its content in a div
 * with `marginLeft: 240` so content sits beside (not under) the sidebar.
 */
const NAV = [
  { to: "/admin/dashboard",   icon: "📊", label: "Dashboard"   },
  { to: "/admin/elections",   icon: "🗳️",  label: "Elections"   },
  { to: "/admin/candidates",  icon: "👤", label: "Candidates"  },
  { to: "/admin/voters",      icon: "✅", label: "Voters"      },
  { to: "/admin/statistics",  icon: "📈", label: "Statistics"  },
  { to: "/admin/results",     icon: "🏆", label: "Results"     },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <span style={{ fontSize: "1.5rem" }}>🗳️</span>
        <span style={s.brandText}>E-Voter</span>
      </div>

      <p style={s.sectionLabel}>ADMIN PANEL</p>

      <nav style={s.nav}>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to}
            style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) })}>
            <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* User info + logout at bottom */}
      <div style={s.footer}>
        <div style={s.avatar}>{user?.fullName?.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={s.name}>{user?.fullName}</p>
          <p style={s.email}>{user?.email}</p>
        </div>
        <button onClick={handleLogout} title="Logout" style={s.logoutBtn}>⏻</button>
      </div>
    </aside>
  );
};

const s = {
  sidebar:    { width: 240, minHeight: "100vh", backgroundColor: "#1a202c",
                display: "flex", flexDirection: "column", position: "fixed",
                top: 0, left: 0, bottom: 0, zIndex: 100 },
  brand:      { display: "flex", alignItems: "center", gap: 10,
                padding: "1.4rem 1.2rem", borderBottom: "1px solid #2d3748" },
  brandText:  { fontSize: "1.2rem", fontWeight: 700, color: "#fff" },
  sectionLabel: { fontSize: "0.65rem", fontWeight: 700, color: "#718096",
                  letterSpacing: "0.08em", padding: "1.2rem 1.2rem 0.4rem", margin: 0 },
  nav:        { display: "flex", flexDirection: "column", gap: 2, padding: "0 0.75rem" },
  link:       { display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 0.75rem",
                borderRadius: 8, color: "#a0aec0", textDecoration: "none",
                fontSize: "0.9rem", fontWeight: 500 },
  linkActive: { backgroundColor: "#2d3748", color: "#fff" },
  footer:     { display: "flex", alignItems: "center", gap: 10,
                padding: "1rem 1.2rem", borderTop: "1px solid #2d3748" },
  avatar:     { width: 34, height: 34, borderRadius: "50%", backgroundColor: "#3182ce",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 },
  name:       { color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  email:      { color: "#718096", fontSize: "0.72rem", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn:  { background: "none", border: "none", color: "#718096",
                cursor: "pointer", fontSize: "1.1rem", padding: 4, flexShrink: 0 },
};

export default Sidebar;
