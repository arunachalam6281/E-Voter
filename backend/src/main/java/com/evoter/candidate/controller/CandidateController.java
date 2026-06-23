package com.evoter.candidate.controller;

import com.evoter.candidate.dto.CandidateRequest;
import com.evoter.candidate.dto.CandidateResponse;
import com.evoter.candidate.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CandidateController — REST controller for /api/candidates and
 * the nested route /api/elections/{electionId}/candidates.
 *
 * Security — identical pattern to ElectionController (Module 2):
 *   JwtAuthFilter sets ROLE_ADMIN or ROLE_VOTER in SecurityContext.
 *   @PreAuthorize reads that role before the method body executes.
 *
 *   hasRole('ADMIN')   → POST, PUT, DELETE
 *   isAuthenticated()  → all GET endpoints (ADMIN + VOTER)
 *
 * Two base paths are handled by this single controller:
 *   /api/candidates                         — flat candidate operations
 *   /api/elections/{electionId}/candidates  — nested, election-scoped listing
 *
 * Endpoint summary:
 *   POST   /api/candidates                          ADMIN  — create
 *   GET    /api/candidates                          ALL    — list all
 *   GET    /api/candidates/{id}                     ALL    — single candidate
 *   GET    /api/elections/{electionId}/candidates   ALL    — by election
 *   PUT    /api/candidates/{id}                     ADMIN  — update
 *   DELETE /api/candidates/{id}                     ADMIN  — delete
 */
@RestController
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping("/api/candidates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CandidateResponse> create(
            @Valid @RequestBody CandidateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(candidateService.createCandidate(req));
    }

    @GetMapping("/api/candidates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CandidateResponse>> getAll() {
        return ResponseEntity.ok(candidateService.getAllCandidates());
    }

    @GetMapping("/api/candidates/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CandidateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getCandidateById(id));
    }

    /**
     * GET /api/elections/{electionId}/candidates
     * Returns all candidates for a specific election.
     * Used by both admin (ElectionDetail page) and voter (CandidatesVoter page).
     */
    @GetMapping("/api/elections/{electionId}/candidates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CandidateResponse>> getByElection(
            @PathVariable Long electionId) {
        return ResponseEntity.ok(candidateService.getCandidatesByElection(electionId));
    }

    @PutMapping("/api/candidates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CandidateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CandidateRequest req) {
        return ResponseEntity.ok(candidateService.updateCandidate(id, req));
    }

    @DeleteMapping("/api/candidates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }
}
