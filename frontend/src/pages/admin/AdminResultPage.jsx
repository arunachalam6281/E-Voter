import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getElectionResults, closeElection } from "../../services/resultService";
import { getAllElections } from "../../services/electionService";

/**
 * AdminResultPage — Admin view of election results with closure capability.
 *
 * Route: /admin/elections/:electionId/results
 *
 * Extends ElectionResultPage with admin-only features:
 *   - "Close Election" button (shown only when status = ACTIVE)
 *   - Inline confirmation before closure to prevent accidents
 *   - After closure: button disappears, status badge updates to COMPLETED
 *   - All result data refreshes from the POST /close response
 *
 * Closure flow:
 *   1. Admin clicks "Close Election"
 *   2. Inline confirmation shown ("This will end voting permanently")
 *   3. Admin confirms → POST /api/elections/{id}/close
 *   4. Backend sets status = COMPLETED, returns final ElectionResultResponse
 *   5. UI updates: COMPLETED badge, results rendered, close button gone
 *   6. VoteService already blocks new votes when status ≠ ACTIVE
 */
const AdminResultPage = () => {
  const { electionId: paramId } = useParams();
  const navigate                = useNavigate();

  const [elections,   setElections]   = useState([]);
  const [selectedId,  setSelectedId]  = useState(paramId || "");
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(!!paramId);
  const [closing,     setClosing]     = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [error,       setError]       = useState("");

  // Load election list for the picker (only needed when no paramId)
  useEffect(() => {
    if (!paramId) {
      getAllElections().then(setElections).catch(() => {});
    }
  }, [paramId]);

  // Load results when paramId is in the URL
  useEffect(() => {
    if (!paramId) return;
    setLoading(true);
    getElectionResults(paramId)
      .then(setResult)
      .catch(err => setError(err.response?.data?.message || "Failed to load results."))
      .finally(() => setLoading(false));
  }, [paramId]);

  const electionId = paramId || selectedId;

  const handlePickerChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setResult(null);
    setError("");
    if (!id) return;
    setLoading(true);
    getElectionResults(id)
      .then(setResult)
      .catch(err => setError(err.response?.data?.message || "Failed to load results."))
      .finally(() => setLoading(false));
  };

  const handleClose = async () => {
    setClosing(true);
    setError("");
    try {
      const finalResult = await closeElection(electionId);
      setResult(finalResult);
      setConfirming(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to close election.");
    } finally {
      setClosing(false);
    }
  };

  // ── Picker mode: no electionId in URL ──────────────────────────────────
  if (!paramId) {
    return (
      <div style={s.page}>
        <Sidebar />
        <main style={s.main}>
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Election Results</h1>
              <p style={{ color: "#718096", margin: "4px 0 0", fontSize: "0.9rem" }}>
                Select an election to view its results
              </p>
            </div>
          </div>

          <div style={s.selectorCard}>
            <label style={s.selectorLabel}>Select Election</label>
            <select style={s.select} value={selectedId} onChange={handlePickerChange}>
              <option value="">— Choose an election —</option>
              {elections.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.status})
                </option>
              ))}
            </select>
          </div>

          {error   && <div style={s.errorBox}>⚠️ {error}</div>}
          {loading && <p style={{ color: "#718096" }}>Loading results…</p>}

          {!selectedId && !loading && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p style={{ fontSize: "2.5rem" }}>🏆</p>
              <p style={{ color: "#718096" }}>Select an election above to view its results.</p>
            </div>
          )}

          {result && !loading && <ResultContent result={result}
            electionId={selectedId} navigate={navigate}
            confirming={confirming} setConfirming={setConfirming}
            closing={closing} handleClose={handleClose} s={s} />}
        </main>
      </div>
    );
  }

  const fmt = (dt) =>
    dt ? new Date(dt).toLocaleDateString("en-US", { dateStyle: "long" }) : "—";

  const isActive    = result?.electionStatus === "ACTIVE";
  const isCompleted = result?.electionStatus === "COMPLETED";

  // ── Direct mode: electionId present in URL ────────────────────────────
  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => navigate("/admin/elections")}>Elections</span>
          <span style={s.sep}>/</span>
          <span style={s.breadCurrent}>Results</span>
        </div>

        {loading && <p style={{ color: "#718096" }}>Loading results…</p>}
        {error   && <div style={s.errorBox}>⚠️ {error}</div>}

        {result && !loading && <ResultContent result={result}
          electionId={electionId} navigate={navigate}
          confirming={confirming} setConfirming={setConfirming}
          closing={closing} handleClose={handleClose} s={s} />}
      </main>
    </div>
  );
};

