import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { getCandidatesByElection } from "../../services/candidateService";
import { getElectionById } from "../../services/electionService";
import { castVote, getVoteStatus } from "../../services/voteService";
import { useAuth } from "../../context/AuthContext";

/**
 * VotingPage — Core voter experience for Module 4.
 *
 * Route: /voter/elections/:electionId/vote
 *
 * On mount — three parallel API calls:
 *   1. getElectionById(electionId)       → election title, status, dates
 *   2. getCandidatesByElection(electionId) → candidate cards to render
 *   3. getVoteStatus(electionId)         → hasVoted? which candidate?
 *
 * UI states driven by API data:
 *   loading       → spinner
 *   alreadyVoted  → "You already voted" banner, chosen candidate highlighted,
 *                   all vote buttons disabled
 *   notActive     → election is UPCOMING or COMPLETED — warn voter
 *   canVote       → candidate cards with "Vote" button enabled
 *   confirming    → modal dialog asking for final confirmation
 *   success       → thank-you screen with vote receipt
 *
 * Voter identity: NEVER sent in request body.
 * The backend resolves it from the JWT (SecurityContextHolder → email → User).
 * We only send { electionId, candidateId } to castVote.
 */
const VotingPage = () => {
  const { electionId } = useParams();
  const navigate        = useNavigate();
  const { user, logout } = useAuth();

  const [election,   setElection]   = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voteStatus, setVoteStatus] = useState(null);
  const [selected,   setSelected]   = useState(null);   // candidate the voter clicked
  const [confirming, setConfirming] = useState(false);
  const [voteResult, setVoteResult] = useState(null);   // VoteResponse after success
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    Promise.all([
      getElectionById(electionId),
      getCandidatesByElection(electionId),
      getVoteStatus(electionId),
    ])
      .then(([elec, cands, status]) => {
        setElection(elec);
        setCandidates(cands);
        setVoteStatus(status);
      })
      .catch(() => setError("Failed to load voting page. Please try again."))
      .finally(() => setLoading(false));
  }, [electionId]);

  const handleSelect = (candidate) => {
    if (voteStatus?.hasVoted || voteResult) return;
    setSelected(candidate);
    setError("");
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await castVote({
        electionId:  Number(electionId),
        candidateId: selected.id,
      });
      setVoteResult(result);
      setConfirming(false);
      setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cast vote. Please try again.");
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  const fmt   = (dt) => dt ? new Date(dt).toLocaleDateString("en-US", { dateStyle: "long" }) : "—";
  const fmtTs = (ts) => ts ? new Date(ts).toLocaleString() : "—";

  // ── Shared nav wrapper ─────────────────────────────────────────────────
  const wrap = (children) => (
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
      <main style={s.main}>{children}</main>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return wrap(
    <p style={{ color: "#718096", padding: "3rem 0" }}>Loading election…</p>
  );

  // ── Unverified voter ────────────────────────────────────────────
  if (user?.isVerified === false) return wrap(
    <div style={s.pendingCard}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1a202c", margin: "0 0 0.75rem" }}>
        Account Pending Approval
      </h2>
      <p style={{ color: "#718096", fontSize: "0.92rem", lineHeight: 1.7, margin: "0 0 1.25rem" }}>
        Your account has not been verified by an admin yet.
        You cannot cast a vote until your account is approved.
      </p>
      <button style={s.backBtn} onClick={() => navigate("/voter/elections")}>
        ← Back to Elections
      </button>
    </div>
  );

  // ── Fatal error (no election data at all) ─────────────────────────────
  if (!election && error) return wrap(
    <div style={s.errorBox}>⚠️ {error}</div>
  );

  // ── Success screen ────────────────────────────────────────────────────
  if (voteResult) return wrap(
    <div style={s.successCard}>
      <div style={s.successIcon}>✅</div>
      <h2 style={s.successTitle}>Vote Cast Successfully!</h2>
      <p style={s.successSub}>Thank you for participating in the democratic process.</p>
      <div style={s.receiptBox}>
        <ReceiptRow label="Election"  value={voteResult.electionTitle} />
        <ReceiptRow label="Candidate" value={voteResult.candidateName} />
        <ReceiptRow label="Voted At"  value={fmtTs(voteResult.votedAt)} />
      </div>
      <button style={s.backBtn} onClick={() => navigate("/voter/elections")}>
        ← Back to Elections
      </button>
    </div>
  );

  const alreadyVoted = voteStatus?.hasVoted;
  const isActive     = election?.status === "ACTIVE";

  return wrap(
    <>
      {/* Breadcrumb */}
      <div style={s.back} onClick={() => navigate("/voter/elections")}>
        ← Back to Elections
      </div>

      {/* Election header card */}
      <div style={s.electionHeader}>
        <div style={s.electionTitleRow}>
          <h1 style={s.title}>{election?.title}</h1>
          {election && <StatusBadge status={election.status} />}
        </div>
        <p style={s.dates}>📅 {fmt(election?.startDate)} — {fmt(election?.endDate)}</p>
        {election?.description && (
          <p style={s.elDesc}>{election.description}</p>
        )}
      </div>

      {/* ── Status banners ────────────────────────────────────────────── */}

      {alreadyVoted && (
        <div style={s.alreadyVotedBanner}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🗳️</span>
          <div>
            <p style={s.bannerTitle}>You have already voted in this election.</p>
            <p style={s.bannerSub}>
              Your choice: <strong>{voteStatus.votedCandidateName}</strong>
              {voteStatus.votedAt && (
                <span style={{ color: "#276749" }}> · {fmtTs(voteStatus.votedAt)}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {!isActive && !alreadyVoted && (
        <div style={s.warningBanner}>
          ⚠️ This election is <strong>{election?.status}</strong>.
          Voting is only open during ACTIVE elections.
        </div>
      )}

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* ── Candidates section ────────────────────────────────────────── */}
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>
          {alreadyVoted ? "Candidates" : isActive ? "Select a Candidate" : "Candidates"}
          <span style={s.count}>{candidates.length}</span>
        </h2>
        {isActive && !alreadyVoted && (
          <p style={s.hint}>Click a candidate to select, then press "Cast My Vote".</p>
        )}
      </div>

      {candidates.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: "2.5rem" }}>👤</p>
          <p style={{ color: "#718096" }}>No candidates have been added to this election yet.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {candidates.map(c => {
            const isSelected    = selected?.id === c.id;
            const isVotedChoice = alreadyVoted && voteStatus?.votedCandidateId === c.id;
            const canSelect     = isActive && !alreadyVoted;
            const dimmed        = alreadyVoted && !isVotedChoice;

            return (
              <div
                key={c.id}
                onClick={() => canSelect && handleSelect(c)}
                style={{
                  ...s.card,
                  ...(isSelected    ? s.cardSelected    : {}),
                  ...(isVotedChoice ? s.cardVoted       : {}),
                  cursor:  canSelect ? "pointer" : "default",
                  opacity: dimmed    ? 0.5       : 1,
                }}
              >
                {/* Avatar / image */}
                <div style={s.avatarWrap}>
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} style={s.cardImg}
                      onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div style={{
                      ...s.cardAvatar,
                      backgroundColor: isVotedChoice ? "#276749"
                        : isSelected ? "#2b6cb0" : "#3182ce",
                    }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name + description */}
                <div style={s.cardBody}>
                  <p style={s.candidateName}>{c.name}</p>
                  {c.description && (
                    <p style={s.candidateDesc}>
                      {c.description.length > 100
                        ? c.description.slice(0, 100) + "…"
                        : c.description}
                    </p>
                  )}
                </div>

                {/* Indicator chip */}
                {isVotedChoice && <div style={s.chipVoted}>✓ Your Vote</div>}
                {isSelected && !alreadyVoted && <div style={s.chipSelected}>● Selected</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Vote button ───────────────────────────────────────────────── */}
      {isActive && !alreadyVoted && (
        <div style={s.voteBar}>
          <button
            style={{ ...s.voteBtn, opacity: selected ? 1 : 0.4 }}
            disabled={!selected}
            onClick={() => setConfirming(true)}
          >
            Cast My Vote →
          </button>
          {!selected && (
            <p style={s.hint}>Select a candidate above to enable this button.</p>
          )}
        </div>
      )}

      {/* ── Confirmation dialog (modal overlay) ──────────────────────── */}
      {confirming && selected && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <h3 style={s.dialogTitle}>Confirm Your Vote</h3>
            <p style={s.dialogSub}>
              This action is <strong>permanent and cannot be undone</strong>.
              You can only vote once per election.
            </p>

            {/* Selected candidate preview */}
            <div style={s.dialogCandidateRow}>
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt={selected.name} style={s.dialogImg}
                  onError={e => { e.target.style.display = "none"; }} />
              ) : (
                <div style={s.dialogAvatar}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p style={s.dialogCandName}>{selected.name}</p>
                <p style={s.dialogElTitle}>{election?.title}</p>
              </div>
            </div>

            <div style={s.dialogActions}>
              <button
                style={s.cancelBtn}
                onClick={() => setConfirming(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                style={{ ...s.confirmBtn, opacity: submitting ? 0.7 : 1 }}
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Yes, Cast Vote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Small helper components ────────────────────────────────────────────────
const ReceiptRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between",
    padding: "6px 0", borderBottom: "1px solid #e2e8f0", fontSize: "0.88rem" }}>
    <span style={{ color: "#718096", fontWeight: 600 }}>{label}</span>
    <span style={{ color: "#1a202c", fontWeight: 500 }}>{value}</span>
  </div>
);

const s = {
  // Layout
  page:               { minHeight: "100vh", backgroundColor: "#f7fafc", fontFamily: "'Segoe UI', sans-serif" },
  nav:                { backgroundColor: "#1a202c", display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "0 2rem", height: 56, position: "sticky", top: 0, zIndex: 50 },
  navBrand:           { color: "#fff", fontWeight: 700, fontSize: "1.1rem" },
  navRight:           { display: "flex", alignItems: "center", gap: "1rem" },
  navUser:            { color: "#a0aec0", fontSize: "0.88rem" },
  logoutBtn:          { padding: "5px 14px", backgroundColor: "#e53e3e", color: "#fff",
                        border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
  main:               { maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" },
  back:               { color: "#3182ce", cursor: "pointer", fontSize: "0.88rem",
                        fontWeight: 500, marginBottom: "1.25rem", display: "inline-block" },
  // Election header
  electionHeader:     { backgroundColor: "#fff", borderRadius: 12, padding: "1.25rem 1.5rem",
                        border: "1px solid #e2e8f0", marginBottom: "1.5rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  electionTitleRow:   { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title:              { fontSize: "1.4rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  dates:              { color: "#718096", fontSize: "0.85rem", margin: "6px 0 0" },
  elDesc:             { color: "#4a5568", fontSize: "0.9rem", margin: "8px 0 0", lineHeight: 1.6 },
  // Banners
  alreadyVotedBanner: { display: "flex", alignItems: "flex-start", gap: "0.85rem",
                        backgroundColor: "#f0fff4", border: "1px solid #9ae6b4", color: "#276749",
                        borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.25rem" },
  bannerTitle:        { fontWeight: 700, margin: 0, fontSize: "0.95rem" },
  bannerSub:          { margin: "4px 0 0", fontSize: "0.85rem" },
  warningBanner:      { backgroundColor: "#fffbeb", border: "1px solid #f6e05e", color: "#744210",
                        borderRadius: 10, padding: "0.85rem 1.25rem", marginBottom: "1.25rem",
                        fontSize: "0.9rem" },
  errorBox:           { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                        padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  // Section header
  sectionHeader:      { marginBottom: "1rem" },
  sectionTitle:       { fontSize: "1.1rem", fontWeight: 700, color: "#2d3748",
                        margin: 0, display: "flex", alignItems: "center", gap: 8 },
  count:              { backgroundColor: "#edf2f7", color: "#4a5568", borderRadius: 999,
                        padding: "2px 10px", fontSize: "0.82rem", fontWeight: 600 },
  hint:               { color: "#718096", fontSize: "0.84rem", margin: "4px 0 0" },
  empty:              { textAlign: "center", padding: "3rem 0" },
  // Candidate grid
  grid:               { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: "1rem", marginBottom: "1.5rem" },
  card:               { backgroundColor: "#fff", borderRadius: 12, padding: "1.25rem",
                        border: "2px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        textAlign: "center", gap: "0.6rem", position: "relative",
                        transition: "border-color 0.15s, box-shadow 0.15s" },
  cardSelected:       { borderColor: "#3182ce", boxShadow: "0 0 0 3px rgba(49,130,206,0.18)" },
  cardVoted:          { borderColor: "#38a169", boxShadow: "0 0 0 3px rgba(56,161,105,0.18)",
                        backgroundColor: "#f0fff4" },
  avatarWrap:         { marginBottom: 4 },
  cardImg:            { width: 72, height: 72, borderRadius: "50%", objectFit: "cover" },
  cardAvatar:         { width: 72, height: 72, borderRadius: "50%", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "1.8rem" },
  cardBody:           { flex: 1, width: "100%" },
  candidateName:      { fontSize: "1rem", fontWeight: 700, color: "#1a202c", margin: "0 0 4px" },
  candidateDesc:      { color: "#718096", fontSize: "0.82rem", lineHeight: 1.5, margin: 0 },
  chipVoted:          { backgroundColor: "#276749", color: "#fff", borderRadius: 999,
                        padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700 },
  chipSelected:       { backgroundColor: "#2b6cb0", color: "#fff", borderRadius: 999,
                        padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700 },
  // Vote action bar
  voteBar:            { display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "1.5rem 0 0.5rem", gap: "0.5rem" },
  voteBtn:            { padding: "0.8rem 2.5rem", backgroundColor: "#276749", color: "#fff",
                        border: "none", borderRadius: 10, cursor: "pointer",
                        fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em" },
  // Confirmation dialog
  overlay:            { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  dialog:             { backgroundColor: "#fff", borderRadius: 16, padding: "2rem",
                        maxWidth: 440, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  dialogTitle:        { fontSize: "1.2rem", fontWeight: 700, color: "#1a202c", margin: "0 0 0.5rem" },
  dialogSub:          { color: "#718096", fontSize: "0.88rem", margin: "0 0 1.25rem", lineHeight: 1.5 },
  dialogCandidateRow: { display: "flex", alignItems: "center", gap: "1rem",
                        backgroundColor: "#f7fafc", borderRadius: 10, padding: "0.85rem 1rem",
                        marginBottom: "1.5rem" },
  dialogImg:          { width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  dialogAvatar:       { width: 52, height: 52, borderRadius: "50%", backgroundColor: "#3182ce",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "1.4rem", flexShrink: 0 },
  dialogCandName:     { fontWeight: 700, color: "#1a202c", margin: 0, fontSize: "0.95rem" },
  dialogElTitle:      { color: "#718096", fontSize: "0.82rem", margin: "2px 0 0" },
  dialogActions:      { display: "flex", gap: "0.75rem", justifyContent: "flex-end" },
  cancelBtn:          { padding: "0.6rem 1.4rem", backgroundColor: "#edf2f7", color: "#4a5568",
                        border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  confirmBtn:         { padding: "0.6rem 1.6rem", backgroundColor: "#276749", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  // Success screen
  successCard:        { backgroundColor: "#fff", borderRadius: 16, padding: "3rem 2rem",
                        textAlign: "center", maxWidth: 480, margin: "2rem auto",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" },
  successIcon:        { fontSize: "3.5rem", marginBottom: "1rem" },
  successTitle:       { fontSize: "1.5rem", fontWeight: 700, color: "#1a202c", margin: "0 0 0.5rem" },
  successSub:         { color: "#718096", margin: "0 0 1.5rem", fontSize: "0.95rem" },
  receiptBox:         { backgroundColor: "#f7fafc", borderRadius: 8, padding: "0.75rem 1rem",
                        textAlign: "left", marginBottom: "1.5rem" },
  backBtn:            { padding: "0.65rem 1.5rem", backgroundColor: "#1a202c", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  pendingCard:        { backgroundColor: "#fff", borderRadius: 16, padding: "3rem 2rem",
                        textAlign: "center", maxWidth: 480, margin: "2rem auto",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" },
};

export default VotingPage;
