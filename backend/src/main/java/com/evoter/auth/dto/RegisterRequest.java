package com.evoter.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * RegisterRequest — DTO (Data Transfer Object) for user registration.
 *
 * Why a DTO instead of using the entity directly?
 * - The entity has internal fields (id, role, createdAt) clients shouldn't set.
 * - DTOs give us a clean contract for what the API accepts.
 * - Validation annotations here protect the service layer from bad input.
 *
 * This maps to the JSON body:
 * {
 *   "fullName": "John Doe",
 *   "email": "john@example.com",
 *   "password": "secret123"
 * }
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;
}
