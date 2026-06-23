package com.evoter.election.dto;

import com.evoter.election.entity.ElectionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ElectionRequest — DTO received from the client for POST and PUT operations.
 *
 * Same DTO is reused for both create and update — the service handles
 * the difference in behaviour (e.g. title uniqueness check only on create).
 *
 * Expected JSON:
 * {
 *   "title":       "Presidential Election 2024",
 *   "description": "National election for president",
 *   "startDate":   "2024-11-01T08:00:00",
 *   "endDate":     "2024-11-01T20:00:00",
 *   "status":      "UPCOMING"        ← optional, defaults to UPCOMING on create
 * }
 */
@Data
public class ElectionRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;

    @NotNull(message = "End date is required")
    private LocalDateTime endDate;

    // Optional — if omitted on create, service defaults to UPCOMING
    private ElectionStatus status;
}
