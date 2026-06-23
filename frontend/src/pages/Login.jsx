import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";

/**
 * Login.jsx — The Login page component.
 *
 * What this component does:
 *  1. Renders a login form (email + password)
 *  2. Handles form state with useState
 *  3. Calls the authService.login() on submit
 *  4. On success: saves token via AuthContext.login(), then redirects
 *     - ADMIN → /admin/dashboard
 *     - VOTER → /voter/dashboard
 *  5. On failure: displays the error message returned by the API
 *
 * State:
 *  - formData   → controlled input values
 *  - error      → API error message to show the user
 *  - loading    → disables the submit button during the API call
 */
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Sync input changes to formData state */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission (page reload)
    setLoading(true);
    setError("");

    try {
      const data = await loginApi(formData.email, formData.password);

      // Save token and user info to Context + localStorage
      login(data);

      // Role-based redirect after login
      if (data.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/voter/dashboard");
      }
    } catch (err) {
      // Show error from API response, or a generic fallback message
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🗳️</div>
          <h1 style={styles.title}>E-Voter</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer Link */}
        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Create one</Link>
        </p>

      </div>
    </div>
  );
};

// ── Inline Styles ──────────────────────────────────────────────────────────
// Using inline styles to keep this file self-contained.
// In a larger project, use CSS modules or Tailwind CSS instead.
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "420px",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  logo: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1a202c",
    margin: "0 0 0.25rem",
  },
  subtitle: {
    color: "#718096",
    fontSize: "0.95rem",
    margin: 0,
  },
  errorBox: {
    backgroundColor: "#fff5f5",
    border: "1px solid #fc8181",
    color: "#c53030",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#4a5568",
  },
  input: {
    padding: "0.65rem 0.9rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#3182ce",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
    transition: "background-color 0.2s",
  },
  footer: {
    textAlign: "center",
    marginTop: "1.25rem",
    fontSize: "0.9rem",
    color: "#718096",
  },
  link: {
    color: "#3182ce",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Login;
