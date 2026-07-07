package com.pocketlibrary.server.security;

import com.pocketlibrary.server.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.data.redis.core.RedisTemplate;

import java.io.IOException;
import java.util.List;

// This tells Spring to create one instance of this class and manage it,
// the same way @Repository and @Service do for their own classes.
@Component
// Extending this means: this class is a checkpoint that every request
// passes through, and it is guaranteed to run only once per request,
// even if other parts of the app would normally cause it to run twice.
public class JwtFilter extends OncePerRequestFilter {

    // The toolbox that knows how to read and check tokens.
    private final JwtService jwtService;
    // The list of users, used to look someone up if needed.
    private final UserRepository userRepository;

    // This constructor runs once when Spring creates this class.
    // Spring sees this class needs a JwtService and a UserRepository,
    // finds the ones it already created, and hands them in here automatically.
    private final RedisTemplate<String, String> redisTemplate;

    public JwtFilter(JwtService jwtService, UserRepository userRepository, RedisTemplate<String, String> redisTemplate) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    // This method is required by the parent class. Every single request
    // that reaches the server runs through this method before it reaches
    // any controller. "protected" matches what the parent class demands.
    // "throws ServletException, IOException" means: if something breaks
    // badly while handling the request, this method does not try to fix
    // it itself — it passes that problem up to Spring to handle.
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Look for a header on the incoming request called "Authorization".
        // This is where a token, if one was sent, would be attached.
        String authHeader = request.getHeader("Authorization");

        // If there is no such header at all, or it doesn't start with the
        // word "Bearer " (the standard way tokens are labeled), then there
        // is nothing for this filter to check. Let the request continue on
        // to whatever comes next in line, untouched, and stop right here.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Strip off the first 7 characters ("Bearer "), keeping only the
        // actual token text that comes after it.
        String token = authHeader.substring(7);

        // Ask the toolbox: is this token still good? Not expired, not
        // tampered with, properly signed. This returns true or false only.
        if (jwtService.isTokenValid(token)) {Boolean isBlacklisted = redisTemplate.opsForSet().isMember("jwt:blacklist", token);
            if (jwtService.isTokenValid(token) && !Boolean.TRUE.equals(isBlacklisted)) {
            // Pull the username out of the token's contents.
            String username = jwtService.extractUsername(token);
            // Pull the role (READER or ADMIN) out of the token's contents.
            String role = jwtService.extractRole(token);

            // Build an object that represents "this request belongs to
            // this specific person, with this specific role." The middle
            // value is normally a password, but it is left empty here
            // because the token itself already proved who this is.
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            // Store that identity somewhere the rest of the application
            // can check for the remainder of this one request.
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // Whether the token was valid or not, let the request continue
        // on to whatever comes next in line. This filter never blocks a
        // request itself — it only ever identifies who is making it.
        filterChain.doFilter(request, response);
    }
}}