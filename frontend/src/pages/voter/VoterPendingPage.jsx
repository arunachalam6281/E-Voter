import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const VoterPendingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <header style={s.nav}>
        <div style={s.navBrand}>🗳️ E-Voter</div>
        <div style={s.navRight}>
          <span style={s.navUser}>👤 {user?.fullName}</span>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate("/login"); }}>
            Logout
          </button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.card}>
          <div style={s.icon}>⏳</div>
          <h1 style={s.title}>Account Pending Approval</h1>
          <p style={s.body}>
            Your voter account has been registered successfully but requires
            admin approval before you can participate in elections.
          </p>
          <p style={s.body}>
            Please wait for an administrator to verify your account. Once approved,
            log in again to access all voting features.
          </p>
          <div style={s.infoBox}>
            ℹ️ Registered as: <strong>{user?.email}</strong>
          </div>
          <button style={s.logoutFullBtn} onClick={() => { logout(); navigate("/login"); }}>
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

const s = {
  page:          { minHeight: "100vh", backgroundColor: "#f7fafc", fontFamily: "'Segoe UI', sans-serif" },
  nav:           { backgroundColor: "#1a202c", display: "flex", justifyContent: "space-between",
                   alignItems: "center", padding: "0 2rem", height: 56,
                   position: "sticky", top: 0, zIndex: 50 },
  navBrand:      { color: "#fff", fontWeight: 700, fontSize: "1.1rem" },
  navRight:      { display: "flex", alignItems: "center", gap: "1rem" },
  navUser:       { color: "#a0aec0", fontSize: "0.88rem" },
  logoutBtn:     { padding: "5px 14px", backgroundColor: "#e53e3e", color: "#fff",
                   border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
  main:          { display: "flex", alignItems: "center", justifyContent: "center",
                   minHeight: "calc(100vh - 56px)", padding: "2rem 1rem" },
  card:          { backgroundColor: "#fff", borderRadius: 16, padding: "3rem 2.5rem",
                   maxWidth: 480, width: "100%", textAlign: "center",
                   boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" },
  icon:          { fontSize: "3.5rem", marginBottom: "1.25rem" },
  title:         { fontSize: "1.4rem", fontWeight: 700, color: "#1a202c", margin: "0 0 1rem" },
  body:          { color: "#718096", fontSize: "0.92rem", lineHeight: 1.7, margin: "0 0 0.75rem" },
  infoBox:       { backgroundColor: "#ebf8ff", border: "1px solid #90cdf4", color: "#2b6cb0",
                   borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.88rem",
                   margin: "1.25rem 0" },
  logoutFullBtn: { padding: "0.65rem 2rem", backgroundColor: "#1a202c", color: "#fff",
                   border: "none", borderRadius: 8, cursor: "pointer",
                   fontWeight: 600, fontSize: "0.9rem" },
};

export default VoterPendingPage;
