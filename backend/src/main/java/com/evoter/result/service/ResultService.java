package com.evoter.result.service;

import com.evoter.candidate.repository.CandidateRepository;
import com.evoter.election.entity.Election;
import com.evoter.election.entity.ElectionStatus;
import com.evoter.election.exception.ElectionNotFoundException;
import com.evoter.election.repository.ElectionRepository;
import com.evoter.result.dto.ElectionResultResponse;
import com.evoter.result.dto.ElectionResultResponse.CandidateResult;
import com.evoter.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ResultService — Business logic for election results and closure.
 *
 * ── What is reused from existing modules ─────────────────────────────────
 *
 * VoteRepository.countVotesByCandidateForElection(electionId)
 *   → already exists in Module 4, returns Object[] rows sorted DESC by count
 *   → used directly here, no new query needed
 *
 * VoteRepository.countByElectionId(electionId)
 *   → already exists, returns total vote count for an election
 *
 * CandidateRepository.findByElectionId(electionId)
 *   → already exists in Module 3, returns all candidates for an election
 *   → used to include zero-vote candidates in allResults
 *
 * ElectionRepository.findById / save
 *   → used unchanged for loading and persisting status change on closure
 *
 * ── Winner algorithm ─────────────────────────────────────────────────────
 *
 * 1. Load vote counts per candidate (already sorted DESC)
 * 2. If list is empty → totalVotes = 0 → return no-winner response
 * 3. maxVotes = rows[0][2] (highest count, first row)
 * 4. winners = all rows where count == maxVotes
 * 5. isTie = winners.size() > 1
 * 6. Build allResults including candidates that got 0 votes
 *    (pulled from CandidateRepository, merged with vote data by candidateId)
 *
 * ── Closure ──────────────────────────────────────────────────────────────
 *
 * Closing an election = setting status to COMPLETED.
 * VoteService.castVote Rule 3 already blocks any vote when status ≠ ACTIVE,
 * so no additional vote-blocking code is needed after closure.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ResultService {

    private final ElectionRepository  electionRepository;
    private final VoteRepository      voteRepository;
    private final CandidateRepository candidateRepository;

    // ── GET RESULTS ────────────────────────────────────────────────────────

    /**
     * Computes and returns the full result for a given election.
     * Available once the election is COMPLETED.
     * Also callable on ACTIVE elections for live tallying (admin use).
     *
     * @throws IllegalArgumentException if election is still UPCOMING
     */
    @Transactional(readOnly = true)
    public ElectionResultResponse getResults(Long electionId) {
        Election election = findOrThrow(electionId);

        if (election.getStatus() == ElectionStatus.UPCOMING) {
            throw new IllegalArgumentException(
                "Results are not available yet. The election has not started.");
        }

        return buildResultResponse(election);
    }

    // ── CLOSE ELECTION ─────────────────────────────────────────────────────

    /**
     * Closes an ACTIVE election by setting its status to COMPLETED.
     * Returns the final result immediately so the admin sees the outcome.
     *
     * @throws IllegalArgumentException if election is not ACTIVE
     */
    public ElectionResultResponse closeElection(Long electionId) {
        Election election = findOrThrow(electionId);

        if (election.getStatus() != ElectionStatus.ACTIVE) {
            throw new IllegalArgumentException(
                "Only ACTIVE elections can be closed. Current status: "
                    + election.getStatus());
        }

        election.setStatus(ElectionStatus.COMPLETED);
        electionRepository.save(election);

        return buildResultResponse(election);
    }

    // ── Private builder ────────────────────────────────────────────────────

    /**
     * Core result builder — shared by both getResults and closeElection.
     *
     * Steps:
     *   1. Load aggregated vote counts from VoteRepository (reused query)
     *   2. Build a lookup map: candidateId → voteCount
     *   3. Load all candidates from CandidateRepository to include zero-vote ones
     *   4. Merge: assign voteCount (0 if missing from vote map) to each candidate
     *   5. Sort allResults by voteCount DESC
     *   6. Determine winners and tie status
     *   7. Build and return the response DTO
     */
    private ElectionResultResponse buildResultResponse(Election election) {
        long totalVotes = voteRepository.countByElectionId(election.getId());

        // Step 1 & 2: vote counts from DB, keyed by candidateId
        Map<Long, Long> voteMap = voteRepository
            .countVotesByCandidateForElection(election.getId())
            .stream()
            .collect(Collectors.toMap(
                row -> (Long)   row[0],   // candidateId
                row -> (Long)   row[2]    // voteCount
            ));

        // Step 3 & 4: build full result list including zero-vote candidates
        List<CandidateResult> allResults = candidateRepository
            .findByElectionId(election.getId())
            .stream()
            .map(c -> {
                long count  = voteMap.getOrDefault(c.getId(), 0L);
                double pct  = totalVotes > 0
                    ? Math.round((count * 1000.0 / totalVotes)) / 10.0
                    : 0.0;
                return CandidateResult.builder()
                        .candidateId(c.getId())
                        .candidateName(c.getName())
                        .voteCount(count)
                        .percentage(pct)
                        .isWinner(false) // set below after determining winners
                        .build();
            })
            // Step 5: sort DESC
            .sorted((a, b) -> Long.compare(b.getVoteCount(), a.getVoteCount()))
            .collect(Collectors.toCollection(ArrayList::new));

        // Step 6: determine winners and tie
        List<CandidateResult> winners = new ArrayList<>();
        boolean isTie = false;
        String  summary;

        if (totalVotes == 0 || allResults.isEmpty()) {
            summary = "No votes were cast in this election.";
        } else {
            long maxVotes = allResults.get(0).getVoteCount();

            // All candidates sharing the maximum count are winners
            winners = allResults.stream()
                .filter(r -> r.getVoteCount() == maxVotes)
                .collect(Collectors.toList());

            isTie = winners.size() > 1;

            // Mark winner flag on allResults entries in-place
            winners.forEach(w -> allResults.stream()
                .filter(r -> r.getCandidateId().equals(w.getCandidateId()))
                .findFirst()
                .ifPresent(r -> r.setWinner(true)));

            if (isTie) {
                String names = winners.stream()
                    .map(CandidateResult::getCandidateName)
                    .collect(Collectors.joining(" and "));
                summary = "Tie between " + names + " with " + maxVotes + " vote"
                    + (maxVotes == 1 ? "" : "s") + " each.";
            } else {
                summary = winners.get(0).getCandidateName() + " won with "
                    + maxVotes + " vote" + (maxVotes == 1 ? "" : "s") + " ("
                    + winners.get(0).getPercentage() + "%).";
            }
        }

        return ElectionResultResponse.builder()
                .electionId(election.getId())
                .electionTitle(election.getTitle())
                .electionDescription(election.getDescription())
                .electionStatus(election.getStatus())
                .startDate(election.getStartDate())
                .endDate(election.getEndDate())
                .totalVotes(totalVotes)
                .isTie(isTie)
                .winners(winners)
                .allResults(allResults)
                .resultSummary(summary)
                .build();
    }

    private Election findOrThrow(Long id) {
        return electionRepository.findById(id)
            .orElseThrow(() -> new ElectionNotFoundException(id));
    }
}
