package com.evoter.election.exception;

/**
 * ElectionNotFoundException — thrown when no election exists for a given ID.
 *
 * GlobalExceptionHandler catches this specific type and returns HTTP 404.
 * Using a typed exception (vs generic RuntimeException) makes the handler
 * precise and avoids catching unrelated runtime errors as 404s.
 */
public class ElectionNotFoundException extends RuntimeException {
    public ElectionNotFoundException(Long id) {
        super("Election not found with id: " + id);
    }
}
