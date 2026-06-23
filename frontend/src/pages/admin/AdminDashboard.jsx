import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getElectionStats } from "../../services/electionService";
import { useAuth } from "../../context/AuthContext";

/**
 * AdminDashboard — Landing page for the admin after login.
 *
 * Shows 4 stat cards (total, active, upcoming, completed elections)
 * loaded from GET /api/elections/stats.
 *
 * Layout: fixed Sidebar on the left, main content offset by 240px.
 */
const CARDS = [
  { key: "total",     label: "Total Elections",     icon: "🗳️",  color: "#3182ce", bg: "#ebf8ff" },
  { key: "active",    label: "Active Now",           icon: "✅",  color: "#276749", bg: "#f0fff4" },
  { key: "upcoming",  label: "Upcoming",             icon: "📅",  color: "#744210", bg: "#fffbeb" },
  { key: "completed", label: "Completed",            icon: "🏁",  color: "#4a5568", bg: "#f7fafc" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]   = useState({ total: 0, active: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    getElectionStats()
      .then(setStats)
      .catch(() => setError("Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <p style={s.subtitle}>Welcome back, {user?.fullName} 👋</p>
          </div>
          <button style={s.primaryBtn} onClick={() => navigate("/admin/elections/create")}>
            + New Election
          </button>
        </div>

        {/* Error */}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* Stats Cards */}
        {loading ? (
          <p style={{ color: "#718096" }}>Loading stats...</p>
        ) : (
          <div style={s.cards}>
            {CARDS.map(card => (
              <div key={card.key} style={{ ...s.card, backgroundColor: card.bg }}>
                <div style={{ ...s.cardIcon, color: card.color }}>{card.icon}</div>
                <div>
                  <p style={s.cardValue}>{stats[card.key] ?? 0}</p>
                  <p style={{ ...s.cardLabel, color: card.color }}>{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Quick Actions</h2>
          <div style={s.actions}>
            <ActionCard icon="🗳️" title="Manage Elections"
              desc="View, edit, and delete elections"
              onClick={() => navigate("/admin/elections")} />
            <ActionCard icon="➕" title="Create Election"
              desc="Set up a new election event"
              onClick={() => navigate("/admin/elections/create")} />
            <ActionCard icon="👤" title="Candidates"
              desc="Manage candidates per election"
              onClick={() => navigate("/admin/candidates")} />
            <ActionCard icon="📈" title="Statistics"
              desc="View live voting statistics"
              onClick={() => navigate("/admin/statistics")} />
            <ActionCard icon="🏆" title="Results"
              desc="View final election results"
              onClick={() => navigate("/admin/results")} />
          </div>
        </div>

      </main>
    </div>
  );
};

const ActionCard = ({ icon, title, desc, onClick }) => (
  <div style={s.actionCard} onClick={onClick}>
    <span style={s.actionIcon}>{icon}</span>
    <div>
      <p style={s.actionTitle}>{title}</p>
      <p style={s.actionDesc}>{desc}</p>
    </div>
  </div>
);

const s = {
  page:        { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:        { marginLeft: 240, flex: 1, padding: "2rem 2.5rem" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" },
  title:       { fontSize: "1.6rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  subtitle:    { color: "#718096", margin: "4px 0 0", fontSize: "0.9rem" },
  primaryBtn:  { padding: "0.6rem 1.2rem", backgroundColor: "#3182ce", color: "#fff",
                 border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  errorBox:    { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                 padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.5rem", fontSize: "0.9rem" },
  cards:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" },
  card:        { padding: "1.25rem", borderRadius: 12, display: "flex", alignItems: "center",
                 gap: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardIcon:    { fontSize: "2rem" },
  cardValue:   { fontSize: "1.8rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  cardLabel:   { fontSize: "0.8rem", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" },
  section:     { marginTop: "1rem" },
  sectionTitle:{ fontSize: "1.1rem", fontWeight: 600, color: "#2d3748", marginBottom: "1rem" },
  actions:     { display: "flex", gap: "1rem", flexWrap: "wrap" },
  actionCard:  { display: "flex", alignItems: "center", gap: "1rem", padding: "1.1rem 1.5rem",
                 backgroundColor: "#fff", borderRadius: 10, cursor: "pointer",
                 boxShadow: "0 1px 4px rgba(0,0,0,0.07)", flex: "1 1 240px",
                 border: "1px solid #e2e8f0", transition: "box-shadow 0.2s" },
  actionIcon:  { fontSize: "1.8rem" },
  actionTitle: { fontWeight: 600, color: "#2d3748", margin: 0, fontSize: "0.95rem" },
  actionDesc:  { color: "#718096", margin: "2px 0 0", fontSize: "0.82rem" },
};

export default AdminDashboard;
