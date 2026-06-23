package com.evoter.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AuthResponse — DTO returned to the client after successful authentication.
 *
 * The React frontend receives this and:
 *  1. Stores the JWT token in localStorage
 *  2. Uses the role to redirect to the correct dashboard
 *  3. Displays the user's name in the navbar
 *
 * Response JSON:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiJ9...",
 *   "email": "john@example.com",
 *   "fullName": "John Doe",
 *   "role": "VOTER"
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private String role;
    private boolean isVerified;
}
