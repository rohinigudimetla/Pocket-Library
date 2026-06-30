package com.pocketlibrary.server.repository;

import com.pocketlibrary.server.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query("SELECT b FROM Book b WHERE b.pagesRead < b.totalPages")
    Page<Book> findBooksInProgress(Pageable pageable);
}