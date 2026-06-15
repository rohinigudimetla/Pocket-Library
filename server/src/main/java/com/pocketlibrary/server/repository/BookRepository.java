package com.pocketlibrary.server.repository;

import com.pocketlibrary.server.model.Book;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

// @Repository tells Spring that this class is a data access component.
// Spring will manage it as a bean — meaning Spring creates one instance
// of this class and makes it available to anyone who needs it.
// You never call "new BookRepository()" yourself. Spring does it for you.
@Repository
public class BookRepository {

    // This is our in-memory data store. Just a Java list.
    // In Module 10 this entire list gets replaced by a real database.
    // The rest of the code does not change — only this layer does.
    // That is the whole point of having a separate Repository layer.
    private final List<Book> books = new ArrayList<>();

    // AtomicLong is a thread-safe counter.
    // Every time we add a new book, we call getAndIncrement() to get
    // the next ID. It starts at 1 and goes up by 1 each time.
    // "Atomic" means even if two requests come in at the same time,
    // they will never get the same ID. Regular int is not safe for this.
    private final AtomicLong counter = new AtomicLong(1);

    // This is the constructor. It runs once when Spring creates this class.
    // We pre-load two books so the app has something to show immediately.
    // counter.getAndIncrement() returns the current value (1, then 2)
    // and then increments it for the next call.
    public BookRepository() {
        books.add(new Book(counter.getAndIncrement(), "The Great Gatsby", "F. Scott Fitzgerald", 180, 0, "8739161"));
        books.add(new Book(counter.getAndIncrement(), "Dune", "Frank Herbert", 412, 0, "8765670"));
    }

    // Returns every book in the list.
    // List<Book> means a list where every item is a Book object.
    public List<Book> findAll() {
        return books;
    }

    // Returns one book by its ID, wrapped in Optional.
    // Optional means the result might be empty — the book might not exist.
    // This forces the caller to handle the "book not found" case explicitly
    // instead of getting a NullPointerException.
    // .stream() turns the list into a stream so we can filter it.
    // .filter() keeps only books where the ID matches.
    // .findFirst() returns the first match, wrapped in Optional.
    public Optional<Book> findById(Long id) {
        return books.stream()
                .filter(b -> b.getId().equals(id))
                .findFirst();
    }

    // Adds a new book to the list and returns it with its assigned ID.
    // The caller passes in a Book without an ID.
    // We assign the next ID from the counter, add it to the list,
    // and return the complete book with its new ID.
    public Book save(Book book) {
        book.setId(counter.getAndIncrement());
        books.add(book);
        return book;
    }

    // Removes a book by ID. Returns true if something was removed,
    // false if no book with that ID existed.
    // removeIf() removes all items from the list where the condition is true.
    // Since IDs are unique, it will remove at most one book.
    public boolean deleteById(Long id) {
        return books.removeIf(b -> b.getId().equals(id));
    }
}