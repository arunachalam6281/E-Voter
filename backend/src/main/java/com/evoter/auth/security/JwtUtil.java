package com.evoter.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JwtUtil — Utility class for all JWT operations.
 *
 * What is JWT?
 * JSON Web Token is a compact, URL-safe token that contains:
 *   Header  — algorithm type (HS256)
 *   Payload — claims: who the user is, their role, expiry
 *   Signature — HMAC hash to verify the token wasn't tampered with
 *
 * Flow:
 *   Login  → generateToken(user) → send token to client
 *   Request → extractUsername(token) → look up user → validate → allow
 */
@Component
public class JwtUtil {

    // Injected from application.properties
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationMs;

    // ── Token Generation ───────────────────────────────────────────────

    /**
     * Generates a JWT token for the given user.
     * Adds "role" as an extra claim so the frontend knows the user's role
     * without making an additional API call.
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", userDetails.getAuthorities()
                .iterator().next().getAuthority());
        return buildToken(extraClaims, userDetails);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())       // email as subject
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Token Validation ───────────────────────────────────────────────

    /**
     * Validates the token against the UserDetails loaded from DB.
     * Checks: does the email match? Is the token expired?
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ── Claim Extraction ───────────────────────────────────────────────

    /** Extracts the email (subject) from the token */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Generic claim extractor.
     * claimsResolver is a function applied to the Claims object.
     * Example: extractClaim(token, Claims::getSubject) → returns email string
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ── Key ────────────────────────────────────────────────────────────

    /**
     * Converts the plain secret string into an HMAC signing Key.
     * JJWT requires the key to be at least 256 bits for HS256.
     */
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}
