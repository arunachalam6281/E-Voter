package com.evoter.vote.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * VoteStatsResponse — returned by GET /api/admin/votes/statistics/{electionId}
 *
 * Provides the admin with a complete breakdown of voting results:
 *   - Election title and total vote count
 *   - Per-candidate vote count and percentage
 *   - Ranked by votes (highest first — already sorted by the JPQL query)
 *
 * percentage is calculated in VoteService as:
 *   (candidateVotes / totalVotes) * 100, rounded to 1 decimal place.
 *   Returns 0.0 when totalVotes = 0 (no division by zero).
 */
@Data
@Builder
public class VoteStatsResponse {

    private Long         electionId;
    private String       electionTitle;
    private long         totalVotes;
    private List<CandidateResult> results;

    @Data
    @Builder
    public static class CandidateResult {
        private Long   candidateId;
        private String candidateName;
        private long   voteCount;
        private double percentage;
    }
}
