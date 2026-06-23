package com.evoter.election.dto;

import com.evoter.election.entity.Election;
import com.evoter.election.entity.ElectionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ElectionResponse — DTO returned to clients in all API responses.
 *
 * Never expose the raw entity to the API layer — DTOs:
 *   1. Decouple the DB schema from the API contract
 *   2. Let us add/remove fields without breaking clients
 *   3. Prevent accidentally exposing internal fields
 *
 * fromEntity() is a static factory: converts Election → ElectionResponse.
 * Called in ElectionService after every operation so the mapping
 * is defined in one place.
 */
@Data
@Builder
public class ElectionResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private ElectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ElectionResponse fromEntity(Election e) {
        return ElectionResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
