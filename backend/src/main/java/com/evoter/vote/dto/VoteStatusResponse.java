package com.evoter.vote.dto;

import lombok.Builder;
import lombok.Data;

/**
 * VoteStatusResponse — returned by GET /api/elections/{electionId}/vote-status
 *
 * The frontend calls this on page load to determine UI state:
 *
 *   hasVoted = false → show candidate selection cards with "Vote" buttons
 *   hasVoted = true  → show "You already voted" banner, highlight chosen candidate,
 *                       disable all vote buttons
 *
 * candidateId / candidateName are null when hasVoted = false.
 */
@Data
@Builder
public class VoteStatusResponse {

    // Whether this voter has already cast a vote in this election
    private boolean hasVoted;

    // Populated only when hasVoted = true
    private Long    votedCandidateId;
    private String  votedCandidateName;
    private String  votedAt;
}
