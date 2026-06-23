package com.evoter.candidate.repository;

import com.evoter.candidate.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * CandidateRepository — Data access layer for Candidate entities.
 *
 * JpaRepository<Candidate, Long> provides:
 *   save(), findById(), findAll(), deleteById(), count(), existsById()
 *
 * Custom query methods — Spring Data generates SQL from the method name:
 *
 *   findByElectionId
 *     → SELECT * FROM candidates WHERE election_id = ?
 *     → used by GET /api/elections/{electionId}/candidates
 *        and GET /api/candidates (all, grouped by election on frontend)
 *
 *   existsByNameAndElectionId
 *     → SELECT COUNT(*) > 0 FROM candidates WHERE name = ? AND election_id = ?
 *     → used to block duplicate candidate names within the same election
 *        (two elections can have a candidate with the same name)
 */
@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    List<Candidate> findByElectionId(Long electionId);

    boolean existsByNameAndElectionId(String name, Long electionId);
}
