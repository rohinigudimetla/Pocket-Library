package com.pocketlibrary.server.service;

import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

// @Service tells Spring that this class contains business logic.
// Spring manages it as a bean, just like @Repository.
// The Controller will ask Spring for a BookService and Spring
// will hand it the one it already created. This is called
// Dependency Injection — you never write "new BookService()" yourself.
@Service
public class BookService {

    // This is the Repository that this Service will use to access data.
    // final means it can only be assigned once — in the constructor below.
    private final BookRepository bookRepository;

    // This is constructor injection. Spring sees that BookService needs
    // a BookRepository, finds the one it already created (because of
    // @Repository), and passes it in here automatically.
    // This is the correct way to inject dependencies in Spring.
    // Never use @Autowired on a field directly — constructor injection
    // is safer and easier to test.
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, String> redisTemplate;
    public BookService(BookRepository bookRepository, RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {

        this.bookRepository = bookRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }
    public Page<Book> getAllBooks(Pageable pageable) {
        String cached = redisTemplate.opsForValue().get("books:cache");
        if (cached != null && !cached.isEmpty()) {
            return deserializeBooks(cached, pageable);
        }
        Boolean lockAcquired = redisTemplate.opsForValue().setIfAbsent("books:lock", "locked", 10, TimeUnit.SECONDS);
        if (Boolean.TRUE.equals(lockAcquired)) {
            try {
                Page<Book> books = bookRepository.findAll(pageable);
                String serialized = serializeBooks(books);
                if (serialized != null) {
                    redisTemplate.opsForValue().set("books:cache", serialized, 5, TimeUnit.MINUTES);
                }
                return books;
            } finally {
                redisTemplate.delete("books:lock");
            }
        }
        return bookRepository.findAll(pageable);
    }

    private String serializeBooks(Page<Book> books) {
        try {
            return objectMapper.writeValueAsString(books.getContent());
        } catch (Exception e) {
            return null;
        }
    }

    private Page<Book> deserializeBooks(String cached, Pageable pageable) {
        try {
            List<Book> books = objectMapper.readValue(cached, new TypeReference<List<Book>>() {});
            return new PageImpl<>(books, pageable, books.size());
        } catch (Exception e) {
            return null;
        }
    }

    public Page<Book> getBooksInProgress(Pageable pageable) {
        return bookRepository.findBooksInProgress(pageable);
    }


    // Returns one book by ID wrapped in Optional.
    // If the book does not exist, Optional will be empty.
    // The Controller decides what to do in that case.
    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    // Adds a new book. Passes it to the Repository to assign an ID and store it.
    // Returns the saved book with its new ID.
    public Book addBook(Book book) {
        Book saved = bookRepository.save(book);
        redisTemplate.delete("books:cache");
        return saved;
    }

    // Deletes a book by ID. Returns true if deleted, false if not found.
    public boolean deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            return false;
        }
        bookRepository.deleteById(id);
        redisTemplate.delete("books:cache");
        return true;
    }
}