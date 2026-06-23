import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { createCandidate } from "../../services/candidateService";
import { getElectionById } from "../../services/electionService";

/**
 * CreateCandidate — Form to add a new candidate to an election.
 *
 * Route: /admin/elections/:electionId/candidates/create
 *
 * The electionId comes from the URL so the admin doesn't have to
 * manually select an election — they arrive here by clicking
 * "+ Add Candidate" from the CandidateList page for a specific election.
 *
 * On submit:
 *   POST /api/candidates  with { name, description, imageUrl, electionId }
 *   → navigate back to the candidates list for this election
 */
const INITIAL = { name: "", description: "", imageUrl: "" };

const CreateCandidate = () => {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [election, setElection] = useState(null);
  const [form,     setForm]     = useState(INITIAL);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [preview,  setPreview]  = useState("");

  useEffect(() => {
    getElectionById(electionId)
      .then(setElection)
      .catch(() => setApiError("Election not found."));
  }, [electionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
    setApiError("");
    if (name === "imageUrl") setPreview(value);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Candidate name is required.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }

    setLoading(true);
    try {
      await createCandidate({
        name:        form.name,
        description: form.description,
        imageUrl:    form.imageUrl || null,
        electionId:  Number(electionId),
      });
      navigate(`/admin/elections/${electionId}/candidates`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setApiError(data?.message || "Failed to create candidate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>

        {/* Breadcrumb */}
        <div style={s.breadcrumb}>
          <span style={s.breadLink} onClick={() => navigate("/admin/elections")}>Elections</span>
          <span style={s.sep}>/</span>
          <span style={s.breadLink}
            onClick={() => navigate(`/admin/elections/${electionId}/candidates`)}>
            {election?.title || "Candidates"}
          </span>
          <span style={s.sep}>/</span>
          <span style={s.breadCurrent}>Add Candidate</span>
        </div>

        <h1 style={s.title}>Add Candidate</h1>
        {election && (
          <p style={s.electionTag}>📋 Election: <strong>{election.title}</strong></p>
        )}

        <div style={s.layout}>
          {/* Form */}
          <div style={s.card}>
            {apiError && <div style={s.errorBox}>⚠️ {apiError}</div>}

            <form onSubmit={handleSubmit} style={s.form}>

              <Field label="Full Name *" error={errors.name}>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Alice Johnson"
                  style={{ ...s.input, ...(errors.name ? s.inputErr : {}) }} />
              </Field>

              <Field label="Description">
                <textarea name="description" value={form.description}
                  onChange={handleChange} rows={4}
                  placeholder="Candidate's background, platform, or key points…"
                  style={s.textarea} />
              </Field>

              <Field label="Profile Image URL" error={errors.imageUrl}
                hint="Paste a URL to a photo. Leave blank to use initials avatar.">
                <input name="imageUrl" value={form.imageUrl} onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  style={{ ...s.input, ...(errors.imageUrl ? s.inputErr : {}) }} />
              </Field>

              <div style={s.actions}>
                <button type="button" style={s.cancelBtn}
                  onClick={() => navigate(`/admin/elections/${electionId}/candidates`)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Adding…" : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div style={s.preview}>
            <p style={s.previewLabel}>Preview</p>
            <div style={s.previewCard}>
              {preview ? (
                <img src={preview} alt="preview" style={s.previewImg}
                  onError={e => { e.target.style.display = "none"; }} />
              ) : (
                <div style={s.previewAvatar}>
                  {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <p style={s.previewName}>{form.name || "Candidate Name"}</p>
              <p style={s.previewDesc}>
                {form.description
                  ? (form.description.length > 80 ? form.description.slice(0, 80) + "…" : form.description)
                  : "Description will appear here"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Field = ({ label, error, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4a5568" }}>{label}</label>
    {children}
    {hint  && <span style={{ fontSize: "0.76rem", color: "#718096" }}>{hint}</span>}
    {error && <span style={{ fontSize: "0.78rem", color: "#e53e3e" }}>{error}</span>}
  </div>
);

const s = {
  page:         { display: "flex", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f7fafc" },
  main:         { marginLeft: 240, flex: 1, padding: "2rem 2.5rem" },
  breadcrumb:   { display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", marginBottom: "0.75rem" },
  breadLink:    { color: "#3182ce", cursor: "pointer", fontWeight: 500 },
  breadCurrent: { color: "#4a5568" },
  sep:          { color: "#a0aec0" },
  title:        { fontSize: "1.5rem", fontWeight: 700, color: "#1a202c", margin: "0 0 4px" },
  electionTag:  { color: "#718096", fontSize: "0.88rem", margin: "0 0 1.5rem" },
  layout:       { display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem", alignItems: "start" },
  card:         { backgroundColor: "#fff", borderRadius: 12, padding: "1.75rem",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" },
  errorBox:     { backgroundColor: "#fff5f5", border: "1px solid #fc8181", color: "#c53030",
                  padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.9rem" },
  form:         { display: "flex", flexDirection: "column", gap: "1.25rem" },
  input:        { padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
                  fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  inputErr:     { borderColor: "#fc8181" },
  textarea:     { padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
                  fontSize: "0.92rem", outline: "none", resize: "vertical", fontFamily: "inherit",
                  width: "100%", boxSizing: "border-box" },
  actions:      { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" },
  cancelBtn:    { padding: "0.6rem 1.4rem", backgroundColor: "#edf2f7", color: "#4a5568",
                  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  submitBtn:    { padding: "0.6rem 1.6rem", backgroundColor: "#3182ce", color: "#fff",
                  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  preview:      { position: "sticky", top: 20 },
  previewLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#718096",
                  textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem" },
  previewCard:  { backgroundColor: "#fff", borderRadius: 12, padding: "1.5rem",
                  border: "1px solid #e2e8f0", textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  previewImg:   { width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.75rem" },
  previewAvatar:{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "#3182ce",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "1.8rem", margin: "0 auto 0.75rem" },
  previewName:  { fontWeight: 700, color: "#1a202c", margin: "0 0 6px", fontSize: "1rem" },
  previewDesc:  { color: "#718096", fontSize: "0.82rem", lineHeight: 1.5, margin: 0 },
};

export default CreateCandidate;
