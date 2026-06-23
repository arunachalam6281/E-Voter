package com.evoter.vote.service;

import com.evoter.auth.entity.Role;
import com.evoter.auth.entity.User;
import com.evoter.auth.repository.UserRepository;
import com.evoter.candidate.entity.Candidate;
import com.evoter.candidate.repository.CandidateRepository;
import com.evoter.election.entity.Election;
import com.evoter.election.entity.ElectionStatus;
import com.evoter.election.exception.ElectionNotFoundException;
import com.evoter.election.repository.ElectionRepository;
import com.evoter.vote.dto.*;
import com.evoter.vote.entity.Vote;
import com.evoter.vote.exception.DuplicateVoteException;
import com.evoter.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * VoteService — Business logic layer for the voting system.
 *
 * ── How the voter is identified ───────────────────────────────────────────
 * Every method that acts on behalf of the logged-in voter calls
 * getAuthenticatedUser(), which:
 *   1. Reads SecurityContextHolder.getContext().getAuthentication().getName()
 *      → this returns the email string placed there by JwtAuthFilter
 *   2. Calls userRepository.findByEmail(email) → returns the User entity
 *   3. Returns the full User with id, role, isVerified, etc.
 *
 * The voter never sends their own ID — it is always resolved here.
 *
 * ── Business rules enforced ───────────────────────────────────────────────
 * Rule 1: Only VOTER role can cast votes (@PreAuthorize on controller)
 * Rule 2: Voter must be verified (isVerified = true)
 * Rule 3: Election must be ACTIVE
 * Rule 4: Candidate must belong to the selected election
 * Rule 5: Admin cannot vote (@PreAuthorize blocks ROLE_ADMIN)
 * Rule 6: One vote per election (existsByVoterIdAndElectionId check + DB unique key)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class VoteService {

    private final VoteRepository      voteRepository;
    private final UserRepository      userRepository;
    private final ElectionRepository  electionRepository;
    private final CandidateRepository candidateRepository;

    // ── CAST VOTE ──────────────────────────────────────────────────────────

    /**
     * Casts a vote for the currently authenticated voter.
     *
     * Enforces all 6 business rules before persisting.
     */
    public VoteResponse castVote(VoteRequest req) {
        User     voter     = getAuthenticatedUser();
        Election election  = findElectionOrThrow(req.getElectionId());
        Candidate candidate = findCandidateOrThrow(req.getCandidateId());

        // Rule 2: voter must be approved by admin
        if (!voter.isVerified()) {
            throw new IllegalArgumentException(
                "Your account is not yet verified. Please wait for admin approval.");
        }

        // Rule 3: election must be currently ACTIVE
        if (election.getStatus() != ElectionStatus.ACTIVE) {
            throw new IllegalArgumentException(
                "Voting is only allowed when the election is ACTIVE. " +
                "Current status: " + election.getStatus());
        }

        // Rule 4: candidate must belong to this election
        if (!candidate.getElection().getId().equals(req.getElectionId())) {
            throw new IllegalArgumentException(
                "The selected candidate does not belong to this election.");
        }

        // Rule 6: one vote per election (application-layer check)
        if (voteRepository.existsByVoterIdAndElectionId(voter.getId(), req.getElectionId())) {
            throw new DuplicateVoteException();
        }

        Vote vote = Vote.builder()
                .voter(voter)
                .election(election)
                .candidate(candidate)
                .build();

        return VoteResponse.fromEntity(voteRepository.save(vote));
    }

    // ── MY VOTES ───────────────────────────────────────────────────────────

    /**
     * Returns all votes the currently authenticated voter has cast
     * across all elections. Used by GET /api/votes/my-votes.
     */
    @Transactional(readOnly = true)
    public List<VoteResponse> getMyVotes() {
        User voter = getAuthenticatedUser();
        return voteRepository.findByVoterId(voter.getId())
                .stream()
                .map(VoteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ── VOTE STATUS ────────────────────────────────────────────────────────

    /**
     * Checks whether the authenticated voter has voted in a given election.
     * Called on page load so the frontend can disable voting if already done.
     */
    @Transactional(readOnly = true)
    public VoteStatusResponse getVoteStatus(Long electionId) {
        findElectionOrThrow(electionId);
        User voter = getAuthenticatedUser();

        return voteRepository.findByVoterIdAndElectionId(voter.getId(), electionId)
                .map(vote -> VoteStatusResponse.builder()
                        .hasVoted(true)
                        .votedCandidateId(vote.getCandidate().getId())
                        .votedCandidateName(vote.getCandidate().getName())
                        .votedAt(vote.getVotedAt().toString())
                        .build())
                .orElse(VoteStatusResponse.builder()
                        .hasVoted(false)
                        .build());
    }

    // ── ADMIN STATISTICS ───────────────────────────────────────────────────

    /**
     * Returns vote counts and percentages per candidate for an election.
     * Accessible only by ADMIN (@PreAuthorize on controller).
     */
    @Transactional(readOnly = true)
    public VoteStatsResponse getStatistics(Long electionId) {
        Election election   = findElectionOrThrow(electionId);
        long     totalVotes = voteRepository.countByElectionId(electionId);

        List<VoteStatsResponse.CandidateResult> results =
            voteRepository.countVotesByCandidateForElection(electionId)
                .stream()
                .map(row -> {
                    long count = (Long) row[2];
                    double pct = totalVotes > 0
                        ? Math.round((count * 1000.0 / totalVotes)) / 10.0
                        : 0.0;
                    return VoteStatsResponse.CandidateResult.builder()
                            .candidateId((Long) row[0])
                            .candidateName((String) row[1])
                            .voteCount(count)
                            .percentage(pct)
                            .build();
                })
                .collect(Collectors.toList());

        return VoteStatsResponse.builder()
                .electionId(electionId)
                .electionTitle(election.getTitle())
                .totalVotes(totalVotes)
                .results(results)
                .build();
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Resolves the currently authenticated user from the SecurityContext.
     * JwtAuthFilter already validated the token and stored the email as
     * the authentication principal name — we just look it up in the DB.
     */
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Authenticated user not found: " + email));
    }

    private Election findElectionOrThrow(Long id) {
        return electionRepository.findById(id)
                .orElseThrow(() -> new ElectionNotFoundException(id));
    }

    private Candidate findCandidateOrThrow(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Candidate not found with id: " + id));
    }
}
