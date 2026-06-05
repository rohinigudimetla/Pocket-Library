package com.pocketlibrary.server.controller;

import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.service.BookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// @RestController tells Spring that this class handles HTTP requests
// and that every method returns data directly as JSON.
// Without this, Spring would try to render an HTML view instead.
@RestController

// @RequestMapping sets the base URL for all endpoints in this class.
// Every endpoint here will start with /api/books.
@RequestMapping("/api/books")

// @CrossOrigin allows the frontend (running on port 5173) to call
// this backend (running on port 8080). Without this, the browser
// blocks the request for security reasons. This is called CORS.
@CrossOrigin(origins = "http://localhost:5173")
public class BookController {

    private final BookService bookService;

    // Constructor injection — same pattern as BookService.
    // Spring finds the BookService bean and passes it in here.
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // GET /api/books
    // Returns all books as a JSON array.
    // ResponseEntity wraps the response so we can control the HTTP status code.
    // HttpStatus.OK = 200
    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
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

    // POST /api/books
    // @RequestBody tells Spring to read the JSON from the request body
    // and convert it into a Book object automatically.
    // Returns the saved book with status 201 (Created).
    @PostMapping
    public ResponseEntity<Book> addBook(@RequestBody Book book) {
        Book saved = bookService.addBook(book);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

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