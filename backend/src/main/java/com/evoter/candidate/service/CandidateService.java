package com.evoter.candidate.service;

import com.evoter.candidate.dto.CandidateRequest;
import com.evoter.candidate.dto.CandidateResponse;
import com.evoter.candidate.entity.Candidate;
import com.evoter.candidate.exception.CandidateNotFoundException;
import com.evoter.candidate.repository.CandidateRepository;
import com.evoter.election.entity.Election;
import com.evoter.election.exception.ElectionNotFoundException;
import com.evoter.election.repository.ElectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CandidateService — Business logic for candidate management.
 *
 * Key decisions:
 *
 * 1. Election validation on every write:
 *    Before saving a candidate we always call electionRepository.findById()
 *    to confirm the election actually exists. If it doesn't, we throw
 *    ElectionNotFoundException (→ 404). This reuses the existing exception
 *    and handler from Module 2 — no new code needed for this case.
 *
 * 2. Duplicate name guard (scoped to election):
 *    Two elections can share candidate names (e.g. both have "John Doe").
 *    Duplicates are only blocked within the same election.
 *    On update, the check excludes the current candidate being edited
 *    so you can save without changing the name.
 *
 * 3. fromEntity() called inside @Transactional:
 *    CandidateResponse.fromEntity() accesses election.getTitle() via the
 *    LAZY-loaded relation. This must happen while the Hibernate session is
 *    still open, which is guaranteed because the service method is @Transactional.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final ElectionRepository  electionRepository;

    // ── CREATE ─────────────────────────────────────────────────────────────

    public CandidateResponse createCandidate(CandidateRequest req) {
        Election election = findElectionOrThrow(req.getElectionId());

        if (candidateRepository.existsByNameAndElectionId(req.getName(), req.getElectionId())) {
            throw new IllegalArgumentException(
                "A candidate named '" + req.getName() + "' already exists in this election.");
        }

        Candidate candidate = Candidate.builder()
                .name(req.getName())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .election(election)
                .build();

        return CandidateResponse.fromEntity(candidateRepository.save(candidate));
    }

    // ── READ ALL ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CandidateResponse> getAllCandidates() {
        return candidateRepository.findAll()
                .stream()
                .map(CandidateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ── READ BY ELECTION ───────────────────────────────────────────────────

    /**
     * Returns all candidates belonging to a specific election.
     * Validates the election exists first so the client gets a clear 404
     * rather than an empty list for a non-existent election ID.
     */
    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidatesByElection(Long electionId) {
        findElectionOrThrow(electionId);
        return candidateRepository.findByElectionId(electionId)
                .stream()
                .map(CandidateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ── READ ONE ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CandidateResponse getCandidateById(Long id) {
        return CandidateResponse.fromEntity(findCandidateOrThrow(id));
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────

    public CandidateResponse updateCandidate(Long id, CandidateRequest req) {
        Candidate candidate = findCandidateOrThrow(id);
        Election  election  = findElectionOrThrow(req.getElectionId());

        // Duplicate name check — skip if the name hasn't changed for this candidate
        boolean nameChanged = !candidate.getName().equalsIgnoreCase(req.getName());
        if (nameChanged && candidateRepository.existsByNameAndElectionId(
                req.getName(), req.getElectionId())) {
            throw new IllegalArgumentException(
                "A candidate named '" + req.getName() + "' already exists in this election.");
        }

        candidate.setName(req.getName());
        candidate.setDescription(req.getDescription());
        candidate.setImageUrl(req.getImageUrl());
        candidate.setElection(election);

        return CandidateResponse.fromEntity(candidateRepository.save(candidate));
    }

    // ── DELETE ─────────────────────────────────────────────────────────────

    public void deleteCandidate(Long id) {
        findCandidateOrThrow(id);
        candidateRepository.deleteById(id);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private Candidate findCandidateOrThrow(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new CandidateNotFoundException(id));
    }

    private Election findElectionOrThrow(Long electionId) {
        return electionRepository.findById(electionId)
                .orElseThrow(() -> new ElectionNotFoundException(electionId));
    }
}
