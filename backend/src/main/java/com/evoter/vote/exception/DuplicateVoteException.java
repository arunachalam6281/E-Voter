package com.evoter.vote.exception;

/**
 * DuplicateVoteException — thrown when a voter attempts to vote
 * in an election they have already voted in.
 *
 * Maps to HTTP 409 Conflict (not 400 Bad Request) because:
 *   - The request itself is well-formed and valid
 *   - The conflict is with the current server state (existing vote record)
 *   - 409 is the semantically correct status for resource state conflicts
 *
 * Caught by GlobalExceptionHandler which returns:
 * {
 *   "status":  409,
 *   "message": "You have already voted in this election."
 * }
 */
public class DuplicateVoteException extends RuntimeException {
    public DuplicateVoteException() {
        super("You have already voted in this election.");
    }
}
