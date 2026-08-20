package com.pocketlibrary.server.service;

import com.pocketlibrary.server.model.User;
import com.pocketlibrary.server.repository.UserRepository;
import com.pocketlibrary.server.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    JwtService jwtService;

    AuthService authService;

    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, jwtService, passwordEncoder);
    }

    @Test
    void loginReturnsTokenOnValidCredentials() {
        String rawPassword = "password";
        String hashedPassword = passwordEncoder.encode(rawPassword);

        User user = new User();
        user.setUsername("rohini");
        user.setPassword(hashedPassword);
        user.setRole("ADMIN");

        when(userRepository.findByUsername("rohini")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("rohini", "ADMIN")).thenReturn("faketoken");

        Optional<String> result = authService.login("rohini", rawPassword);

        assertTrue(result.isPresent());
        assertEquals("faketoken", result.get());
    }

    @Test
    void loginReturnsEmptyOnWrongPassword() {
        String hashedPassword = passwordEncoder.encode("correctpassword");

        User user = new User();
        user.setUsername("rohini");
        user.setPassword(hashedPassword);
        user.setRole("ADMIN");

        when(userRepository.findByUsername("rohini")).thenReturn(Optional.of(user));

        Optional<String> result = authService.login("rohini", "wrongpassword");

        assertFalse(result.isPresent());
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    void loginReturnsEmptyWhenUserNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        Optional<String> result = authService.login("ghost", "password");

        assertFalse(result.isPresent());
        verify(jwtService, never()).generateToken(any(), any());
    }
}