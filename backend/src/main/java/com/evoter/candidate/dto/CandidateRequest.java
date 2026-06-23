package com.evoter.candidate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * CandidateRequest — DTO received from the client for POST and PUT.
 *
 * electionId is required on create — it tells the service which election
 * this candidate belongs to. On update it is also required so the service
 * can validate that the election still exists, even if it isn't changing.
 *
 * imageUrl is fully optional. The client can send null, omit it entirely,
 * or provide a URL string. No URL format validation here by design —
 * some deployments use relative paths instead of absolute URLs.
 *
 * Expected JSON (create):
 * {
 *   "name":        "Alice Johnson",
 *   "description": "15 years in public service",
 *   "imageUrl":    "https://cdn.example.com/alice.jpg",
 *   "electionId":  1
 * }
 */
@Data
public class CandidateRequest {

    @NotBlank(message = "Candidate name is required")
    @Size(min = 2, max = 150, message = "Name must be 2–150 characters")
    private String name;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    // Optional — null is perfectly valid
    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String imageUrl;

    @NotNull(message = "Election ID is required")
    private Long electionId;
}
