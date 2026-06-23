package com.evoter.election.entity;

/**
 * ElectionStatus — Lifecycle states of an election.
 *
 * UPCOMING  : Created but voting has not started yet. Admin can edit/delete.
 * ACTIVE    : Voting is currently open. Deletion is blocked.
 * COMPLETED : Voting ended. No further changes allowed.
 *
 * Valid transitions (enforced in ElectionService):
 *   UPCOMING → ACTIVE → COMPLETED   (forward only, no reversal)
 */
public enum ElectionStatus {
    UPCOMING,
    ACTIVE,
    COMPLETED
}
