import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";

/**
 * Register.jsx — The User Registration page component.
 *
 * What this component does:
 *  1. Renders a registration form (fullName, email, password, confirmPassword)
 *  2. Client-side validation: passwords must match
 *  3. Calls authService.register() on submit
 *  4. On success: saves token via AuthContext.login(), shows pending message,
 *     then redirects to voter dashboard
 *  5. On failure: displays the API error (e.g. "Email already registered")
 *
 * Note on isVerified:
 *  New voters are registered with isVerified = false.
 *  They can log in, but cannot vote until an Admin verifies their account.
 *  The voter dashboard will show a "Pending Verification" notice.
 */
const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation: check passwords match before hitting the API
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await registerApi(
        formData.fullName,
        formData.email,
        formData.password
      );

      // Save auth data to context + localStorage
      login(data);

      // New voters always land on voter dashboard (admins are pre-seeded in DB)
      navigate("/voter/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
          <p style={styles.subtitle}>Create your voter account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              style={styles.input}
              autoComplete="name"
            />
          </div>

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
              placeholder="Minimum 6 characters"
              required
              style={styles.input}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
              style={styles.input}
              autoComplete="new-password"
            />
          </div>

          {/* Info notice about verification */}
          <div style={styles.infoBox}>
            ℹ️ Your account will need admin approval before you can vote.
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer Link */}
        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>

      </div>
    </div>
  );
};

// ── Inline Styles ──────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "2rem 1rem",
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
  infoBox: {
    backgroundColor: "#ebf8ff",
    border: "1px solid #90cdf4",
    color: "#2b6cb0",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
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
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#38a169",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
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

export default Register;
