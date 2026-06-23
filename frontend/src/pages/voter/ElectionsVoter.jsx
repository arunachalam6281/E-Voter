import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { getAllElections } from "../../services/electionService";
import { useAuth } from "../../context/AuthContext";

/**
 * ElectionsVoter — Read-only election listing for voters.
 *
 * Voters can:
 *   - Browse all elections
 *   - Filter by status (All / Active / Upcoming / Completed)
 *   - Click an election for details (Module 4 will add voting here)
 *
 * Voters CANNOT create, edit, or delete — those buttons are not rendered.
 * Security is also enforced on the backend via @PreAuthorize.
 *
 * Layout: no sidebar — voters get a simpler top-nav layout.
 */
const ElectionsVoter = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [filter, setFilter]       = useState("ALL");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    getAllElections()
      .then(setElections)
      .catch(() => setError("Failed to load elections."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL"
    ? elections
    : elections.filter(e => e.status === filter);

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString("en-US",
    { dateStyle: "medium" }) : "—";

  return (
    <div style={s.page}>
      {/* Top Nav */}
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
        <h1 style={s.title}>Elections</h1>
        <p style={s.subtitle}>View all available elections</p>

        {user?.isVerified === false && (
          <div style={s.pendingBanner}>
            <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>⏳</span>
            <div>
              <p style={{ fontWeight: 700, margin: 0, fontSize: "0.92rem" }}>
                Your account is pending admin approval.
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem" }}>
                You can browse elections but cannot vote until your account is verified.
              </p>
            </div>
          </div>
        )}

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Filter Tabs */}
        <div style={s.tabs}>
          {["ALL", "ACTIVE", "UPCOMING", "COMPLETED"].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              style={{ ...s.tab, ...(filter === tab ? s.tabActive : {}) }}>
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span style={s.tabCount}>
                {tab === "ALL" ? elections.length
                  : elections.filter(e => e.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Election Cards */}
        {loading ? (
          <p style={{ color: "#718096", padding: "2rem 0" }}>Loading elections…</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "2.5rem" }}>🗳️</p>
            <p style={{ color: "#718096" }}>No {filter === "ALL" ? "" : filter.toLowerCase()} elections found.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(el => (
              <div key={el.id} style={s.card}>
                <div style={s.cardTop}>
                  <StatusBadge status={el.status} />
                </div>
                <h3 style={s.cardTitle}>{el.title}</h3>
                {el.description && (
                  <p style={s.cardDesc}>
                    {el.description.length > 100
                      ? el.description.slice(0, 100) + "…"
                      : el.description}
                  </p>
                )}
                <div style={s.cardDates}>
                  <span>📅 {fmt(el.startDate)} — {fmt(el.endDate)}</span>
                </div>
                {el.status === "ACTIVE" && (
                  <div style={s.voteBanner}>
                    🟢 Voting is currently open
                  </div>
                )}
                <div style={s.cardActions}>
                  <button style={s.actionBtnSecondary}
                    onClick={() => navigate(`/voter/elections/${el.id}/candidates`)}>
                    👤 View Candidates
                  </button>
                  {el.status === "ACTIVE" && (
                    user?.isVerified === false ? (
                      <button style={s.actionBtnDisabled} disabled>
                        🔒 Approval Pending
                      </button>
                    ) : (
                      <button style={s.actionBtnPrimary}
                        onClick={() => navigate(`/voter/elections/${el.id}/vote`)}>
                        🗳️ Vote Now
                      </button>
                    )
                  )}
                  {el.status === "COMPLETED" && (
                    <button style={s.actionBtnResults}
                      onClick={() => navigate(`/voter/elections/${el.id}/results`)}>
                      🏆 View Results
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const s = {
  page:       { minHeight: "100vh", backgroundColor: "#f7fafc", fontFamily: "'Segoe UI', sans-serif" },
  nav:        { backgroundColor: "#1a202c", display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "0 2rem", height: 56, position: "sticky", top: 0, zIndex: 50 },
  navBrand:   { color: "#fff", fontWeight: 700, fontSize: "1.1rem" },
  navRight:   { display: "flex", alignItems: "center", gap: "1rem" },
  navUser:    { color: "#a0aec0", fontSize: "0.88rem" },
  logoutBtn:  { padding: "5px 14px", backgroundColor: "#e53e3e", color: "#fff",
                border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
  main:       { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" },
  title:      { fontSize: "1.6rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  subtitle:   { color: "#718096", margin: "4px 0 1.5rem", fontSize: "0.92rem" },
  errorBox:   { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  tabs:       { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  tab:        { padding: "0.45rem 1rem", borderRadius: 999, border: "1.5px solid #e2e8f0",
                backgroundColor: "#fff", color: "#4a5568", cursor: "pointer", fontWeight: 500,
                fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 },
  tabActive:  { backgroundColor: "#1a202c", color: "#fff", borderColor: "#1a202c" },
  tabCount:   { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999,
                padding: "1px 7px", fontSize: "0.75rem" },
  empty:      { textAlign: "center", padding: "3rem 0" },
  grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" },
  card:       { backgroundColor: "#fff", borderRadius: 12, padding: "1.4rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0",
                display: "flex", flexDirection: "column", gap: "0.75rem" },
  cardTop:    { display: "flex", justifyContent: "flex-end" },
  cardTitle:  { fontSize: "1.05rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  cardDesc:   { color: "#718096", fontSize: "0.88rem", lineHeight: 1.5, margin: 0 },
  cardDates:  { fontSize: "0.82rem", color: "#4a5568" },
  voteBanner: { backgroundColor: "#f0fff4", border: "1px solid #9ae6b4", color: "#276749",
                borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.82rem", fontWeight: 600 },
  cardActions:        { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" },
  actionBtnDisabled:  { flex: 1, padding: "0.45rem 0.5rem", fontSize: "0.8rem", fontWeight: 600,
                        backgroundColor: "#e2e8f0", color: "#a0aec0", border: "none",
                        borderRadius: 7, cursor: "not-allowed" },
  pendingBanner:      { display: "flex", alignItems: "flex-start", gap: "0.85rem",
                        backgroundColor: "#fffbeb", border: "1px solid #f6e05e", color: "#744210",
                        borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.25rem",
                        fontSize: "0.9rem" },
  actionBtnSecondary: { flex: 1, padding: "0.45rem 0.5rem", fontSize: "0.8rem", fontWeight: 600,
                        backgroundColor: "#edf2f7", color: "#2d3748", border: "1px solid #e2e8f0",
                        borderRadius: 7, cursor: "pointer" },
  actionBtnPrimary:   { flex: 1, padding: "0.45rem 0.5rem", fontSize: "0.8rem", fontWeight: 600,
                        backgroundColor: "#276749", color: "#fff", border: "none",
                        borderRadius: 7, cursor: "pointer" },
  actionBtnResults:   { flex: 1, padding: "0.45rem 0.5rem", fontSize: "0.8rem", fontWeight: 600,
                        backgroundColor: "#553c9a", color: "#fff", border: "none",
                        borderRadius: 7, cursor: "pointer" },
};

export default ElectionsVoter;
