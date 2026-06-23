package com.evoter.election.repository;

import com.evoter.election.entity.Election;
import com.evoter.election.entity.ElectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ElectionRepository — Data access layer for Elections.
 *
 * JpaRepository<Election, Long> gives us:
 *   save(), findById(), findAll(), deleteById(), count(), existsById()
 *
 * Spring Data JPA generates SQL from method names automatically:
 *   findByStatus → SELECT * FROM elections WHERE status = ?
 *   existsByTitle → SELECT COUNT(*) > 0 FROM elections WHERE title = ?
 */
@Repository
public interface ElectionRepository extends JpaRepository<Election, Long> {

    List<Election> findByStatus(ElectionStatus status);

    boolean existsByTitle(String title);
}
