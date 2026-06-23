package com.evoter.election.controller;

import com.evoter.election.dto.ElectionRequest;
import com.evoter.election.dto.ElectionResponse;
import com.evoter.election.service.ElectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ElectionController — REST controller for /api/elections.
 *
 * Security — reuses the existing JWT infrastructure from Module 1:
 *   JwtAuthFilter already runs on every request and sets the user's
 *   role into the SecurityContext. @PreAuthorize then reads that role.
 *
 *   @PreAuthorize("hasRole('ADMIN')")  → only users with ROLE_ADMIN pass
 *   @PreAuthorize("isAuthenticated()") → any logged-in user (ADMIN or VOTER)
 *
 *   If the role check fails → Spring returns 403 Forbidden automatically,
 *   the method body never executes.
 *
 * Endpoint summary:
 *   POST   /api/elections        ADMIN  — create election
 *   GET    /api/elections        ALL    — list elections
 *   GET    /api/elections/stats  ADMIN  — dashboard stats
 *   GET    /api/elections/{id}   ALL    — single election
 *   PUT    /api/elections/{id}   ADMIN  — update election
 *   DELETE /api/elections/{id}   ADMIN  — delete election
 *
 * Note: /stats is declared BEFORE /{id} so Spring doesn't treat the
 * literal string "stats" as a path variable Long id.
 */
@RestController
@RequestMapping("/api/elections")
@RequiredArgsConstructor
public class ElectionController {

    private final ElectionService electionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionResponse> create(@Valid @RequestBody ElectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(electionService.createElection(req));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ElectionResponse>> getAll() {
        return ResponseEntity.ok(electionService.getAllElections());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(electionService.getStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ElectionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(electionService.getElectionById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ElectionRequest req) {
        return ResponseEntity.ok(electionService.updateElection(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        electionService.deleteElection(id);
        return ResponseEntity.noContent().build();
    }
}
