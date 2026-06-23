import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { createElection } from "../../services/electionService";

/**
 * CreateElection — Form page for creating a new election.
 *
 * On submit:
 *   1. Client validates: all required fields present, endDate > startDate
 *   2. POST /api/elections with the form data
 *   3. On success → navigate to /admin/elections
 *   4. On API error → display the error message returned by GlobalExceptionHandler
 *
 * The datetime-local input gives us a LocalDateTime-compatible string.
 * We send it as-is; Jackson on the backend deserializes it automatically.
 */
const INITIAL = { title: "", description: "", startDate: "", endDate: "", status: "UPCOMING" };

const CreateElection = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  // Client-side validation — runs before hitting the API
  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title     = "Title is required.";
    if (!form.startDate)          e.startDate = "Start date is required.";
    if (!form.endDate)            e.endDate   = "End date is required.";
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
      e.endDate = "End date must be after start date.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    setLoading(true);
    try {
      await createElection({
        title:       form.title,
        description: form.description,
        startDate:   form.startDate,   // "2024-11-01T08:00" → Jackson parses as LocalDateTime
        endDate:     form.endDate,
        status:      form.status,
      });
      navigate("/admin/elections");
    } catch (err) {
      // Show field-level errors from GlobalExceptionHandler if available
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setApiError(data?.message || "Failed to create election.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => navigate("/admin/elections")}>Elections</span>
          <span style={{ color: "#a0aec0" }}> / </span>
          <span style={{ color: "#4a5568" }}>Create New</span>
        </div>

        <h1 style={s.title}>Create Election</h1>

        <div style={s.card}>
          {apiError && <div style={s.errorBox}>⚠️ {apiError}</div>}

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Title */}
            <Field label="Election Title *" error={errors.title}>
              <input name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Presidential Election 2024"
                style={{ ...s.input, ...(errors.title ? s.inputError : {}) }} />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Brief description of this election..."
                rows={3} style={s.textarea} />
            </Field>

            {/* Date row */}
            <div style={s.row}>
              <Field label="Start Date & Time *" error={errors.startDate}>
                <input type="datetime-local" name="startDate" value={form.startDate}
                  onChange={handleChange}
                  style={{ ...s.input, ...(errors.startDate ? s.inputError : {}) }} />
              </Field>
              <Field label="End Date & Time *" error={errors.endDate}>
                <input type="datetime-local" name="endDate" value={form.endDate}
                  onChange={handleChange}
                  style={{ ...s.input, ...(errors.endDate ? s.inputError : {}) }} />
              </Field>
            </div>

            {/* Status */}
            <Field label="Initial Status">
              <select name="status" value={form.status} onChange={handleChange} style={s.input}>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
              </select>
            </Field>

            {/* Actions */}
            <div style={s.actions}>
              <button type="button" style={s.cancelBtn}
                onClick={() => navigate("/admin/elections")}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating…" : "Create Election"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

// Reusable field wrapper to avoid repeating label + error markup
const Field = ({ label, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4a5568" }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: "0.78rem", color: "#e53e3e" }}>{error}</span>}
  </div>
);

const s = {
  page:       { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:       { marginLeft: 240, flex: 1, padding: "2rem 2.5rem", maxWidth: 820 },
  breadcrumb: { fontSize: "0.85rem", marginBottom: "0.75rem" },
  breadLink:  { color: "#3182ce", cursor: "pointer", fontWeight: 500 },
  title:      { fontSize: "1.5rem", fontWeight: 700, color: "#1a202c", marginBottom: "1.5rem" },
  card:       { backgroundColor: "#fff", borderRadius: 12, padding: "2rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" },
  errorBox:   { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.9rem" },
  form:       { display: "flex", flexDirection: "column", gap: "1.25rem" },
  row:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" },
  input:      { padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
                fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box",
                fontFamily: "inherit" },
  inputError: { borderColor: "#fc8181" },
  textarea:   { padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
                fontSize: "0.92rem", outline: "none", resize: "vertical", fontFamily: "inherit",
                width: "100%", boxSizing: "border-box" },
  actions:    { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" },
  cancelBtn:  { padding: "0.6rem 1.4rem", backgroundColor: "#edf2f7", color: "#4a5568",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  submitBtn:  { padding: "0.6rem 1.6rem", backgroundColor: "#3182ce", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
};

export default CreateElection;
