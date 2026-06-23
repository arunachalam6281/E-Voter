package com.evoter.config;

import com.evoter.auth.service.CustomUserDetailsService;
import com.evoter.auth.repository.UserRepository;
import com.evoter.auth.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig — Central Spring Security configuration.
 *
 * Key decisions:
 *
 * 1. STATELESS sessions — No HTTP sessions. Every request must carry a JWT.
 *    This is standard for REST APIs and scales well horizontally.
 *
 * 2. CSRF disabled — CSRF protection is for browser form submissions with sessions.
 *    Since we use JWT in Authorization headers, CSRF is not needed.
 *
 * 3. Public routes — /api/auth/** is open so users can register/login without a token.
 *    All other routes require authentication.
 *
 * 4. CORS — Allows the React app on port 3000 to call this backend on port 8080.
 *
 * 5. BCrypt — Industry standard password hashing. Never store plain text passwords.
 *
 * 6. @EnableMethodSecurity — Enables @PreAuthorize("hasRole('ADMIN')") on methods.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    /**
     * UserDetailsService — Tells Spring Security how to load a user by username (email).
     * We implement it as a lambda that queries UserRepository.
     */

    /**
     * SecurityFilterChain — Defines which endpoints are public and which require auth.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Apply CORS config (allows React on port 3000)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable CSRF — not needed for stateless JWT REST API
            .csrf(csrf -> csrf.disable())

            // Define authorization rules
            .authorizeHttpRequests(auth -> auth
                // These endpoints are public — no token required
                .requestMatchers("/api/auth/**").permitAll()
                // Every other endpoint requires a valid JWT
                .anyRequest().authenticated()
            )

            // Use stateless sessions — no HttpSession will be created or used
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Register our custom AuthenticationProvider (uses DB + BCrypt)
            .authenticationProvider(authenticationProvider())

            // Add our JWT filter BEFORE Spring's default username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * AuthenticationProvider — Wires together:
     *   - UserDetailsService (loads user from DB by email)
     *   - PasswordEncoder (BCrypt comparison during login)
     */
    @Bean
public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder());
    return provider;
}

    /**
     * AuthenticationManager — Used by AuthService to trigger authentication.
     * Spring Boot auto-creates this; we just expose it as a Bean.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * PasswordEncoder — BCrypt with default strength 10.
     * BCrypt is adaptive: it can be made slower as hardware gets faster.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CORS Configuration — Allows the React frontend to call the backend.
     * In production, replace "http://localhost:3000" with your actual domain.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
