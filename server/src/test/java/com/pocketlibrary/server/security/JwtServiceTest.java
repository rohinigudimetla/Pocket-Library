package com.pocketlibrary.server.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    RedisTemplate<String, String> redisTemplate;

    @Mock
    ValueOperations<String, String> valueOperations;

    JwtService jwtService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("jwt:signing-key")).thenReturn(null);
        jwtService = new JwtService(redisTemplate);
    }

    @Test
    void generateTokenReturnsValidJwt() {
        String token = jwtService.generateToken("rohini", "ADMIN");
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length);
    }

    @Test
    void validTokenReturnsTrue() {
        String token = jwtService.generateToken("rohini", "ADMIN");
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void invalidTokenReturnsFalse() {
        assertFalse(jwtService.isTokenValid("not.a.validtoken"));
    }

    @Test
    void extractUsernameReturnsCorrectSubject() {
        String token = jwtService.generateToken("rohini", "ADMIN");
        assertEquals("rohini", jwtService.extractUsername(token));
    }

    @Test
    void extractRoleReturnsCorrectRole() {
        String token = jwtService.generateToken("rohini", "ADMIN");
        assertEquals("ADMIN", jwtService.extractRole(token));
    }
}