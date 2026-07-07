package com.pocketlibrary.server.controller;

import com.pocketlibrary.server.dto.RequestSummary;
import com.pocketlibrary.server.model.Request;
import com.pocketlibrary.server.model.User;
import com.pocketlibrary.server.repository.UserRepository;
import com.pocketlibrary.server.security.JwtService;
import com.pocketlibrary.server.service.NotificationService;
import com.pocketlibrary.server.service.RequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/requests")
public class RequestController {
    private final RequestService requestService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final JwtService jwtService;

    public RequestController(RequestService requestService, UserRepository userRepository, NotificationService notificationService, JwtService jwtService) {
        this.requestService = requestService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<Request> createRequest(@RequestBody Request request) {
        User currentUser = getCurrentUser();
        request.setRequestedBy(currentUser);
        Request saved = requestService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/mine")
    public ResponseEntity<Page<RequestSummary>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(requestService.getMyRequests(currentUser, pageable));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public ResponseEntity<Page<RequestSummary>> getPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(requestService.getPendingRequests(pageable));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/accept")
    public ResponseEntity<Void> acceptRequest(@PathVariable Long id) {
        boolean updated = requestService.acceptRequest(id);
        return updated
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismissRequest(@PathVariable Long id) {
        boolean updated = requestService.dismissRequest(id);
        return updated
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/notifications/stream")
    public SseEmitter streamNotifications(@RequestParam String token) {
        String username = jwtService.extractUsername(token);
        return notificationService.register(username);
    }
}