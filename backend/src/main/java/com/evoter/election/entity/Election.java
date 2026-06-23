package com.evoter.election.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Election — JPA entity mapped to the `elections` table.
 *
 * Each row represents one election event.
 * Status defaults to UPCOMING on creation.
 *
 * Future modules will add:
 *   @OneToMany → candidates  (Module 3)
 *   @OneToMany → votes       (Module 4)
 */
@Entity
@Table(name = "elections")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Election {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    // Stored as VARCHAR in DB — EnumType.STRING writes the enum name, e.g. "ACTIVE"
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ElectionStatus status = ElectionStatus.UPCOMING;

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
