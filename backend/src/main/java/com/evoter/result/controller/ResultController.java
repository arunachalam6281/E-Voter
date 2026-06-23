package com.evoter.result.controller;

import com.evoter.result.dto.ElectionResultResponse;
import com.evoter.result.service.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * ResultController — REST endpoints for election results and closure.
 *
 * GET  /api/results/{electionId}
 *   Accessible to both VOTER and ADMIN (isAuthenticated).
 *   Returns full result: winner(s), all ranked candidates, vote counts,
 *   percentages, tie flag, and a human-readable summary.
 *   Throws 400 if election is still UPCOMING (results not yet available).
 *
 * POST /api/elections/{electionId}/close
 *   ADMIN only.
 *   Sets election status to COMPLETED and returns the final result.
 *   Throws 400 if election is not ACTIVE.
 *
 * Security is inherited from the existing JwtAuthFilter + SecurityConfig
 * configured in Module 1 — no changes needed there.
 *
 * The close endpoint reuses the /api/elections path prefix intentionally.
 * This is a RESTful sub-action on an election resource:
 *   POST /api/elections/{id}/close  = "perform the close action on election {id}"
 */
@RestController
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    /**
     * GET /api/results/{electionId}
     *
     * Returns the full result for an election.
     * Available for ACTIVE and COMPLETED elections.
     * Blocked for UPCOMING elections (400 Bad Request).
     *
     * Used by:
     *   - Voter: /voter/elections/:id/results  (view final outcome)
     *   - Admin: /admin/elections/:id/results  (live tally + final result)
     */
    @GetMapping("/api/results/{electionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ElectionResultResponse> getResults(
            @PathVariable Long electionId) {
        return ResponseEntity.ok(resultService.getResults(electionId));
    }

    /**
     * POST /api/elections/{electionId}/close
     *
     * Closes an ACTIVE election, setting its status to COMPLETED.
     * No request body needed — the electionId in the path is sufficient.
     * Returns the final ElectionResultResponse so the admin immediately
     * sees the results after closure.
     */
    @PostMapping("/api/elections/{electionId}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionResultResponse> closeElection(
            @PathVariable Long electionId) {
        return ResponseEntity.ok(resultService.closeElection(electionId));
    }
}
