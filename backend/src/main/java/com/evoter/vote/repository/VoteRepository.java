package com.evoter.vote.repository;

import com.evoter.vote.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * VoteRepository — Data access layer for Vote entities.
 *
 * Method-name queries handle simple lookups.
 * @Query with JPQL handles the aggregation needed for statistics.
 */
@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    /**
     * Core duplicate-vote check.
     * Called in VoteService before every cast to enforce one-vote-per-election.
     *
     * Generated SQL:
     *   SELECT COUNT(*) > 0 FROM votes WHERE voter_id = ? AND election_id = ?
     */
    boolean existsByVoterIdAndElectionId(Long voterId, Long electionId);

    /**
     * Find the vote a specific voter cast in a specific election.
     * Used by GET /api/elections/{electionId}/vote-status to tell the
     * frontend whether this voter has already voted and for whom.
     */
    Optional<Vote> findByVoterIdAndElectionId(Long voterId, Long electionId);

    /**
     * All votes cast by a specific voter across all elections.
     * Used by GET /api/votes/my-votes.
     */
    List<Vote> findByVoterId(Long voterId);

    /**
     * All votes for a specific election.
     * Used by the admin statistics endpoint to count votes per candidate.
     */
    List<Vote> findByElectionId(Long electionId);

    /**
     * Aggregated vote counts per candidate for an election.
     * Returns a list of [candidateId, candidateName, voteCount] arrays.
     *
     * This single JPQL query replaces loading all votes and counting in Java —
     * the DB does the aggregation which is far more efficient at scale.
     *
     * Returns Object[] where:
     *   [0] = candidate.id    (Long)
     *   [1] = candidate.name  (String)
     *   [2] = vote count      (Long)
     */
    @Query("""
        SELECT v.candidate.id, v.candidate.name, COUNT(v)
        FROM Vote v
        WHERE v.election.id = :electionId
        GROUP BY v.candidate.id, v.candidate.name
        ORDER BY COUNT(v) DESC
    """)
    List<Object[]> countVotesByCandidateForElection(@Param("electionId") Long electionId);

    /**
     * Total vote count for a specific election.
     * Used to calculate percentage in statistics.
     */
    long countByElectionId(Long electionId);
}
