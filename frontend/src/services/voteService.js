import api from "../api/axios";

/**
 * voteService.js — All voting-related API calls.
 *
 * Uses the same `api` Axios instance from Module 1:
 *   - baseURL: http://localhost:8080/api
 *   - JWT auto-attached from localStorage on every request
 *   - Redirects to /login on 401 Unauthorized
 */

// Cast a vote — POST /api/votes
// body: { electionId, candidateId }
export const castVote = (data) =>
  api.post("/votes", data).then(r => r.data);

// Get all votes cast by the current voter — GET /api/votes/my-votes
export const getMyVotes = () =>
  api.get("/votes/my-votes").then(r => r.data);

// Check if voter already voted in a specific election
// GET /api/elections/{electionId}/vote-status
export const getVoteStatus = (electionId) =>
  api.get(`/elections/${electionId}/vote-status`).then(r => r.data);

// Admin: get vote statistics for an election
// GET /api/admin/votes/statistics/{electionId}
export const getVoteStatistics = (electionId) =>
  api.get(`/admin/votes/statistics/${electionId}`).then(r => r.data);
