package com.evoter.vote.entity;

import com.evoter.auth.entity.User;
import com.evoter.candidate.entity.Candidate;
import com.evoter.election.entity.Election;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Vote — JPA entity mapped to the `votes` table.
 *
 * Represents a single ballot cast by a verified voter.
 * Each vote ties together three existing entities:
 *   voter     → which User cast the vote
 *   election  → which Election it belongs to
 *   candidate → which Candidate was chosen
 *
 * Design decisions:
 *
 * 1. All three relations use FetchType.LAZY.
 *    Loading a vote list should not auto-load full user/election/candidate
 *    rows. Each is resolved lazily only when accessed inside a transaction.
 *
 * 2. No @OneToMany added to User, Election, or Candidate.
 *    Those entities are tested and working — we never touch them.
 *    All vote queries are driven from this entity's side.
 *
 * 3. votedAt is set by the DB (DEFAULT CURRENT_TIMESTAMP) and also
 *    defaults to now() at the Java level as a safety net.
 *
 * 4. No updatedAt — votes are immutable. Once cast, they cannot
 *    be edited. Only deletion (admin audit action) is allowed.
 */
@Entity
@Table(
    name = "votes",
    uniqueConstraints = {
        // Application-layer enforcement of the DB unique constraint.
        // JPA uses this to produce a cleaner error when the unique key fires.
        @UniqueConstraint(
            name = "uq_voter_election",
            columnNames = {"voter_id", "election_id"}
        )
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The voter who cast this vote — resolved from JWT in the service
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_id", nullable = false)
    private User voter;

    // The election this vote belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    // The candidate the voter selected
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    // Timestamp of when the vote was cast — immutable after creation
    @Column(name = "voted_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime votedAt = LocalDateTime.now();
}
