import React from "react";

/**
 * StatusBadge — Colored pill that represents an election's status.
 *
 * UPCOMING  → blue
 * ACTIVE    → green
 * COMPLETED → gray
 *
 * Pure presentational component — no state, just props in, styled span out.
 * Centralising this avoids duplicating status color logic across pages.
 *
 * Usage: <StatusBadge status="ACTIVE" />
 */
const CONFIG = {
  UPCOMING:  { label: "Upcoming",  bg: "#ebf8ff", color: "#2b6cb0", dot: "#3182ce" },
  ACTIVE:    { label: "Active",    bg: "#f0fff4", color: "#276749", dot: "#38a169" },
  COMPLETED: { label: "Completed", bg: "#f7fafc", color: "#4a5568", dot: "#a0aec0" },
};

const StatusBadge = ({ status }) => {
  const c = CONFIG[status] || CONFIG.UPCOMING;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem",
      fontWeight: 600, backgroundColor: c.bg, color: c.color,
      border: `1px solid ${c.dot}20`, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%",
        backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
};

export default StatusBadge;
