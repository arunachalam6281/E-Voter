import api from "../api/axios";

/**
 * candidateService.js — All candidate-related API calls.
 *
 * Uses the same `api` Axios instance from Module 1 which:
 *   - Has baseURL set to http://localhost:8080/api
 *   - Auto-attaches JWT from localStorage on every request
 *   - Redirects to /login on 401 Unauthorized
 *
 * No auth logic needed here — handled entirely by the interceptors.
 */

export const createCandidate          = (data)          => api.post("/candidates", data).then(r => r.data);
export const getAllCandidates          = ()              => api.get("/candidates").then(r => r.data);
export const getCandidateById         = (id)            => api.get(`/candidates/${id}`).then(r => r.data);
export const getCandidatesByElection  = (electionId)    => api.get(`/elections/${electionId}/candidates`).then(r => r.data);
export const updateCandidate          = (id, data)      => api.put(`/candidates/${id}`, data).then(r => r.data);
export const deleteCandidate          = (id)            => api.delete(`/candidates/${id}`);
