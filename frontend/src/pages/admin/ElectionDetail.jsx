import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getElectionById, deleteElection } from "../../services/electionService";

/**
 * ElectionDetail — Read-only detail view for a single election (Admin).
 *
 * Loads GET /api/elections/{id} on mount and displays all fields.
 * Provides Edit and Delete buttons for the admin.
 */
const ElectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [error, setError]       = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getElectionById(id)
      .then(setElection)
      .catch(() => setError("Election not found."));
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteElection(id);
      navigate("/admin/elections");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete election.");
      setConfirming(false);
    }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-US",
    { dateStyle: "long", timeStyle: "short" }) : "—";

  if (error) return (
    <div style={s.page}><Sidebar />
      <main style={s.main}><div style={s.errorBox}>⚠️ {error}</div></main>
    </div>
  );

  if (!election) return (
    <div style={s.page}><Sidebar />
      <main style={s.main}><p style={{ color: "#718096" }}>Loading…</p></main>
    </div>
  );

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => navigate("/admin/elections")}>Elections</span>
          <span style={{ color: "#a0aec0" }}> / </span>
          <span style={{ color: "#4a5568" }}>{election.title}</span>
        </div>

        <div style={s.header}>
          <div>
            <h1 style={s.title}>{election.title}</h1>
            <div style={{ marginTop: 6 }}><StatusBadge status={election.status} /></div>
          </div>
          <div style={s.actions}>
            <button style={s.candidatesBtn}
              onClick={() => navigate(`/admin/elections/${id}/candidates`)}>
              👤 Candidates
            </button>
            <button style={s.statsBtn}
              onClick={() => navigate(`/admin/elections/${id}/statistics`)}>
              📈 Statistics
            </button>
            {(election.status === "ACTIVE" || election.status === "COMPLETED") && (
              <button style={s.resultsBtn}
                onClick={() => navigate(`/admin/elections/${id}/results`)}>
                🏆 Results
              </button>
            )}
            <button style={s.editBtn}
              onClick={() => navigate(`/admin/elections/${id}/edit`)}>
              ✏️ Edit
            </button>
            {confirming ? (
              <>
                <span style={{ fontSize: "0.85rem", color: "#c53030", alignSelf: "center" }}>
                  Confirm delete?
                </span>
                <button style={s.confirmYes} onClick={handleDelete}>Yes, Delete</button>
                <button style={s.confirmNo}  onClick={() => setConfirming(false)}>Cancel</button>
              </>
            ) : (
              <button style={s.deleteBtn} onClick={() => setConfirming(true)}>🗑️ Delete</button>
            )}
          </div>
        </div>

        <div style={s.card}>
          {/* Description */}
          {election.description && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Description</p>
              <p style={s.sectionValue}>{election.description}</p>
            </div>
          )}

          {/* Details grid */}
          <div style={s.grid}>
            <Detail label="Start Date"   value={fmt(election.startDate)} />
            <Detail label="End Date"     value={fmt(election.endDate)} />
            <Detail label="Status"       value={<StatusBadge status={election.status} />} />
            <Detail label="Created"      value={fmt(election.createdAt)} />
            <Detail label="Last Updated" value={fmt(election.updatedAt)} />
            <Detail label="Election ID"  value={`#${election.id}`} />
          </div>
        </div>

      </main>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#718096",
                textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
      {label}
    </p>
    <p style={{ fontSize: "0.92rem", color: "#2d3748", margin: 0 }}>{value}</p>
  </div>
);

const s = {
  page:       { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:       { marginLeft: 240, flex: 1, padding: "2rem 2.5rem", maxWidth: 820 },
  breadcrumb: { fontSize: "0.85rem", marginBottom: "0.75rem" },
  breadLink:  { color: "#3182ce", cursor: "pointer", fontWeight: 500 },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title:      { fontSize: "1.5rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  actions:    { display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" },
  editBtn:    { padding: "0.55rem 1.1rem", backgroundColor: "#ebf8ff", color: "#2b6cb0",
                border: "1px solid #bee3f8", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  candidatesBtn: { padding: "0.55rem 1.1rem", backgroundColor: "#f0fff4", color: "#276749",
                   border: "1px solid #9ae6b4", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  statsBtn:    { padding: "0.55rem 1.1rem", backgroundColor: "#fffbeb", color: "#744210",
                 border: "1px solid #f6e05e", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  resultsBtn:  { padding: "0.55rem 1.1rem", backgroundColor: "#faf5ff", color: "#553c9a",
                 border: "1px solid #d6bcfa", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  deleteBtn:  { padding: "0.55rem 1.1rem", backgroundColor: "#fff5f5", color: "#c53030",
                border: "1px solid #fc8181", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  confirmYes: { padding: "0.45rem 0.9rem", backgroundColor: "#e53e3e", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" },
  confirmNo:  { padding: "0.45rem 0.9rem", backgroundColor: "#edf2f7", color: "#4a5568",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" },
  card:       { backgroundColor: "#fff", borderRadius: 12, padding: "2rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" },
  errorBox:   { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                padding: "0.75rem 1rem", borderRadius: 8, fontSize: "0.9rem" },
  section:    { marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" },
  sectionLabel:{ fontSize: "0.78rem", fontWeight: 700, color: "#718096",
                 textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" },
  sectionValue:{ color: "#2d3748", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 },
  grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" },
};

export default ElectionDetail;
