import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getCandidatesByElection, deleteCandidate } from "../../services/candidateService";
import { getElectionById } from "../../services/electionService";

/**
 * CandidateList — Admin view of all candidates within one election.
 *
 * Route: /admin/elections/:electionId/candidates
 *
 * On mount:
 *   1. Loads the parent election (for title + status in the header)
 *   2. Loads all candidates for that election
 *
 * Features:
 *   - Live search by candidate name
 *   - Candidate cards with avatar, description, image support
 *   - Inline delete confirmation (no modal needed)
 *   - Breadcrumb navigation back to Elections list
 */
const CandidateList = () => {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [election,    setElection]    = useState(null);
  const [candidates,  setCandidates]  = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");
  const [deletingId,  setDeletingId]  = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getElectionById(electionId),
      getCandidatesByElection(electionId),
    ])
      .then(([elec, cands]) => { setElection(elec); setCandidates(cands); })
      .catch(() => setError("Failed to load candidates."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [electionId]);

  const handleDelete = async (id) => {
    try {
      await deleteCandidate(id);
      setSuccessMsg("Candidate deleted.");
      setDeletingId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete candidate.");
      setDeletingId(null);
    }
  };

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        {/* Breadcrumb */}
        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => navigate("/admin/elections")}>
            Elections
          </span>
          <span style={s.sep}>/</span>
          <span style={s.breadCurrent}>{election?.title || "…"}</span>
          <span style={s.sep}>/</span>
          <span style={s.breadCurrent}>Candidates</span>
        </div>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.titleRow}>
              <h1 style={s.title}>Candidates</h1>
              {election && <StatusBadge status={election.status} />}
            </div>
            <p style={s.subtitle}>
              {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
              {search ? " matching search" : ` in ${election?.title || ""}`}
            </p>
          </div>
          <button style={s.primaryBtn}
            onClick={() => navigate(`/admin/elections/${electionId}/candidates/create`)}>
            + Add Candidate
          </button>
        </div>

        {/* Messages */}
        {successMsg && <div style={s.successBox}>✅ {successMsg}</div>}
        {error      && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Search */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search candidates by name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setError(""); }}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <p style={s.hint}>Loading candidates…</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "2.5rem", margin: 0 }}>👤</p>
            <p style={s.hint}>
              {search ? "No candidates match your search." : "No candidates yet. Add the first one!"}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(c => (
              <div key={c.id} style={s.card}>
                {/* Avatar / image */}
                <div style={s.cardLeft}>
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} style={s.avatar}
                      onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div style={s.avatarFallback}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
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

                {/* Actions */}
                <div style={s.cardActions}>
                  {deletingId === c.id ? (
                    <div style={s.confirmRow}>
                      <span style={s.confirmLabel}>Delete?</span>
                      <button style={s.confirmYes} onClick={() => handleDelete(c.id)}>Yes</button>
                      <button style={s.confirmNo}  onClick={() => setDeletingId(null)}>No</button>
                    </div>
                  ) : (
                    <>
                      <button style={s.editBtn}
                        onClick={() => navigate(`/admin/candidates/${c.id}/edit`)}>
                        Edit
                      </button>
                      <button style={s.deleteBtn}
                        onClick={() => { setError(""); setSuccessMsg(""); setDeletingId(c.id); }}>
                        Delete
                      </button>
                    </>
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
  page:           { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:           { marginLeft: 240, flex: 1, padding: "2rem 2.5rem" },
  breadcrumb:     { display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", marginBottom: "0.75rem" },
  breadLink:      { color: "#3182ce", cursor: "pointer", fontWeight: 500 },
  breadCurrent:   { color: "#4a5568" },
  sep:            { color: "#a0aec0" },
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" },
  titleRow:       { display: "flex", alignItems: "center", gap: 10 },
  title:          { fontSize: "1.6rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  subtitle:       { color: "#718096", margin: "4px 0 0", fontSize: "0.9rem" },
  primaryBtn:     { padding: "0.6rem 1.2rem", backgroundColor: "#3182ce", color: "#fff",
                    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  successBox:     { backgroundColor: "#f0fff4", border: "1px solid #9ae6b4", color: "#276749",
                    padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  errorBox:       { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                    padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  searchWrap:     { display: "flex", alignItems: "center", backgroundColor: "#fff",
                    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 0.75rem",
                    marginBottom: "1.5rem", maxWidth: 420 },
  searchIcon:     { fontSize: "0.9rem", marginRight: 6, color: "#a0aec0" },
  searchInput:    { flex: 1, border: "none", outline: "none", padding: "0.6rem 0",
                    fontSize: "0.92rem", background: "transparent" },
  clearBtn:       { background: "none", border: "none", cursor: "pointer", color: "#a0aec0", fontSize: "0.85rem" },
  hint:           { color: "#718096", padding: "2rem 0" },
  empty:          { textAlign: "center", padding: "3rem 0" },
  grid:           { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card:           { display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "#fff",
                    borderRadius: 10, padding: "1rem 1.25rem", border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  cardLeft:       { flexShrink: 0 },
  avatar:         { width: 48, height: 48, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: { width: 48, height: 48, borderRadius: "50%", backgroundColor: "#3182ce",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1.2rem" },
  cardBody:       { flex: 1, overflow: "hidden" },
  candidateName:  { fontWeight: 600, color: "#1a202c", margin: 0, fontSize: "0.95rem" },
  candidateDesc:  { color: "#718096", fontSize: "0.82rem", margin: "3px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardActions:    { display: "flex", gap: 6, alignItems: "center", flexShrink: 0 },
  editBtn:        { padding: "4px 12px", fontSize: "0.82rem", border: "1px solid #9ae6b4",
                    backgroundColor: "#f0fff4", color: "#276749", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  deleteBtn:      { padding: "4px 12px", fontSize: "0.82rem", border: "1px solid #fc8181",
                    backgroundColor: "#fff5f5", color: "#c53030", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  confirmRow:     { display: "flex", alignItems: "center", gap: 6 },
  confirmLabel:   { fontSize: "0.82rem", color: "#c53030" },
  confirmYes:     { padding: "3px 8px", fontSize: "0.8rem", backgroundColor: "#e53e3e",
                    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  confirmNo:      { padding: "3px 8px", fontSize: "0.8rem", backgroundColor: "#e2e8f0",
                    color: "#4a5568", border: "none", borderRadius: 6, cursor: "pointer" },
};

export default CandidateList;
