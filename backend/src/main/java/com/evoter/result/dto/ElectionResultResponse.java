package com.evoter.result.dto;

import com.evoter.election.entity.ElectionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ElectionResultResponse — Complete result payload for one election.
 *
 * Returned by:
 *   GET  /api/results/{electionId}         → voter + admin view
 *   POST /api/elections/{electionId}/close → admin closure (returns final result)
 *
 * Winner determination logic (applied in ResultService):
 *
 *   totalVotes = 0
 *     → winners is empty, isTie = false, message = "No votes were cast"
 *
 *   One candidate has strictly more votes than all others
 *     → winners contains that one candidate, isTie = false
 *
 *   Two or more candidates share the highest vote count
 *     → winners contains all tied candidates, isTie = true
 *     → message explains the tie
 *
 * allResults contains ALL candidates sorted by voteCount DESC,
 * including those with zero votes. This lets the frontend render
 * a complete ranked list with progress bars.
 *
 * The results endpoint is accessible to both VOTER and ADMIN so
 * voters can see final results once the election is COMPLETED.
 */
@Data
@Builder
public class ElectionResultResponse {

    // ── Election metadata ────────────────────────────────────────────────
    private Long           electionId;
    private String         electionTitle;
    private String         electionDescription;
    private ElectionStatus electionStatus;
    private LocalDateTime  startDate;
    private LocalDateTime  endDate;

    // ── Vote summary ─────────────────────────────────────────────────────
    private long           totalVotes;

    // ── Winner / tie ─────────────────────────────────────────────────────
    /** True when two or more candidates share the highest vote count */
    private boolean        isTie;

    /**
     * Contains:
     *   - exactly 1 entry for a clear winner
     *   - 2+ entries when isTie = true
     *   - 0 entries when totalVotes = 0
     */
    private List<CandidateResult> winners;

    /** Full ranked list — all candidates, zero-vote ones included at the bottom */
    private List<CandidateResult> allResults;

    /** Human-readable summary: "Alice won with 120 votes" or "Tie between Alice and Bob" */
    private String         resultSummary;

    // ── Inner DTO ────────────────────────────────────────────────────────
    @Data
    @Builder
    public static class CandidateResult {
        private Long   candidateId;
        private String candidateName;
        private long   voteCount;
        private double percentage;
        /** True if this candidate is one of the winners */
        private boolean isWinner;
    }
}
