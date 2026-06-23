import api from "../api/axios";

/**
 * resultService.js — Election results and closure API calls.
 *
 * Reuses the existing `api` Axios instance which already:
 *   - Sets baseURL to http://localhost:8080/api
 *   - Auto-attaches JWT from localStorage on every request
 *   - Redirects to /login on 401 Unauthorized
 */

/**
 * getElectionResults — GET /api/results/{electionId}
 * Available to VOTER and ADMIN.
 * Returns ElectionResultResponse: winner(s), allResults, isTie, totalVotes, summary.
 */
export const getElectionResults = (electionId) =>
  api.get(`/results/${electionId}`).then(r => r.data);

/**
 * closeElection — POST /api/elections/{electionId}/close
 * ADMIN only. Sets election to COMPLETED and returns final results.
 */
export const closeElection = (electionId) =>
  api.post(`/elections/${electionId}/close`).then(r => r.data);
