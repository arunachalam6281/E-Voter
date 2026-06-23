import api from "../api/axios";

/**
 * electionService.js — Election API calls.
 *
 * Uses the existing `api` Axios instance from Module 1 which already:
 *   - Sets baseURL to http://localhost:8080/api
 *   - Auto-attaches the JWT token from localStorage on every request
 *   - Redirects to /login on 401 Unauthorized
 *
 * No auth logic needed here — it's all handled by the Axios interceptors.
 */

export const createElection   = (data)    => api.post("/elections", data).then(r => r.data);
export const getAllElections   = ()        => api.get("/elections").then(r => r.data);
export const getElectionById  = (id)      => api.get(`/elections/${id}`).then(r => r.data);
export const updateElection   = (id, data)=> api.put(`/elections/${id}`, data).then(r => r.data);
export const deleteElection   = (id)      => api.delete(`/elections/${id}`);
export const getElectionStats = ()        => api.get("/elections/stats").then(r => r.data);
