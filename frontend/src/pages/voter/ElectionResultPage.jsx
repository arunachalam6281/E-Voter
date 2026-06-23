import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { getElectionResults } from "../../services/resultService";
import { useAuth } from "../../context/AuthContext";

/**
 * ElectionResultPage — Voter-facing election results page.
 *
 * Route: /voter/elections/:electionId/results
 *
 * Shows:
 *   - COMPLETED badge on the election header
 *   - Winner card (gold trophy) for clear winner
 *   - Tie card (silver, lists all tied candidates) when isTie = true
 *   - "No votes cast" state when totalVotes = 0
 *   - Full ranked leaderboard with progress bars and percentages
 *   - Human-readable result summary sentence from the backend
 *
 * The backend blocks this for UPCOMING elections (returns 400).
 * Available for both ACTIVE (live tally) and COMPLETED (final) elections.
 */
const ElectionResultPage = () => {
  const { electionId } = useParams();
  const navigate       = useNavigate();
  const { user, logout } = useAuth();

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getElectionResults(electionId)
      .then(setResult)
      .catch(err => setError(
        err.response?.data?.message || "Failed to load results."
      ))
      .finally(() => setLoading(false));
  }, [electionId]);

  const fmt = (dt) =>
    dt ? new Date(dt).toLocaleDateString("en-US", { dateStyle: "long" }) : "—";

  return (
    <div style={s.page}>
      {/* Top Nav */}
      <header style={s.nav}>
        <div style={s.navBrand}>🗳️ E-Voter</div>
        <div style={s.navRight}>
          <span style={s.navUser}>👤 {user?.fullName}</span>
          <button style={s.logoutBtn}
            onClick={() => { logout(); navigate("/login"); }}>
            Logout
          </button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.back} onClick={() => navigate("/voter/elections")}>
          ← Back to Elections
        </div>

        {loading && <p style={{ color: "#718096" }}>Loading results…</p>}
        {error   && <div style={s.errorBox}>⚠️ {error}</div>}

        {result && (
          <>
            {/* Election header */}
            <div style={s.electionHeader}>
              <div style={s.electionTitleRow}>
                <h1 style={s.title}>{result.electionTitle}</h1>
                <StatusBadge status={result.electionStatus} />
              </div>
              <p style={s.dates}>
                📅 {fmt(result.startDate)} — {fmt(result.endDate)}
              </p>
              {result.electionDescription && (
                <p style={s.elDesc}>{result.electionDescription}</p>
              )}
            </div>

            {/* Summary sentence */}
            <div style={s.summaryBanner}>
              <span style={s.summaryIcon}>
                {result.totalVotes === 0 ? "📭"
                  : result.isTie ? "🤝" : "🏆"}
              </span>
              <p style={s.summaryText}>{result.resultSummary}</p>
            </div>

            {/* ── Winner / Tie card ───────────────────────────────── */}
            {result.totalVotes > 0 && (
              <div style={{
                ...s.winnerCard,
                ...(result.isTie ? s.winnerCardTie : s.winnerCardWin),
              }}>
                {result.isTie ? (
                  <>
                    <p style={s.winnerLabel}>🤝 Tied Election</p>
                    <div style={s.tiedNames}>
                      {result.winners.map(w => (
                        <div key={w.candidateId} style={s.tiedChip}>
                          {w.candidateName}
                          <span style={s.tiedVotes}>{w.voteCount} votes</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p style={s.winnerLabel}>🏆 Winner</p>
                    <p style={s.winnerName}>{result.winners[0]?.candidateName}</p>
                    <p style={s.winnerVotes}>
                      {result.winners[0]?.voteCount} votes
                      &nbsp;·&nbsp;
                      {result.winners[0]?.percentage}%
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── Stats row ───────────────────────────────────────── */}
            <div style={s.statsRow}>
              <StatCard label="Total Votes"  value={result.totalVotes} icon="🗳️" />
              <StatCard label="Candidates"   value={result.allResults.length} icon="👤" />
              <StatCard label="Result"
                value={result.totalVotes === 0 ? "No Votes"
                  : result.isTie ? "Tie" : "Winner Declared"}
                icon={result.isTie ? "🤝" : "✅"} />
            </div>

            {/* ── Full ranked leaderboard ─────────────────────────── */}
            {result.allResults.length > 0 && (
              <div style={s.leaderboard}>
                <h2 style={s.leaderboardTitle}>
                  Full Results
                  <span style={s.count}>{result.allResults.length}</span>
                </h2>

                {result.allResults.map((r, idx) => (
                  <div key={r.candidateId}
                    style={{
                      ...s.row,
                      ...(r.isWinner ? (result.isTie ? s.rowTie : s.rowWinner) : {}),
                    }}>

                    {/* Rank */}
                    <div style={s.rank}>
                      {r.isWinner
                        ? (result.isTie ? "🤝" : "🏆")
                        : `#${idx + 1}`}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      ...s.avatar,
                      backgroundColor: r.isWinner
                        ? (result.isTie ? "#b7791f" : "#276749")
                        : "#3182ce",
                    }}>
                      {r.candidateName.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + bar */}
                    <div style={s.rowBody}>
                      <div style={s.rowNameRow}>
                        <span style={s.candidateName}>{r.candidateName}</span>
                        {r.isWinner && !result.isTie && (
                          <span style={s.winnerChip}>Winner</span>
                        )}
                        {r.isWinner && result.isTie && (
                          <span style={s.tieChip}>Tied</span>
                        )}
                      </div>
                      <div style={s.barTrack}>
                        <div style={{
                          ...s.barFill,
                          width: `${r.percentage}%`,
                          backgroundColor: r.isWinner
                            ? (result.isTie ? "#b7791f" : "#276749")
                            : "#3182ce",
                        }} />
                      </div>
                    </div>

                    {/* Numbers */}
                    <div style={s.rowNumbers}>
                      <span style={s.voteCount}>{r.voteCount}</span>
                      <span style={s.votePct}>{r.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.totalVotes === 0 && (
              <div style={s.noVotes}>
                <p style={{ fontSize: "2.5rem" }}>📭</p>
                <p style={{ color: "#718096" }}>
                  No votes were cast in this election.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// ── Shared sub-components ──────────────────────────────────────────────────
const StatCard = ({ label, value, icon }) => (
  <div style={s.statCard}>
    <span style={s.statIcon}>{icon}</span>
    <div>
      <p style={s.statValue}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  </div>
);

const s = {
  page:             { minHeight: "100vh", backgroundColor: "#f7fafc", fontFamily: "'Segoe UI', sans-serif" },
  nav:              { backgroundColor: "#1a202c", display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "0 2rem", height: 56,
                      position: "sticky", top: 0, zIndex: 50 },
  navBrand:         { color: "#fff", fontWeight: 700, fontSize: "1.1rem" },
  navRight:         { display: "flex", alignItems: "center", gap: "1rem" },
  navUser:          { color: "#a0aec0", fontSize: "0.88rem" },
  logoutBtn:        { padding: "5px 14px", backgroundColor: "#e53e3e", color: "#fff",
                      border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
  main:             { maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem" },
  back:             { color: "#3182ce", cursor: "pointer", fontSize: "0.88rem",
                      fontWeight: 500, marginBottom: "1.25rem", display: "inline-block" },
  errorBox:         { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                      padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem" },
  electionHeader:   { backgroundColor: "#fff", borderRadius: 12, padding: "1.25rem 1.5rem",
                      border: "1px solid #e2e8f0", marginBottom: "1.25rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  electionTitleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title:            { fontSize: "1.4rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  dates:            { color: "#718096", fontSize: "0.85rem", margin: "6px 0 0" },
  elDesc:           { color: "#4a5568", fontSize: "0.9rem", margin: "8px 0 0", lineHeight: 1.6 },
  summaryBanner:    { display: "flex", alignItems: "center", gap: "0.75rem",
                      backgroundColor: "#fffff0", border: "1px solid #f6e05e",
                      borderRadius: 10, padding: "0.85rem 1.25rem", marginBottom: "1.25rem" },
  summaryIcon:      { fontSize: "1.4rem", flexShrink: 0 },
  summaryText:      { color: "#744210", fontWeight: 500, fontSize: "0.92rem", margin: 0 },
  winnerCard:       { borderRadius: 12, padding: "1.5rem 2rem", marginBottom: "1.25rem",
                      textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  winnerCardWin:    { backgroundColor: "#f0fff4", border: "2px solid #68d391" },
  winnerCardTie:    { backgroundColor: "#fffff0", border: "2px solid #f6e05e" },
  winnerLabel:      { fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.08em", color: "#718096", margin: "0 0 6px" },
  winnerName:       { fontSize: "1.6rem", fontWeight: 800, color: "#1a202c", margin: "0 0 4px" },
  winnerVotes:      { fontSize: "0.92rem", color: "#4a5568", margin: 0 },
  tiedNames:        { display: "flex", gap: "0.75rem", justifyContent: "center",
                      flexWrap: "wrap", marginTop: 8 },
  tiedChip:         { backgroundColor: "#fff", border: "1.5px solid #ecc94b", borderRadius: 10,
                      padding: "0.5rem 1rem", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 2 },
  tiedVotes:        { fontSize: "0.75rem", color: "#718096" },
  statsRow:         { display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "1rem", marginBottom: "1.5rem" },
  statCard:         { backgroundColor: "#fff", borderRadius: 10, padding: "1rem 1.25rem",
                      border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
                      gap: "0.85rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  statIcon:         { fontSize: "1.6rem" },
  statValue:        { fontSize: "1.3rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  statLabel:        { fontSize: "0.75rem", color: "#718096", margin: 0,
                      textTransform: "uppercase", letterSpacing: "0.04em" },
  leaderboard:      { backgroundColor: "#fff", borderRadius: 12, padding: "1.5rem",
                      border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  leaderboardTitle: { fontSize: "1rem", fontWeight: 700, color: "#2d3748",
                      margin: "0 0 1.25rem", paddingBottom: "0.75rem",
                      borderBottom: "1px solid #e2e8f0", display: "flex",
                      alignItems: "center", gap: 8 },
  count:            { backgroundColor: "#edf2f7", color: "#4a5568", borderRadius: 999,
                      padding: "2px 10px", fontSize: "0.82rem", fontWeight: 600 },
  row:              { display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: 10, border: "1.5px solid #e2e8f0",
                      marginBottom: "0.65rem" },
  rowWinner:        { borderColor: "#9ae6b4", backgroundColor: "#f0fff4" },
  rowTie:           { borderColor: "#f6e05e", backgroundColor: "#fffff0" },
  rank:             { fontSize: "1.1rem", width: 30, textAlign: "center",
                      flexShrink: 0, color: "#718096" },
  avatar:           { width: 38, height: 38, borderRadius: "50%", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "1rem", flexShrink: 0 },
  rowBody:          { flex: 1, minWidth: 0 },
  rowNameRow:       { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  candidateName:    { fontWeight: 600, color: "#1a202c", fontSize: "0.92rem",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  winnerChip:       { backgroundColor: "#276749", color: "#fff", borderRadius: 999,
                      padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 },
  tieChip:          { backgroundColor: "#b7791f", color: "#fff", borderRadius: 999,
                      padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 },
  barTrack:         { height: 8, backgroundColor: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  barFill:          { height: "100%", borderRadius: 999, transition: "width 0.5s ease" },
  rowNumbers:       { display: "flex", flexDirection: "column", alignItems: "flex-end",
                      flexShrink: 0, minWidth: 60 },
  voteCount:        { fontSize: "1rem", fontWeight: 700, color: "#1a202c" },
  votePct:          { fontSize: "0.78rem", color: "#718096" },
  noVotes:          { textAlign: "center", padding: "3rem 0" },
};

export default ElectionResultPage;
