package com.evoter.auth.service;

import com.evoter.auth.dto.AuthResponse;
import com.evoter.auth.dto.LoginRequest;
import com.evoter.auth.dto.RegisterRequest;
import com.evoter.auth.entity.Role;
import com.evoter.auth.entity.User;
import com.evoter.auth.repository.UserRepository;
import com.evoter.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * AuthService — Business logic layer for authentication.
 *
 * Why a Service layer?
 * Controllers should only handle HTTP concerns (request/response).
 * Business logic (validation, hashing, token generation) belongs in Services.
 * This makes the code testable and follows the Single Responsibility Principle.
 *
 * Register Flow:
 *   1. Check if email is already taken
 *   2. Hash the plain-text password with BCrypt
 *   3. Save the new User to the database
 *   4. Generate a JWT token
 *   5. Return AuthResponse with token + user info
 *
 * Login Flow:
 *   1. AuthenticationManager verifies email + password against DB
 *      (It throws an exception automatically if credentials are wrong)
 *   2. Load the User from DB
 *   3. Generate a JWT token
 *   4. Return AuthResponse with token + user info
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new voter account.
     *
     * @param request contains fullName, email, password
     * @return AuthResponse with JWT token and user details
     * @throws RuntimeException if email is already registered
     */
    public AuthResponse register(RegisterRequest request) {
        // Guard: Prevent duplicate email registration
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered: " + request.getEmail());
        }

        // Build the User entity — role defaults to VOTER, isVerified defaults to false
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword())) // BCrypt hash
                .role(Role.VOTER)
                .isVerified(false) // Admin must verify before the voter can vote
                .build();

        // Persist to database
        userRepository.save(user);

        // Generate JWT for immediate login after registration
        String token = jwtUtil.generateToken(user);

        return buildAuthResponse(token, user);
    }

    /**
     * Authenticates an existing user and returns a JWT token.
     *
     * @param request contains email and password
     * @return AuthResponse with JWT token and user details
     * @throws org.springframework.security.core.AuthenticationException if credentials are wrong
     */
    public AuthResponse login(LoginRequest request) {
        // This line does all the work:
        // 1. Loads user by email via UserDetailsService
        // 2. Compares BCrypt hash of provided password against stored hash
        // 3. Throws BadCredentialsException if wrong — Spring handles this automatically
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // If we reach here, authentication succeeded — load user and generate token
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user);

        return buildAuthResponse(token, user);
    }

    /** Helper to construct the AuthResponse from a token and user */
    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .isVerified(user.isVerified())
                .build();
    }
}
