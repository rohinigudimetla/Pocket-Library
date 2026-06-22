package com.pocketlibrary.server.security;

import com.pocketlibrary.server.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;


// This tells Spring that this class produces configuration objects
// (beans) that the rest of the application will use. Different from
// @Component because this class's whole job is to build setup, not to
// do work itself.
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // The filter we already built. Spring hands it in here automatically
    // because it is marked @Component, the same way it gets handed into
    // other classes that need it.
    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    // This method builds and returns the actual rulebook Spring Security
    // will use for every request. @Bean means: Spring runs this once at
    // startup and keeps the result available for the whole application.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Turn off CSRF protection. CSRF defends session/cookie-based
                // login. This app uses tokens sent in a header instead of
                // cookies, so that specific attack does not apply here.
                .csrf(csrf -> csrf.disable())

                // Plug in the CORS rule defined below, so the frontend on a
                // different port is allowed to call this backend at all.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Tell Spring Security never to create or use a session.
                // Every request must prove who it is on its own, using its
                // token, every single time. Nothing is remembered in between.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // The actual access rules, checked in order from top to bottom.
                .authorizeHttpRequests(auth -> auth
                        // Anyone, logged in or not, can reach the login endpoint.
                        // This has to be open, because you need a token from here
                        // before you can prove who you are anywhere else.
                        .requestMatchers("/api/auth/login").permitAll()

                        // Only someone with the ADMIN role can add or delete books.
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/books").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/books/**").hasRole("ADMIN")

                        // Any other request must come from someone who is logged
                        // in, regardless of role.
                        .anyRequest().authenticated()
                )

                // Insert our filter into the chain, placing it to run before
                // Spring's own built-in login-form filter. This guarantees
                // our token check happens first, on every request.
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        // Hand back the finished rulebook.
        return http.build();
    }

    // This method builds the one shared CORS rule for the whole app,
    // replacing the @CrossOrigin annotation that used to sit on individual
    // controllers. One rule here covers every endpoint.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Only allow requests coming from the frontend's address.
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        // Allow these specific HTTP methods to be used from that origin.
        configuration.setAllowedMethods(List.of("GET", "POST", "DELETE", "PUT"));
        // Allow any request header, including the Authorization header
        // that carries the token.
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this exact rule to every endpoint in the application.
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}