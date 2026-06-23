import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getAllElections, deleteElection } from "../../services/electionService";

/**
 * ElectionList — Admin view of all elections in a table.
 *
 * Features:
 *   - Loads elections on mount via GET /api/elections
 *   - Shows title, dates, status badge, and action buttons
 *   - Delete with inline confirmation (avoids accidental deletion)
 *   - Navigate to Create or Edit pages via buttons
 */
const ElectionList = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [deletingId, setDeletingId] = useState(null); // ID currently confirming delete
  const [successMsg, setSuccessMsg] = useState("");

  const load = () => {
    setLoading(true);
    getAllElections()
      .then(setElections)
      .catch(() => setError("Failed to load elections."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteElection(id);
      setSuccessMsg("Election deleted successfully.");
      setDeletingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete election.");
      setDeletingId(null);
    }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-US",
    { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Elections</h1>
            <p style={s.subtitle}>{elections.length} election{elections.length !== 1 ? "s" : ""} found</p>
          </div>
          <button style={s.primaryBtn} onClick={() => navigate("/admin/elections/create")}>
            + New Election
          </button>
        </div>

        {/* Messages */}
        {successMsg && <div style={s.successBox}>✅ {successMsg}</div>}
        {error      && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Table */}
        {loading ? (
          <p style={{ color: "#718096" }}>Loading elections...</p>
        ) : elections.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "3rem", margin: 0 }}>🗳️</p>
            <p style={{ color: "#718096", marginTop: "0.5rem" }}>No elections yet. Create the first one!</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Title</th>
                  <th style={s.th}>Start Date</th>
                  <th style={s.th}>End Date</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((el, i) => (
                  <tr key={el.id} style={{ ...s.tr, backgroundColor: i % 2 === 0 ? "#fff" : "#f7fafc" }}>
                    <td style={s.td}>
                      <span style={s.elTitle}>{el.title}</span>
                      {el.description && (
                        <span style={s.elDesc}>
                          {el.description.length > 60 ? el.description.slice(0, 60) + "…" : el.description}
                        </span>
                      )}
                    </td>
                    <td style={s.td}>{fmt(el.startDate)}</td>
                    <td style={s.td}>{fmt(el.endDate)}</td>
                    <td style={s.td}><StatusBadge status={el.status} /></td>
                    <td style={s.td}>
                      {deletingId === el.id ? (
                        // Inline confirmation
                        <div style={s.confirmWrap}>
                          <span style={{ fontSize: "0.82rem", color: "#c53030" }}>Delete?</span>
                          <button style={s.confirmYes} onClick={() => handleDelete(el.id)}>Yes</button>
                          <button style={s.confirmNo}  onClick={() => setDeletingId(null)}>No</button>
                        </div>
                      ) : (
                        <div style={s.btnGroup}>
                          <button style={s.viewBtn}   onClick={() => navigate(`/admin/elections/${el.id}`)}>View</button>
                          <button style={s.editBtn}   onClick={() => navigate(`/admin/elections/${el.id}/edit`)}>Edit</button>
                          <button style={s.deleteBtn} onClick={() => { setError(""); setDeletingId(el.id); }}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

const s = {
  page:       { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:       { marginLeft: 240, flex: 1, padding: "2rem 2.5rem" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title:      { fontSize: "1.6rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  subtitle:   { color: "#718096", margin: "4px 0 0", fontSize: "0.9rem" },
  primaryBtn: { padding: "0.6rem 1.2rem", backgroundColor: "#3182ce", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  successBox: { backgroundColor: "#f0fff4", border: "1px solid #9ae6b4", color: "#276749",
                padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  errorBox:   { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  empty:      { textAlign: "center", padding: "4rem 0" },
  tableWrap:  { backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                overflow: "hidden", border: "1px solid #e2e8f0" },
  table:      { width: "100%", borderCollapse: "collapse" },
  thead:      { backgroundColor: "#f7fafc" },
  th:         { padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700,
                color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.04em",
                borderBottom: "1px solid #e2e8f0" },
  tr:         { borderBottom: "1px solid #e2e8f0" },
  td:         { padding: "0.85rem 1rem", fontSize: "0.88rem", color: "#2d3748", verticalAlign: "top" },
  elTitle:    { display: "block", fontWeight: 600, color: "#1a202c" },
  elDesc:     { display: "block", fontSize: "0.78rem", color: "#718096", marginTop: 2 },
  btnGroup:   { display: "flex", gap: 6 },
  viewBtn:    { padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #bee3f8",
                backgroundColor: "#ebf8ff", color: "#2b6cb0", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  editBtn:    { padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #9ae6b4",
                backgroundColor: "#f0fff4", color: "#276749", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  deleteBtn:  { padding: "4px 10px", fontSize: "0.8rem", border: "1px solid #fc8181",
                backgroundColor: "#fff5f5", color: "#c53030", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  confirmWrap:{ display: "flex", alignItems: "center", gap: 6 },
  confirmYes: { padding: "3px 8px", fontSize: "0.8rem", backgroundColor: "#e53e3e",
                color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  confirmNo:  { padding: "3px 8px", fontSize: "0.8rem", backgroundColor: "#e2e8f0",
                color: "#4a5568", border: "none", borderRadius: 6, cursor: "pointer" },
};

export default ElectionList;
