package com.pocketlibrary.server.service;

import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.repository.BookRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    // Returns all books by asking the Repository for them.
    // The Service does not know or care how the Repository stores them.
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
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
        return bookRepository.save(book);
    }

    // Deletes a book by ID. Returns true if deleted, false if not found.
    public boolean deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            return false;
        }
        bookRepository.deleteById(id);
        return true;
    }
}