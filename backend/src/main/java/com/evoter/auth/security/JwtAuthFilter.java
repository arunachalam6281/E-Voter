package com.evoter.auth.security;

import com.evoter.auth.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthFilter — Intercepts every HTTP request once and validates the JWT.
 *
 * How it works (step by step):
 *
 *  1. Client sends request with header:
 *     Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
 *
 *  2. This filter extracts the token from the header.
 *
 *  3. It extracts the email (username) from the token using JwtUtil.
 *
 *  4. It loads the User from the database via UserDetailsService.
 *
 *  5. It validates the token (email match + not expired).
 *
 *  6. If valid, it sets the Authentication in the SecurityContext,
 *     which tells Spring Security "this request is authenticated".
 *
 *  7. The request continues to the Controller.
 *
 * If the token is missing or invalid, the filter just passes through
 * and Spring Security will reject the request with 401 Unauthorized.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private final CustomUserDetailsService userDetailsService;
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Step 1: Read the Authorization header
        final String authHeader = request.getHeader("Authorization");

        // If no Bearer token present, skip this filter (let Spring Security handle it)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Step 2: Extract token — remove "Bearer " prefix (7 chars)
        final String jwt = authHeader.substring(7);

        // Step 3: Extract email from token
        final String userEmail = jwtUtil.extractUsername(jwt);

        // Step 4: Only authenticate if email found and not already authenticated
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Step 5: Load user from database
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            // Step 6: Validate token
            if (jwtUtil.isTokenValid(jwt, userDetails)) {

                // Step 7: Create authentication token and set it in SecurityContext
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,                          // credentials null after authentication
                                userDetails.getAuthorities()   // roles/permissions
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Continue the filter chain regardless
        filterChain.doFilter(request, response);
    }
}
