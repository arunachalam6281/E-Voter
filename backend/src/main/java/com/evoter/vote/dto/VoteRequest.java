package com.evoter.vote.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * VoteRequest — DTO received from the voter when casting a vote.
 *
 * Intentionally minimal — only two fields:
 *   electionId  → which election the voter is participating in
 *   candidateId → which candidate the voter is selecting
 *
 * The voterId is deliberately NOT included here.
 * It is resolved server-side from the JWT token in VoteService:
 *   SecurityContextHolder → email → UserRepository.findByEmail → User.getId()
 *
 * This prevents any possibility of a voter submitting a vote on behalf
 * of another voter by manipulating the request body.
 *
 * Expected JSON:
 * {
 *   "electionId":  1,
 *   "candidateId": 3
 * }
 */
@Data
public class VoteRequest {

    @NotNull(message = "Election ID is required")
    private Long electionId;

    @NotNull(message = "Candidate ID is required")
    private Long candidateId;
}
