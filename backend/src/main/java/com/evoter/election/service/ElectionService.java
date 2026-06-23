package com.evoter.election.service;

import com.evoter.election.dto.ElectionRequest;
import com.evoter.election.dto.ElectionResponse;
import com.evoter.election.entity.Election;
import com.evoter.election.entity.ElectionStatus;
import com.evoter.election.exception.ElectionNotFoundException;
import com.evoter.election.repository.ElectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ElectionService — Business logic layer for election management.
 *
 * Business rules enforced here (not in the controller):
 *   1. endDate must be strictly after startDate
 *   2. Title must be unique on create
 *   3. ACTIVE elections cannot be deleted (votes may exist in Module 4)
 *   4. Status transitions are forward-only: UPCOMING→ACTIVE→COMPLETED
 *
 * @Transactional — every write method runs in a DB transaction.
 *   If anything fails mid-operation the entire change rolls back.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ElectionService {

    private final ElectionRepository electionRepository;

    // ── CREATE ─────────────────────────────────────────────────────────────

    public ElectionResponse createElection(ElectionRequest req) {
        validateDates(req.getStartDate(), req.getEndDate());

        if (electionRepository.existsByTitle(req.getTitle())) {
            throw new IllegalArgumentException(
                    "An election titled '" + req.getTitle() + "' already exists.");
        }

        Election election = Election.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(req.getStatus() != null ? req.getStatus() : ElectionStatus.UPCOMING)
                .build();

        return ElectionResponse.fromEntity(electionRepository.save(election));
    }

    // ── READ ALL ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ElectionResponse> getAllElections() {
        return electionRepository.findAll()
                .stream()
                .map(ElectionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ── READ ONE ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ElectionResponse getElectionById(Long id) {
        return ElectionResponse.fromEntity(findOrThrow(id));
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────

    public ElectionResponse updateElection(Long id, ElectionRequest req) {
        Election election = findOrThrow(id);

        validateDates(req.getStartDate(), req.getEndDate());

        if (req.getStatus() != null) {
            validateStatusTransition(election.getStatus(), req.getStatus());
        }

        election.setTitle(req.getTitle());
        election.setDescription(req.getDescription());
        election.setStartDate(req.getStartDate());
        election.setEndDate(req.getEndDate());
        if (req.getStatus() != null) {
            election.setStatus(req.getStatus());
        }

        return ElectionResponse.fromEntity(electionRepository.save(election));
    }

    // ── DELETE ─────────────────────────────────────────────────────────────

    public void deleteElection(Long id) {
        Election election = findOrThrow(id);

        if (election.getStatus() == ElectionStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Cannot delete an ACTIVE election. Set it to COMPLETED first.");
        }

        electionRepository.deleteById(id);
    }

    // ── STATS ──────────────────────────────────────────────────────────────

    /**
     * Returns counts by status for the admin dashboard cards.
     * readOnly = true — Hibernate skips dirty checking, slight performance gain.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        return Map.of(
                "total",     electionRepository.count(),
                "active",    (long) electionRepository.findByStatus(ElectionStatus.ACTIVE).size(),
                "upcoming",  (long) electionRepository.findByStatus(ElectionStatus.UPCOMING).size(),
                "completed", (long) electionRepository.findByStatus(ElectionStatus.COMPLETED).size()
        );
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private Election findOrThrow(Long id) {
        return electionRepository.findById(id)
                .orElseThrow(() -> new ElectionNotFoundException(id));
    }

    private void validateDates(LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("End date must be after start date.");
        }
    }

    /**
     * Only forward transitions are allowed:
     *   UPCOMING → ACTIVE
     *   ACTIVE   → COMPLETED
     * Any backward or repeat transition is rejected.
     */
    private void validateStatusTransition(ElectionStatus current, ElectionStatus requested) {
        if (requested == current) return;

        if (current == ElectionStatus.COMPLETED) {
            throw new IllegalArgumentException("A COMPLETED election's status cannot be changed.");
        }
        if (current == ElectionStatus.ACTIVE && requested == ElectionStatus.UPCOMING) {
            throw new IllegalArgumentException("Cannot revert an ACTIVE election to UPCOMING.");
        }
    }
}
