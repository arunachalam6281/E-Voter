package com.evoter.auth.controller;

import com.evoter.auth.entity.User;
import com.evoter.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * UserManagementController — Admin endpoints for voter approval workflow.
 *
 * GET  /api/admin/users/pending     → list all unverified voters
 * PATCH /api/admin/users/{id}/verify → approve a specific voter
 *
 * Both endpoints are ADMIN-only via @PreAuthorize.
 * Reuses the existing UserRepository and User entity without modification.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserRepository userRepository;

    /**
     * GET /api/admin/users/pending
     * Returns all voters with isVerified = false.
     * The admin uses this list to decide who to approve.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPendingUsers() {
        List<Map<String, Object>> pending = userRepository.findByIsVerifiedFalse()
                .stream()
                .map(u -> Map.<String, Object>of(
                        "id",        u.getId(),
                        "fullName",  u.getFullName(),
                        "email",     u.getEmail(),
                        "createdAt", u.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    /**
     * PATCH /api/admin/users/{id}/verify
     * Sets isVerified = true for the given voter.
     * Returns 404 if the user does not exist.
     * Returns 400 if the user is already verified or is an ADMIN.
     */
    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (user.isVerified()) {
            throw new IllegalArgumentException("User is already verified.");
        }

        user.setVerified(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "id",         user.getId(),
                "fullName",   user.getFullName(),
                "email",      user.getEmail(),
                "isVerified", true
        ));
    }
}
