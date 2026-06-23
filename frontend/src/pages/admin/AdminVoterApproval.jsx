import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getPendingVoters, verifyVoter } from "../../services/userService";

const AdminVoterApproval = () => {
  const [voters,      setVoters]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");
  const [approvingId, setApprovingId] = useState(null);

  const load = () => {
    setLoading(true);
    getPendingVoters()
      .then(setVoters)
      .catch(() => setError("Failed to load pending voters."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setApprovingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await verifyVoter(id);
      setSuccessMsg("Voter approved successfully.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve voter.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        <div style={s.header}>
          <div>
            <h1 style={s.title}>Voter Approvals</h1>
            <p style={s.subtitle}>
              {voters.length} voter{voters.length !== 1 ? "s" : ""} awaiting approval
            </p>
          </div>
        </div>

        {successMsg && <div style={s.successBox}>✅ {successMsg}</div>}
        {error      && <div style={s.errorBox}>⚠️ {error}</div>}

        {loading ? (
          <p style={{ color: "#718096" }}>Loading pending voters…</p>
        ) : voters.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "2.5rem", margin: 0 }}>✅</p>
            <p style={{ color: "#718096", marginTop: "0.5rem" }}>No voters are pending approval.</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Full Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Registered</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((v, i) => (
                  <tr key={v.id}
                    style={{ ...s.tr, backgroundColor: i % 2 === 0 ? "#fff" : "#f7fafc" }}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <div style={s.avatar}>{v.fullName.charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 600, color: "#1a202c" }}>{v.fullName}</span>
                      </div>
                    </td>
                    <td style={s.td}>{v.email}</td>
                    <td style={s.td}>
                      {new Date(v.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </td>
                    <td style={s.td}>
                      <button
                        style={{ ...s.approveBtn, opacity: approvingId === v.id ? 0.7 : 1 }}
                        disabled={approvingId === v.id}
                        onClick={() => handleApprove(v.id)}
                      >
                        {approvingId === v.id ? "Approving…" : "✓ Approve"}
                      </button>
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
  td:         { padding: "0.85rem 1rem", fontSize: "0.88rem", color: "#2d3748", verticalAlign: "middle" },
  nameCell:   { display: "flex", alignItems: "center", gap: 10 },
  avatar:     { width: 34, height: 34, borderRadius: "50%", backgroundColor: "#3182ce", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 },
  approveBtn: { padding: "5px 14px", backgroundColor: "#276749", color: "#fff", border: "none",
                borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" },
};

export default AdminVoterApproval;
