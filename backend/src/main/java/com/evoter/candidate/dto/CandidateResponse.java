package com.evoter.candidate.dto;

import com.evoter.candidate.entity.Candidate;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CandidateResponse — DTO returned to clients in every API response.
 *
 * Includes a flattened election summary (electionId + electionTitle)
 * so the frontend can display the election name without a second API call.
 *
 * Why not embed the full ElectionResponse?
 *   That would create deep nesting and couple the candidate and election
 *   response contracts. Flat fields are simpler to consume on the frontend.
 *
 * fromEntity() is the single place where Candidate → CandidateResponse
 * mapping is defined. All service methods call this factory.
 */
@Data
@Builder
public class CandidateResponse {

    private Long   id;
    private String name;
    private String description;
    private String imageUrl;

    // Flattened election info — no need for a nested object
    private Long   electionId;
    private String electionTitle;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Maps a Candidate entity to a CandidateResponse DTO.
     *
     * election.getTitle() is safe here because:
     *   - The service always calls electionRepository.findById before saving
     *   - The @ManyToOne relation is always non-null (nullable=false in DB)
     *   - LAZY fetch is fine — we are still inside an open transaction
     *     when this is called from the service layer
     */
    public static CandidateResponse fromEntity(Candidate c) {
        return CandidateResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .electionId(c.getElection().getId())
                .electionTitle(c.getElection().getTitle())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
