package com.evoter.election.exception;

import com.evoter.candidate.exception.CandidateNotFoundException;
import com.evoter.vote.exception.DuplicateVoteException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler — Centralised exception → JSON error response mapping.
 *
 * Without this, unhandled exceptions produce Spring's default HTML error page
 * or a raw 500 with a stack trace — neither is acceptable for a REST API.
 *
 * @RestControllerAdvice makes every @ExceptionHandler method's return
 * value automatically serialized to JSON.
 *
 * Standard error response shape:
 * {
 *   "timestamp": "2024-11-01T10:30:00",
 *   "status":    404,
 *   "message":   "Election not found with id: 99"
 * }
 *
 * Validation error response adds an extra "errors" map:
 * {
 *   "timestamp": "...",
 *   "status":    400,
 *   "message":   "Validation failed",
 *   "errors": { "title": "Title is required", "endDate": "End date is required" }
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 — election ID not found
    @ExceptionHandler(ElectionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ElectionNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // 404 — candidate ID not found
    @ExceptionHandler(CandidateNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleCandidateNotFound(CandidateNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // 409 — voter already voted in this election
    @ExceptionHandler(DuplicateVoteException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateVote(DuplicateVoteException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    // 400 — business rule violations (invalid dates, illegal status transition, etc.)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // 400 — @Valid annotation failures on request DTOs
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = baseError(HttpStatus.BAD_REQUEST, "Validation failed");
        body.put("errors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 500 — anything else unexpected
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error: " + ex.getMessage());
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(baseError(status, message));
    }

    private Map<String, Object> baseError(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("message", message);
        return body;
    }
}
