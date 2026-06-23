package com.evoter.vote.controller;

import com.evoter.vote.dto.*;
import com.evoter.vote.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * VoteController — REST controller for all voting endpoints.
 *
 * Security matrix:
 *   POST  /api/votes                                → VOTER only (hasRole)
 *   GET   /api/votes/my-votes                       → VOTER only
 *   GET   /api/elections/{electionId}/vote-status   → VOTER only
 *   GET   /api/admin/votes/statistics/{electionId}  → ADMIN only
 *
 * The voter's identity is NEVER taken from the request body.
 * VoteService.getAuthenticatedUser() resolves it from the JWT via
 * SecurityContextHolder — this is the only safe approach.
 *
 * Why hasRole('VOTER') instead of isAuthenticated() for cast/my-votes?
 *   Explicitly blocking ADMIN from voting is a business requirement.
 *   hasRole('VOTER') ensures only ROLE_VOTER holders can reach these endpoints.
 *   An ADMIN attempting to vote gets 403 Forbidden immediately.
 */
@RestController
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    /**
     * POST /api/votes
     * Cast a vote. VOTER role only.
     * Returns 201 Created with VoteResponse on success.
     */
    @PostMapping("/api/votes")
    @PreAuthorize("hasRole('VOTER')")
    public ResponseEntity<VoteResponse> castVote(
            @Valid @RequestBody VoteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(voteService.castVote(req));
    }

    /**
     * GET /api/votes/my-votes
     * Returns all votes cast by the currently authenticated voter.
     * Allows voters to see their full voting history.
     */
    @GetMapping("/api/votes/my-votes")
    @PreAuthorize("hasRole('VOTER')")
    public ResponseEntity<List<VoteResponse>> myVotes() {
        return ResponseEntity.ok(voteService.getMyVotes());
    }

    /**
     * GET /api/elections/{electionId}/vote-status
     * Tells the frontend whether this voter has already voted in this election.
     * Called on the VotingPage mount to set initial UI state.
     *
     * Returns: { hasVoted: true/false, votedCandidateId: ..., votedCandidateName: ... }
     */
    @GetMapping("/api/elections/{electionId}/vote-status")
    @PreAuthorize("hasRole('VOTER')")
    public ResponseEntity<VoteStatusResponse> voteStatus(
            @PathVariable Long electionId) {
        return ResponseEntity.ok(voteService.getVoteStatus(electionId));
    }

    /**
     * GET /api/admin/votes/statistics/{electionId}
     * Returns vote counts and percentages per candidate. ADMIN only.
     */
    @GetMapping("/api/admin/votes/statistics/{electionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VoteStatsResponse> statistics(
            @PathVariable Long electionId) {
        return ResponseEntity.ok(voteService.getStatistics(electionId));
    }
}
