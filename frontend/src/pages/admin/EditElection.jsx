import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import { getElectionById, updateElection } from "../../services/electionService";

/**
 * EditElection — Pre-filled form to update an existing election.
 *
 * On mount: fetches GET /api/elections/{id} and populates the form.
 * On submit: sends PUT /api/elections/{id} with updated data.
 *
 * Status transitions allowed by the backend:
 *   UPCOMING → ACTIVE
 *   ACTIVE   → COMPLETED
 *   COMPLETED → (locked, no changes)
 *
 * The status dropdown is filtered dynamically so only valid next
 * states are shown, preventing invalid transition attempts.
 *
 * datetime-local inputs need the value in "YYYY-MM-DDTHH:mm" format.
 * toLocaleDateTimeString() converts the ISO string from the API.
 */

// Valid next statuses for each current status
const NEXT_STATUSES = {
  UPCOMING:  ["UPCOMING", "ACTIVE"],
  ACTIVE:    ["ACTIVE", "COMPLETED"],
  COMPLETED: ["COMPLETED"],
};

const toInputFormat = (isoString) => {
  if (!isoString) return "";
  // "2024-11-01T08:00:00" → "2024-11-01T08:00" (datetime-local format)
  return isoString.slice(0, 16);
};

const EditElection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm]         = useState(null);   // null = loading
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Load existing election data into the form
  useEffect(() => {
    getElectionById(id)
      .then(data => {
        setForm({
          title:       data.title,
          description: data.description || "",
          startDate:   toInputFormat(data.startDate),
          endDate:     toInputFormat(data.endDate),
          status:      data.status,
          currentStatus: data.status,  // remember original to filter dropdown
        });
      })
      .catch(() => setFetchError("Failed to load election."));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())  e.title     = "Title is required.";
    if (!form.startDate)     e.startDate = "Start date is required.";
    if (!form.endDate)       e.endDate   = "End date is required.";
    if (form.startDate && form.endDate &&
        new Date(form.endDate) <= new Date(form.startDate))
      e.endDate = "End date must be after start date.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }

    setLoading(true);
    try {
      await updateElection(id, {
        title:       form.title,
        description: form.description,
        startDate:   form.startDate,
        endDate:     form.endDate,
        status:      form.status,
      });
      navigate("/admin/elections");
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setApiError(data?.message || "Failed to update election.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchError) return (
    <div style={s.page}><Sidebar />
      <main style={s.main}><div style={s.errorBox}>⚠️ {fetchError}</div></main>
    </div>
  );

  if (!form) return (
    <div style={s.page}><Sidebar />
      <main style={s.main}><p style={{ color: "#718096" }}>Loading election…</p></main>
    </div>
  );

  const isCompleted = form.currentStatus === "COMPLETED";
  const allowedStatuses = NEXT_STATUSES[form.currentStatus] || [form.currentStatus];

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => navigate("/admin/elections")}>Elections</span>
          <span style={{ color: "#a0aec0" }}> / </span>
          <span style={{ color: "#4a5568" }}>Edit</span>
        </div>

        <div style={s.titleRow}>
          <h1 style={s.title}>Edit Election</h1>
          <StatusBadge status={form.currentStatus} />
        </div>

        {isCompleted && (
          <div style={s.infoBox}>
            🔒 This election is COMPLETED. No further changes are allowed.
          </div>
        )}

        <div style={s.card}>
          {apiError && <div style={s.errorBox}>⚠️ {apiError}</div>}

          <form onSubmit={handleSubmit} style={s.form}>

            <Field label="Election Title *" error={errors.title}>
              <input name="title" value={form.title} onChange={handleChange}
                disabled={isCompleted}
                style={{ ...s.input, ...(errors.title ? s.inputError : {}),
                         ...(isCompleted ? s.inputDisabled : {}) }} />
            </Field>

            <Field label="Description">
              <textarea name="description" value={form.description} onChange={handleChange}
                disabled={isCompleted} rows={3}
                style={{ ...s.textarea, ...(isCompleted ? s.inputDisabled : {}) }} />
            </Field>

            <div style={s.row}>
              <Field label="Start Date & Time *" error={errors.startDate}>
                <input type="datetime-local" name="startDate" value={form.startDate}
                  onChange={handleChange} disabled={isCompleted}
                  style={{ ...s.input, ...(errors.startDate ? s.inputError : {}),
                           ...(isCompleted ? s.inputDisabled : {}) }} />
              </Field>
              <Field label="End Date & Time *" error={errors.endDate}>
                <input type="datetime-local" name="endDate" value={form.endDate}
                  onChange={handleChange} disabled={isCompleted}
                  style={{ ...s.input, ...(errors.endDate ? s.inputError : {}),
                           ...(isCompleted ? s.inputDisabled : {}) }} />
              </Field>
            </div>

            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange}
                disabled={isCompleted}
                style={{ ...s.input, ...(isCompleted ? s.inputDisabled : {}) }}>
                {allowedStatuses.map(st => (
                  <option key={st} value={st}>
                    {st.charAt(0) + st.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "0.78rem", color: "#718096" }}>
                {form.currentStatus === "UPCOMING"  && "You can advance to Active when voting opens."}
                {form.currentStatus === "ACTIVE"    && "Mark as Completed when voting closes."}
                {form.currentStatus === "COMPLETED" && "Status is final and cannot be changed."}
              </span>
            </Field>

            <div style={s.actions}>
              <button type="button" style={s.cancelBtn}
                onClick={() => navigate("/admin/elections")}>
                Cancel
              </button>
              {!isCompleted && (
                <button type="submit" disabled={loading}
                  style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

const Field = ({ label, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4a5568" }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: "0.78rem", color: "#e53e3e" }}>{error}</span>}
  </div>
);

const s = {
  page:          { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:          { marginLeft: 240, flex: 1, padding: "2rem 2.5rem", maxWidth: 820 },
  breadcrumb:    { fontSize: "0.85rem", marginBottom: "0.75rem" },
  breadLink:     { color: "#3182ce", cursor: "pointer", fontWeight: 500 },
  titleRow:      { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" },
  title:         { fontSize: "1.5rem", fontWeight: 700, color: "#1a202c", margin: 0 },
  infoBox:       { backgroundColor: "#fffbeb", border: "1px solid #f6e05e", color: "#744210",
                   padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.9rem" },
  card:          { backgroundColor: "#fff", borderRadius: 12, padding: "2rem",
                   boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" },
  errorBox:      { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                   padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.9rem" },
  form:          { display: "flex", flexDirection: "column", gap: "1.25rem" },
  row:           { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" },
  input:         { padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
                   fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  inputError:    { borderColor: "#fc8181" },
  inputDisabled: { backgroundColor: "#f7fafc", color: "#a0aec0", cursor: "not-allowed" },
  textarea:      { padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
                   fontSize: "0.92rem", outline: "none", resize: "vertical", fontFamily: "inherit",
                   width: "100%", boxSizing: "border-box" },
  actions:       { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" },
  cancelBtn:     { padding: "0.6rem 1.4rem", backgroundColor: "#edf2f7", color: "#4a5568",
                   border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  submitBtn:     { padding: "0.6rem 1.6rem", backgroundColor: "#3182ce", color: "#fff",
                   border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
};

export default EditElection;
