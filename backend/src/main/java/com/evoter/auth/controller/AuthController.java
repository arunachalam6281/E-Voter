package com.evoter.auth.controller;

import com.evoter.auth.dto.AuthResponse;
import com.evoter.auth.dto.LoginRequest;
import com.evoter.auth.dto.RegisterRequest;
import com.evoter.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController — REST Controller exposing authentication endpoints.
 *
 * Base URL: /api/auth
 *
 * These endpoints are PUBLIC (no JWT required).
 * See SecurityConfig.authorizeHttpRequests — /api/auth/** is permitAll().
 *
 * @RestController = @Controller + @ResponseBody
 *   Means every method return value is automatically serialized to JSON.
 *
 * @RequestMapping("/api/auth")
 *   All methods in this class are prefixed with /api/auth
 *
 * @RequiredArgsConstructor — Lombok injects AuthService via constructor injection.
 *   Constructor injection is preferred over @Autowired — it makes dependencies
 *   explicit and the class easier to unit test.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     *
     * Registers a new voter account.
     *
     * Request Body:
     * {
     *   "fullName": "John Doe",
     *   "email": "john@example.com",
     *   "password": "secret123"
     * }
     *
     * Response (201 Created):
     * {
     *   "token": "eyJ...",
     *   "email": "john@example.com",
     *   "fullName": "John Doe",
     *   "role": "VOTER"
     * }
     *
     * @Valid triggers bean validation on RegisterRequest fields.
     * If any field fails validation, Spring returns 400 Bad Request automatically.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException ex) {
            // Email already registered
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * POST /api/auth/login
     *
     * Authenticates an existing user and returns a JWT token.
     *
     * Request Body:
     * {
     *   "email": "john@example.com",
     *   "password": "secret123"
     * }
     *
     * Response (200 OK):
     * {
     *   "token": "eyJ...",
     *   "email": "john@example.com",
     *   "fullName": "John Doe",
     *   "role": "VOTER"
     * }
     *
     * Response (401 Unauthorized) if credentials are wrong.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    /**
     * GET /api/auth/health
     *
     * Simple health check to verify the auth service is running.
     * Useful for Postman testing and Docker health checks.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "Auth service is running"));
    }
}
