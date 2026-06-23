package com.evoter.candidate.exception;

/**
 * CandidateNotFoundException — thrown when no candidate exists for a given ID.
 *
 * The existing GlobalExceptionHandler in the election package is annotated
 * with @RestControllerAdvice which applies globally to ALL controllers —
 * not just election controllers. So we simply add one handler method there
 * for this exception type and get 404 responses for free.
 */
public class CandidateNotFoundException extends RuntimeException {
    public CandidateNotFoundException(Long id) {
        super("Candidate not found with id: " + id);
    }
}