// ── Extracted result display — shared by both modes ────────────────────────
const ResultContent = ({ result, electionId, navigate, confirming, setConfirming, closing, handleClose, s }) => {
  const isActive    = result.electionStatus === "ACTIVE";
  const isCompleted = result.electionStatus === "COMPLETED";
  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString("en-US", { dateStyle: "long" }) : "—";

  return (
    <>
      <div style={s.header}>
        <div>
          <div style={s.titleRow}>
            <h1 style={s.title}>{result.electionTitle}</h1>
            <StatusBadge status={result.electionStatus} />
          </div>
          <p style={s.dates}>📅 {fmt(result.startDate)} — {fmt(result.endDate)}</p>
        </div>

        {isActive && (
          <div>
            {confirming ? (
              <div style={s.confirmRow}>
                <span style={s.confirmMsg}>⚠️ This will permanently end voting.</span>
                <button style={s.confirmYes} onClick={handleClose} disabled={closing}>
                  {closing ? "Closing…" : "Yes, Close Election"}
                </button>
                <button style={s.confirmNo} onClick={() => setConfirming(false)} disabled={closing}>
                  Cancel
                </button>
              </div>
            ) : (
              <button style={s.closeBtn} onClick={() => setConfirming(true)}>🔒 Close Election</button>
            )}
          </div>
        )}
        {isCompleted && <div style={s.completedBadge}>🏁 Election Closed</div>}
      </div>

      <div style={s.summaryBanner}>
        <span style={s.summaryIcon}>
          {result.totalVotes === 0 ? "📭" : result.isTie ? "🤝" : "🏆"}
        </span>
        <p style={s.summaryText}>{result.resultSummary}</p>
      </div>

      {result.totalVotes > 0 && (
        <div style={{ ...s.winnerCard, ...(result.isTie ? s.winnerCardTie : s.winnerCardWin) }}>
          {result.isTie ? (
            <>
              <p style={s.winnerLabel}>🤝 Tied Election</p>
              <div style={s.tiedNames}>
                {result.winners.map(w => (
                  <div key={w.candidateId} style={s.tiedChip}>
                    <span style={s.tiedName}>{w.candidateName}</span>
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
                {result.winners[0]?.voteCount} votes &nbsp;·&nbsp; {result.winners[0]?.percentage}%
              </p>
            </>
          )}
        </div>
      )}

      <div style={s.statsRow}>
        <StatCard icon="🗳️" label="Total Votes" value={result.totalVotes} />
        <StatCard icon="👤" label="Candidates"  value={result.allResults.length} />
        <StatCard icon={result.isTie ? "🤝" : "✅"} label="Outcome"
          value={result.totalVotes === 0 ? "No Votes" : result.isTie ? "Tie" : "Winner Declared"} />
      </div>

      {result.allResults.length > 0 && (
        <div style={s.leaderboard}>
          <h2 style={s.leaderboardTitle}>
            Full Breakdown
            <span style={s.count}>{result.allResults.length} candidates</span>
          </h2>
          {result.allResults.map((r, idx) => (
            <div key={r.candidateId} style={{
              ...s.row,
              ...(r.isWinner ? (result.isTie ? s.rowTie : s.rowWinner) : {}),
            }}>
              <div style={s.rank}>
                {r.isWinner ? (result.isTie ? "🤝" : "🏆") : `#${idx + 1}`}
              </div>
              <div style={{ ...s.avatar, backgroundColor: r.isWinner ? (result.isTie ? "#b7791f" : "#276749") : "#3182ce" }}>
                {r.candidateName.charAt(0).toUpperCase()}
              </div>
              <div style={s.rowBody}>
                <div style={s.rowNameRow}>
                  <span style={s.candidateName}>{r.candidateName}</span>
                  {r.isWinner && !result.isTie && <span style={s.winnerChip}>Winner</span>}
                  {r.isWinner && result.isTie  && <span style={s.tieChip}>Tied</span>}
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${r.percentage}%`,
                    backgroundColor: r.isWinner ? (result.isTie ? "#b7791f" : "#276749") : "#3182ce" }} />
                </div>
              </div>
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
          <p style={{ color: "#718096" }}>No votes were cast in this election.</p>
        </div>
      )}
    </>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div style={s.statCard}>
    <span style={s.statIcon}>{icon}</span>
    <div>
      <p style={s.statValue}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  </div>
);

const s = {
  selectorCard:  { backgroundColor: "#fff", borderRadius: 10, padding: "1.25rem 1.5rem",
                   border: "1px solid #e2e8f0", marginBottom: "1.5rem",
                   boxShadow: "0 1px 3px rgba(0,0,0,0.05)", maxWidth: 520 },
  selectorLabel: { display: "block", fontSize: "0.85rem", fontWeight: 600,
                   color: "#4a5568", marginBottom: 8 },
  select:        { width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0",
                   borderRadius: 8, fontSize: "0.92rem", outline: "none",
                   backgroundColor: "#fff", fontFamily: "inherit", cursor: "pointer" },
  page:             { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:             { marginLeft: 240, flex: 1, padding: "2rem 2.5rem", maxWidth: 1000 },
  breadcrumb:       { display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", marginBottom: "0.75rem" },
  breadLink:        { color: "#3182ce", cursor: "pointer", fontWeight: 500 },
  breadCurrent:     { color: "#4a5568" },
  sep:              { color: "#a0aec0" },
  header:           { display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" },
  titleRow:         { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title:            { fontSize: "1.5rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  dates:            { color: "#718096", fontSize: "0.85rem", margin: "6px 0 0" },
  closeBtn:         { padding: "0.6rem 1.25rem", backgroundColor: "#e53e3e", color: "#fff",
                      border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                      fontSize: "0.9rem" },
  confirmRow:       { display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" },
  confirmMsg:       { fontSize: "0.82rem", color: "#c53030", fontWeight: 500 },
  confirmYes:       { padding: "0.5rem 1rem", backgroundColor: "#e53e3e", color: "#fff",
                      border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                      fontSize: "0.85rem" },
  confirmNo:        { padding: "0.5rem 1rem", backgroundColor: "#edf2f7", color: "#4a5568",
                      border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" },
  completedBadge:   { padding: "0.5rem 1rem", backgroundColor: "#e2e8f0", color: "#4a5568",
                      borderRadius: 8, fontWeight: 600, fontSize: "0.85rem" },
  errorBox:         { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                      padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  summaryBanner:    { display: "flex", alignItems: "center", gap: "0.75rem",
                      backgroundColor: "#fffff0", border: "1px solid #f6e05e",
                      borderRadius: 10, padding: "0.85rem 1.25rem", marginBottom: "1.25rem" },
  summaryIcon:      { fontSize: "1.4rem", flexShrink: 0 },
  summaryText:      { color: "#744210", fontWeight: 500, fontSize: "0.92rem", margin: 0 },
  winnerCard:       { borderRadius: 12, padding: "1.5rem 2rem", marginBottom: "1.25rem",
                      textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  winnerCardWin:    { backgroundColor: "#f0fff4", border: "2px solid #68d391" },
  winnerCardTie:    { backgroundColor: "#fffff0", border: "2px solid #f6e05e" },
  winnerLabel:      { fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.08em", color: "#718096", margin: "0 0 6px" },
  winnerName:       { fontSize: "1.6rem", fontWeight: 800, color: "#1a202c", margin: "0 0 4px" },
  winnerVotes:      { fontSize: "0.92rem", color: "#4a5568", margin: 0 },
  tiedNames:        { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: 8 },
  tiedChip:         { backgroundColor: "#fff", border: "1.5px solid #ecc94b", borderRadius: 10,
                      padding: "0.5rem 1rem", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 2 },
  tiedName:         { fontWeight: 600, color: "#1a202c", fontSize: "0.92rem" },
  tiedVotes:        { fontSize: "0.75rem", color: "#718096" },
  statsRow:         { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" },
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
  rank:             { fontSize: "1.1rem", width: 30, textAlign: "center", flexShrink: 0, color: "#718096" },
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

export default AdminResultPage;
