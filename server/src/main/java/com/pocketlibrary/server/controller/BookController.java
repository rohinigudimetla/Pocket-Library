package com.pocketlibrary.server.controller;

import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.model.User;
import com.pocketlibrary.server.repository.UserRepository;
import com.pocketlibrary.server.service.BookService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// @RestController tells Spring that this class handles HTTP requests
// and that every method returns data directly as JSON.
// Without this, Spring would try to render an HTML view instead.
@RestController

// @RequestMapping sets the base URL for all endpoints in this class.
// Every endpoint here will start with /api/books.
@RequestMapping("/api/books")

// @CrossOrigin removed. That rule now lives once, globally, in
// SecurityConfig's corsConfigurationSource(), instead of being repeated
// on every controller.
public class BookController {

    private final BookService bookService;
    // Needed to look up the real User row for whoever is currently
    // logged in, so a newly added book can be attached to them.
    private final UserRepository userRepository;

    // Constructor injection — same pattern as BookService.
    // Spring finds both beans and passes them in here.
    public BookController(BookService bookService, UserRepository userRepository) {
        this.bookService = bookService;
        this.userRepository = userRepository;
    }

    // GET /api/books
    // Returns all books as a JSON array.
    // ResponseEntity wraps the response so we can control the HTTP status code.
    // HttpStatus.OK = 200
    // No role check needed — SecurityConfig only requires that someone
    // is logged in at all (.anyRequest().authenticated()) for this endpoint.
    @GetMapping
    public ResponseEntity<Page<Book>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean inProgress
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Book> books = inProgress
                ? bookService.getBooksInProgress(pageable)
                : bookService.getAllBooks(pageable);
        return ResponseEntity.ok(books);
    }

    // GET /api/books/{id}
    // {id} is a path variable — the actual number comes from the URL.
    // If the book exists, returns it with status 200.
    // If not, returns status 404.
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return bookService.getBookById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // @PreAuthorize checks the role right here, at the method itself,
    // before the method body ever runs. This is a second, explicit check
    // in addition to the rule already enforced in SecurityConfig at the
    // URL level — this one makes the rule visible right where the action
    // happens, instead of only in a separate config file.
    // "hasRole('ADMIN')" checks for an authority named "ROLE_ADMIN" —
    // this lines up with JwtFilter, which sets authorities as
    // "ROLE_" + role.
    @PreAuthorize("hasRole('ADMIN')")
    // POST /api/books
    // @RequestBody tells Spring to read the JSON from the request body
    // and convert it into a Book object automatically.
    // Returns the saved book with status 201 (Created).
    @PostMapping
    public ResponseEntity<Book> addBook(@RequestBody Book book) {
        // SecurityContextHolder holds the identity JwtFilter wrote in
        // when this request's token was validated. getName() returns
        // the username, the same value passed into generateToken()
        // back in JwtService.
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        // Look up the real User row matching that username, so the
        // book can be attached to an actual database row, not just a
        // string. orElseThrow is used here because reaching this line
        // with no matching user would mean a valid token exists for a
        // user that no longer exists in the database, a genuine
        // inconsistency worth failing loudly on rather than silently.
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        book.setUser(currentUser);
        Book saved = bookService.addBook(book);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Same reasoning as addBook() above — only an ADMIN can delete.
    @PreAuthorize("hasRole('ADMIN')")
    // DELETE /api/books/{id}
    // If the book was found and deleted, returns 204 (No Content).
    // If the book was not found, returns 404.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        boolean deleted = bookService.deleteBook(id);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}