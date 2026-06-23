import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { getCandidatesByElection } from "../../services/candidateService";
import { getElectionById } from "../../services/electionService";
import { useAuth } from "../../context/AuthContext";

/**
 * CandidatesVoter — Read-only candidate cards for voters.
 *
 * Route: /voter/elections/:electionId/candidates
 *
 * Voters can:
 *   - Browse all candidates in an election
 *   - Search by name
 *   - See the election title, status, and dates
 *
 * Voters cannot create, edit, or delete — those controls are not rendered.
 * Security is also enforced server-side via @PreAuthorize on the controller.
 *
 * Layout: top nav bar (same as ElectionsVoter) — no sidebar for voters.
 */
const CandidatesVoter = () => {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const { user, logout } = useAuth();

  const [election,   setElection]   = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    Promise.all([
      getElectionById(electionId),
      getCandidatesByElection(electionId),
    ])
      .then(([elec, cands]) => { setElection(elec); setCandidates(cands); })
      .catch(() => setError("Failed to load candidates."))
      .finally(() => setLoading(false));
  }, [electionId]);

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—";

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

        {/* Back link */}
        <div style={s.back} onClick={() => navigate("/voter/elections")}>
          ← Back to Elections
        </div>

        {/* Election header */}
        {election && (
          <div style={s.electionHeader}>
            <div>
              <div style={s.electionTitleRow}>
                <h1 style={s.title}>{election.title}</h1>
                <StatusBadge status={election.status} />
              </div>
              <p style={s.electionDates}>
                📅 {fmt(election.startDate)} — {fmt(election.endDate)}
              </p>
              {election.description && (
                <p style={s.electionDesc}>{election.description}</p>
              )}
            </div>
          </div>
        )}

        <h2 style={s.sectionTitle}>
          Candidates
          <span style={s.count}>{filtered.length}</span>
        </h2>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Search */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search candidates by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Candidate Grid */}
        {loading ? (
          <p style={s.hint}>Loading candidates…</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "2.5rem" }}>👤</p>
            <p style={s.hint}>
              {search ? "No candidates match your search." : "No candidates have been added yet."}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(c => (
              <div key={c.id} style={s.card}>
                {/* Image / Avatar */}
                <div style={s.cardImageWrap}>
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} style={s.cardImg}
                      onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div style={s.cardAvatar}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={s.cardContent}>
                  <h3 style={s.candidateName}>{c.name}</h3>
                  {c.description ? (
                    <p style={s.candidateDesc}>{c.description}</p>
                  ) : (
                    <p style={{ ...s.candidateDesc, fontStyle: "italic", color: "#a0aec0" }}>
                      No description provided.
                    </p>
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
  page:            { minHeight: "100vh", backgroundColor: "#f7fafc", fontFamily: "'Segoe UI', sans-serif" },
  nav:             { backgroundColor: "#1a202c", display: "flex", justifyContent: "space-between",
                     alignItems: "center", padding: "0 2rem", height: 56,
                     position: "sticky", top: 0, zIndex: 50 },
  navBrand:        { color: "#fff", fontWeight: 700, fontSize: "1.1rem" },
  navRight:        { display: "flex", alignItems: "center", gap: "1rem" },
  navUser:         { color: "#a0aec0", fontSize: "0.88rem" },
  logoutBtn:       { padding: "5px 14px", backgroundColor: "#e53e3e", color: "#fff",
                     border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
  main:            { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" },
  back:            { color: "#3182ce", cursor: "pointer", fontSize: "0.88rem",
                     fontWeight: 500, marginBottom: "1.25rem", display: "inline-block" },
  electionHeader:  { backgroundColor: "#fff", borderRadius: 12, padding: "1.25rem 1.5rem",
                     border: "1px solid #e2e8f0", marginBottom: "1.75rem",
                     boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  electionTitleRow:{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title:           { fontSize: "1.4rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  electionDates:   { color: "#718096", fontSize: "0.85rem", margin: "6px 0 0" },
  electionDesc:    { color: "#4a5568", fontSize: "0.9rem", margin: "8px 0 0", lineHeight: 1.6 },
  sectionTitle:    { fontSize: "1.1rem", fontWeight: 700, color: "#2d3748",
                     margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 8 },
  count:           { backgroundColor: "#edf2f7", color: "#4a5568", borderRadius: 999,
                     padding: "2px 10px", fontSize: "0.82rem", fontWeight: 600 },
  errorBox:        { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                     padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  searchWrap:      { display: "flex", alignItems: "center", backgroundColor: "#fff",
                     border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 0.75rem",
                     marginBottom: "1.5rem", maxWidth: 400 },
  searchIcon:      { fontSize: "0.9rem", marginRight: 6, color: "#a0aec0" },
  searchInput:     { flex: 1, border: "none", outline: "none", padding: "0.6rem 0",
                     fontSize: "0.92rem", background: "transparent" },
  clearBtn:        { background: "none", border: "none", cursor: "pointer", color: "#a0aec0", fontSize: "0.85rem" },
  hint:            { color: "#718096" },
  empty:           { textAlign: "center", padding: "3rem 0" },
  grid:            { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" },
  card:            { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden",
                     border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                     display: "flex", flexDirection: "column" },
  cardImageWrap:   { display: "flex", justifyContent: "center", padding: "1.5rem 1.5rem 0.75rem" },
  cardImg:         { width: 80, height: 80, borderRadius: "50%", objectFit: "cover" },
  cardAvatar:      { width: 80, height: 80, borderRadius: "50%", backgroundColor: "#3182ce",
                     color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                     fontWeight: 700, fontSize: "2rem" },
  cardContent:     { padding: "0 1.25rem 1.5rem", textAlign: "center", flex: 1 },
  candidateName:   { fontSize: "1rem", fontWeight: 700, color: "#1a202c", margin: "0 0 8px" },
  candidateDesc:   { color: "#718096", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 },
};

export default CandidatesVoter;
