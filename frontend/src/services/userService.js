import api from "../api/axios";

// GET /api/admin/users/pending — list all unverified voters
export const getPendingVoters = () =>
  api.get("/admin/users/pending").then(r => r.data);

// PATCH /api/admin/users/{id}/verify — approve a voter
export const verifyVoter = (id) =>
  api.patch(`/admin/users/${id}/verify`).then(r => r.data);
