package com.evoter.auth.entity;

/**
 * Role — Enum defining all user roles in the system.
 *
 * VOTER — A registered citizen who can cast votes.
 * ADMIN — A system administrator who manages elections.
 *
 * This enum maps directly to the ENUM column in the users table.
 * Spring Security uses this to enforce method-level and URL-level security.
 */
public enum Role {
    VOTER,
    ADMIN
}
