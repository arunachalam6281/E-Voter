package com.evoter.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User — JPA Entity mapped to the `users` table in MySQL.
 *
 * Why implement UserDetails?
 * Spring Security needs a UserDetails object to perform authentication.
 * By implementing it directly on our entity, we avoid a separate wrapper
 * class and keep things simple.
 *
 * Lombok annotations:
 *   @Data       — generates getters, setters, equals, hashCode, toString
 *   @Builder    — enables fluent builder pattern: User.builder().email(...).build()
 *   @NoArgsConstructor / @AllArgsConstructor — required by JPA and Builder
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User's full display name
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    // Email is the username — must be unique across the system
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // BCrypt-hashed password — never store plain text passwords
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // Role stored as a string in DB (VOTER or ADMIN)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.VOTER;

    // Admin must manually verify voters before they can vote
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ── Sync updatedAt before every DB update ─────────────────────────
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── UserDetails interface methods ─────────────────────────────────

    /**
     * Returns the authorities (roles) granted to this user.
     * Spring Security uses "ROLE_" prefix convention.
     * e.g., Role.ADMIN becomes "ROLE_ADMIN"
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /** Spring Security calls getPassword() — we return our hashed password */
    @Override
    public String getPassword() {
        return passwordHash;
    }

    /** Spring Security calls getUsername() — we use email as the unique identifier */
    @Override
    public String getUsername() {
        return email;
    }

    /** Account never expires — can be extended later for account lockout features */
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return true; }
}
