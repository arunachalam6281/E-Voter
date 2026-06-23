package com.evoter.vote.dto;

import com.evoter.vote.entity.Vote;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * VoteResponse — returned to the voter after successfully casting a ballot.
 *
 * Contains enough information for the frontend to show a
 * confirmation screen: which election, which candidate, when.
 *
 * Does NOT expose the voter's full user object — only their name.
 * Privacy and minimal exposure principle.
 */
@Data
@Builder
public class VoteResponse {

    private Long          id;
    private Long          electionId;
    private String        electionTitle;
    private Long          candidateId;
    private String        candidateName;
    private String        voterName;
    private LocalDateTime votedAt;

    public static VoteResponse fromEntity(Vote v) {
        return VoteResponse.builder()
                .id(v.getId())
                .electionId(v.getElection().getId())
                .electionTitle(v.getElection().getTitle())
                .candidateId(v.getCandidate().getId())
                .candidateName(v.getCandidate().getName())
                .voterName(v.getVoter().getFullName())
                .votedAt(v.getVotedAt())
                .build();
    }
}
