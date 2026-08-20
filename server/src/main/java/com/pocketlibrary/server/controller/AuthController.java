package com.pocketlibrary.server.controller;

import com.pocketlibrary.server.security.JwtService;
import com.pocketlibrary.server.service.AuthService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RedisTemplate<String, String> redisTemplate;
    private final JwtService jwtService;

    public AuthController(AuthService authService, RedisTemplate<String, String> redisTemplate, JwtService jwtService) {
        this.authService = authService;
        this.redisTemplate = redisTemplate;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<Map<String, String>> tokens = authService.login(loginRequest.getUsername(), loginRequest.getPassword());

        if (tokens.isPresent()) {
            return ResponseEntity.ok(tokens.get());
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid username or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String refreshToken = authHeader.substring(7);

        if (!jwtService.isTokenValid(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String type = jwtService.extractType(refreshToken);
        if (!"refresh".equals(type)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Boolean isBlacklisted = redisTemplate.opsForSet().isMember("jwt:blacklist", refreshToken);
        if (Boolean.TRUE.equals(isBlacklisted)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = jwtService.extractUsername(refreshToken);
        String role = jwtService.extractRole(refreshToken);
        String newAccessToken = jwtService.generateToken(username, role);

        return ResponseEntity.ok(Map.of("token", newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        long remainingSeconds = jwtService.getRemainingExpiry(token);
        redisTemplate.opsForSet().add("jwt:blacklist", token);
        redisTemplate.expire("jwt:blacklist", remainingSeconds, TimeUnit.SECONDS);
        return ResponseEntity.ok().build();
    }
}