package com.evoter.candidate.entity;

import com.evoter.election.entity.Election;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Candidate — JPA entity mapped to the `candidates` table.
 *
 * Relationship design:
 *   A candidate belongs to exactly one election.
 *   This side owns the foreign key (election_id column), so @ManyToOne
 *   is declared here with @JoinColumn.
 *
 *   We deliberately do NOT add @OneToMany on the Election entity because:
 *     1. Election was built and tested in Module 2 — touching it risks breakage.
 *     2. All candidate queries are driven from this side anyway
 *        (e.g. findByElectionId), so the back-reference is never needed.
 *
 * FetchType.LAZY:
 *   The Election object is not loaded from DB until it is explicitly accessed.
 *   This avoids loading the full election row every time we query a candidate,
 *   which is important when listing many candidates.
 *
 * imageUrl:
 *   Stores a URL string (e.g. https://cdn.example.com/photo.jpg).
 *   Actual file storage is out of scope — this field accepts any valid URL
 *   or a relative path the frontend can render as <img src=...>.
 */
@Entity
@Table(name = "candidates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Candidate's full display name
    @Column(nullable = false, length = 150)
    private String name;

    // Optional biography / platform description
    @Column(columnDefinition = "TEXT")
    private String description;

    // Optional URL to a profile photo — stored as plain string
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Many candidates → one election
    // LAZY fetch: election data is only loaded when explicitly needed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
