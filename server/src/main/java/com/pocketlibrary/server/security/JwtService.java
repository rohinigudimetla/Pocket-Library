package com.pocketlibrary.server.security;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {
    private final RedisTemplate<String, String> redisTemplate;
    private Key secretKey;
    private final long EXPIRY_MS = 1000 * 60 * 60 * 10;
    private final long REFRESH_EXPIRY_MS = 1000L * 60 * 60 * 24 * 7;

    public JwtService(RedisTemplate<String, String> redisTemplate){
        this.redisTemplate = redisTemplate;
        this.secretKey = loadOrGenerateKey();
    }

    private Key loadOrGenerateKey(){
        String stored = redisTemplate.opsForValue().get("jwt:signing-key");
        if (stored != null){
            byte[] keyBytes = Base64.getDecoder().decode(stored);
            return Keys.hmacShaKeyFor(keyBytes);
        }
        Key newKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String encoded = Base64.getEncoder().encodeToString(newKey.getEncoded());
        redisTemplate.opsForValue().set("jwt:signing-key", encoded);
        return newKey;
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRY_MS))
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    public String extractType(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("type", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public long getRemainingExpiry(String token) {
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return (expiration.getTime() - System.currentTimeMillis()) / 1000;
    }
}