package com.pocketlibrary.server.service;

import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    BookRepository bookRepository;

    @Mock
    RedisTemplate<String, String> redisTemplate;

    @Mock
    ValueOperations<String, String> valueOperations;

    @Mock
    ObjectMapper objectMapper;

    BookService bookService;

    Pageable pageable = PageRequest.of(0, 10);

    @BeforeEach
    void setUp() {
        bookService = new BookService(bookRepository, redisTemplate, objectMapper);
    }

    @Test
    void getAllBooksCacheMissReturnsRepositoryResult() {
        Book book1 = new Book();
        book1.setTitle("Dune");
        Book book2 = new Book();
        book2.setTitle("Foundation");
        Page<Book> fakePage = new PageImpl<>(List.of(book1, book2));

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("books:cache")).thenReturn(null);
        when(valueOperations.setIfAbsent(any(), any(), anyLong(), any())).thenReturn(true);
        when(bookRepository.findAll(any(Pageable.class))).thenReturn(fakePage);
        when(objectMapper.writeValueAsString(any())).thenReturn("[{\"title\":\"Dune\"},{\"title\":\"Foundation\"}]");

        Page<Book> result = bookService.getAllBooks(pageable);

        assertEquals(2, result.getContent().size());
        verify(bookRepository).findAll(any(Pageable.class));
        verify(valueOperations).set(eq("books:cache"), any(), eq(5L), eq(TimeUnit.MINUTES));
    }

    @Test
    void getAllBooksCacheHitSkipsRepository() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("books:cache")).thenReturn("[{\"title\":\"Dune\"}]");

        bookService.getAllBooks(pageable);

        verify(bookRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void addBookSavesAndInvalidatesCache() {
        Book book = new Book();
        book.setTitle("Dune");
        Book savedBook = new Book();
        savedBook.setTitle("Dune");

        when(bookRepository.save(any(Book.class))).thenReturn(savedBook);

        Book result = bookService.addBook(book);

        assertEquals("Dune", result.getTitle());
        verify(bookRepository).save(any(Book.class));
        verify(redisTemplate).delete("books:cache");
    }

    @Test
    void deleteBookReturnsTrueAndInvalidatesCache() {
        when(bookRepository.existsById(1L)).thenReturn(true);

        boolean result = bookService.deleteBook(1L);

        assertTrue(result);
        verify(bookRepository).deleteById(1L);
        verify(redisTemplate).delete("books:cache");
    }

    @Test
    void deleteBookReturnsFalseWhenNotFound() {
        when(bookRepository.existsById(99L)).thenReturn(false);

        boolean result = bookService.deleteBook(99L);

        assertFalse(result);
        verify(bookRepository, never()).deleteById(anyLong());
    }
}