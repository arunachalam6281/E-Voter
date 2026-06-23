import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getVoteStatistics } from "../../services/voteService";
import { getAllElections } from "../../services/electionService";

/**
 * VoteStatistics — Admin page displaying voting results for an election.
 *
 * Route A: /admin/elections/:electionId/statistics
 *   → Loads statistics directly for that election (from election detail page)
 *
 * Route B: /admin/statistics
 *   → Shows an election picker first (no electionId in URL)
 *
 * Both routes render this single component.
 * When electionId is present in URL params it is used immediately.
 * When absent, the admin first selects from a dropdown.
 *
 * Data source: GET /api/admin/votes/statistics/{electionId}
 * Returns: { electionId, electionTitle, totalVotes, results[] }
 *
 * results[] is already sorted by voteCount DESC from the backend JPQL query.
 * The first item is always the leader (or tied for first).
 */
const VoteStatistics = () => {
  const { electionId: paramId } = useParams();
  const navigate                = useNavigate();

  const [elections,  setElections]  = useState([]);
  const [selectedId, setSelectedId] = useState(paramId || "");
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [elecLoading,setElecLoading]= useState(true);
  const [error,      setError]      = useState("");

  // Load election list for the dropdown selector
  useEffect(() => {
    getAllElections()
      .then(setElections)
      .catch(() => setError("Failed to load elections."))
      .finally(() => setElecLoading(false));
  }, []);

  // If URL has electionId, load stats immediately
  useEffect(() => {
    if (paramId) {
      setSelectedId(paramId);
      loadStats(paramId);
    }
  }, [paramId]);

  const loadStats = (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    setStats(null);
    getVoteStatistics(id)
      .then(setStats)
      .catch(err => setError(err.response?.data?.message || "Failed to load statistics."))
      .finally(() => setLoading(false));
  };

  const handleElectionChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (id) loadStats(id);
    else setStats(null);
  };

  // The candidate with the most votes (index 0, already sorted by backend)
  const winner = stats?.results?.[0];
  const isWinner = (candidateId) =>
    stats?.totalVotes > 0 && winner?.candidateId === candidateId;

  // Find election status for the selected election
  const selectedElection = elections.find(e => String(e.id) === String(selectedId));

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Vote Statistics</h1>
            <p style={s.subtitle}>Real-time voting results per election</p>
          </div>
        </div>

        {/* Election selector */}
        <div style={s.selectorCard}>
          <label style={s.selectorLabel}>Select Election</label>
          <select
            style={s.select}
            value={selectedId}
            onChange={handleElectionChange}
            disabled={elecLoading}
          >
            <option value="">— Choose an election —</option>
            {elections.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status})
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Loading indicator */}
        {loading && (
          <p style={{ color: "#718096" }}>Loading statistics…</p>
        )}

        {/* ── Statistics panel ──────────────────────────────────────── */}
        {stats && !loading && (
          <>
            {/* Election summary card */}
            <div style={s.summaryCard}>
              <div style={s.summaryLeft}>
                <div style={s.electionTitleRow}>
                  <h2 style={s.electionTitle}>{stats.electionTitle}</h2>
                  {selectedElection && <StatusBadge status={selectedElection.status} />}
                </div>
                <p style={s.summaryMeta}>Election ID: #{stats.electionId}</p>
              </div>
              <div style={s.totalVotesBadge}>
                <span style={s.totalVotesNum}>{stats.totalVotes}</span>
                <span style={s.totalVotesLabel}>Total Votes</span>
              </div>
            </div>

            {/* No votes yet */}
            {stats.totalVotes === 0 && (
              <div style={s.noVotes}>
                <p style={{ fontSize: "2.5rem", margin: 0 }}>📊</p>
                <p style={{ color: "#718096", marginTop: 8 }}>
                  No votes have been cast in this election yet.
                </p>
              </div>
            )}

            {/* Results table */}
            {stats.results.length > 0 && (
              <div style={s.resultsCard}>
                <h3 style={s.resultsTitle}>Results Breakdown</h3>

                <div style={s.resultsList}>
                  {stats.results.map((r, idx) => {
                    const leading = isWinner(r.candidateId);
                    return (
                      <div key={r.candidateId}
                        style={{ ...s.resultRow, ...(leading ? s.resultRowWinner : {}) }}>

                        {/* Rank */}
                        <div style={{ ...s.rank, color: leading ? "#276749" : "#718096" }}>
                          {leading ? "🥇" : `#${idx + 1}`}
                        </div>

                        {/* Avatar */}
                        <div style={{ ...s.resultAvatar,
                          backgroundColor: leading ? "#276749" : "#3182ce" }}>
                          {r.candidateName.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + bar */}
                        <div style={s.resultBody}>
                          <div style={s.resultNameRow}>
                            <span style={s.resultName}>{r.candidateName}</span>
                            {leading && stats.totalVotes > 0 && (
                              <span style={s.leadingChip}>Leading</span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div style={s.barTrack}>
                            <div style={{
                              ...s.barFill,
                              width: `${r.percentage}%`,
                              backgroundColor: leading ? "#276749" : "#3182ce",
                            }} />
                          </div>
                        </div>

                        {/* Numbers */}
                        <div style={s.resultNumbers}>
                          <span style={s.voteCount}>{r.voteCount}</span>
                          <span style={s.votePct}>{r.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Candidates with zero votes (those not in results) */}
            {stats.totalVotes > 0 && (
              <p style={s.footNote}>
                * Candidates with 0 votes are not shown in the breakdown above.
              </p>
            )}
          </>
        )}

        {/* No election selected yet */}
        {!selectedId && !loading && (
          <div style={s.noSelection}>
            <p style={{ fontSize: "2.5rem" }}>📊</p>
            <p style={{ color: "#718096" }}>Select an election above to view its voting results.</p>
          </div>
        )}

      </main>
    </div>
  );
};

const s = {
  page:            { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:            { marginLeft: 240, flex: 1, padding: "2rem 2.5rem" },
  header:          { marginBottom: "1.5rem" },
  title:           { fontSize: "1.6rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  subtitle:        { color: "#718096", margin: "4px 0 0", fontSize: "0.9rem" },
  selectorCard:    { backgroundColor: "#fff", borderRadius: 10, padding: "1.25rem 1.5rem",
                     border: "1px solid #e2e8f0", marginBottom: "1.5rem",
                     boxShadow: "0 1px 3px rgba(0,0,0,0.05)", maxWidth: 520 },
  selectorLabel:   { display: "block", fontSize: "0.85rem", fontWeight: 600,
                     color: "#4a5568", marginBottom: 8 },
  select:          { width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0",
                     borderRadius: 8, fontSize: "0.92rem", outline: "none",
                     backgroundColor: "#fff", fontFamily: "inherit", cursor: "pointer" },
  errorBox:        { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                     padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  summaryCard:     { backgroundColor: "#fff", borderRadius: 12, padding: "1.25rem 1.5rem",
                     border: "1px solid #e2e8f0", marginBottom: "1.25rem",
                     display: "flex", justifyContent: "space-between", alignItems: "center",
                     boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: "1rem" },
  summaryLeft:     { flex: 1 },
  electionTitleRow:{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  electionTitle:   { fontSize: "1.2rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  summaryMeta:     { color: "#718096", fontSize: "0.82rem", margin: "4px 0 0" },
  totalVotesBadge: { display: "flex", flexDirection: "column", alignItems: "center",
                     backgroundColor: "#1a202c", borderRadius: 12, padding: "0.75rem 1.5rem",
                     minWidth: 90, textAlign: "center" },
  totalVotesNum:   { fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1 },
  totalVotesLabel: { fontSize: "0.72rem", color: "#a0aec0", marginTop: 4,
                     textTransform: "uppercase", letterSpacing: "0.06em" },
  noVotes:         { textAlign: "center", padding: "3rem 0" },
  noSelection:     { textAlign: "center", padding: "3rem 0" },
  resultsCard:     { backgroundColor: "#fff", borderRadius: 12, padding: "1.5rem",
                     border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  resultsTitle:    { fontSize: "1rem", fontWeight: 700, color: "#2d3748",
                     margin: "0 0 1.25rem", paddingBottom: "0.75rem",
                     borderBottom: "1px solid #e2e8f0" },
  resultsList:     { display: "flex", flexDirection: "column", gap: "0.85rem" },
  resultRow:       { display: "flex", alignItems: "center", gap: "1rem",
                     padding: "0.85rem 1rem", borderRadius: 10,
                     border: "1.5px solid #e2e8f0", backgroundColor: "#fff" },
  resultRowWinner: { borderColor: "#9ae6b4", backgroundColor: "#f0fff4" },
  rank:            { fontSize: "1.1rem", width: 28, textAlign: "center", flexShrink: 0 },
  resultAvatar:    { width: 38, height: 38, borderRadius: "50%", color: "#fff",
                     display: "flex", alignItems: "center", justifyContent: "center",
                     fontWeight: 700, fontSize: "1rem", flexShrink: 0 },
  resultBody:      { flex: 1, minWidth: 0 },
  resultNameRow:   { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  resultName:      { fontWeight: 600, color: "#1a202c", fontSize: "0.92rem",
                     overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  leadingChip:     { backgroundColor: "#276749", color: "#fff", borderRadius: 999,
                     padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 },
  barTrack:        { height: 8, backgroundColor: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  barFill:         { height: "100%", borderRadius: 999, transition: "width 0.4s ease" },
  resultNumbers:   { display: "flex", flexDirection: "column", alignItems: "flex-end",
                     flexShrink: 0, minWidth: 60 },
  voteCount:       { fontSize: "1rem", fontWeight: 700, color: "#1a202c" },
  votePct:         { fontSize: "0.78rem", color: "#718096" },
  footNote:        { color: "#a0aec0", fontSize: "0.78rem", marginTop: "0.75rem" },
};

export default VoteStatistics;
