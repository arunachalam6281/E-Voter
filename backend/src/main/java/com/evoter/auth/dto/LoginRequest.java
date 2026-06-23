package com.evoter.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * LoginRequest — DTO for user login.
 *
 * The client sends:
 * {
 *   "email": "john@example.com",
 *   "password": "secret123"
 * }
 *
 * The service will:
 *  1. Find the user by email
 *  2. Compare the password against the BCrypt hash
 *  3. Return a JWT token on success
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
