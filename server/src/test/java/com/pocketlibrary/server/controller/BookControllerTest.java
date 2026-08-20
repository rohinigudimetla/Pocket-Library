package com.pocketlibrary.server.controller;

import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.repository.UserRepository;
import com.pocketlibrary.server.security.JwtService;
import com.pocketlibrary.server.security.SecurityConfig;
import com.pocketlibrary.server.service.BookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookController.class)
@ImportAutoConfiguration({
        org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration.class,
        org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration.class,
        org.springframework.boot.security.autoconfigure.web.servlet.ServletWebSecurityAutoConfiguration.class
})
@Import(SecurityConfig.class)
class BookControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    BookService bookService;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    RedisTemplate<String, String> redisTemplate;

    @MockitoBean(name = "setOperations")
    SetOperations<String, String> setOperations;

    String readerToken = "reader.fake.token";
    String adminToken = "admin.fake.token";

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.isMember(any(), any())).thenReturn(null);

        when(jwtService.isTokenValid(readerToken)).thenReturn(true);
        when(jwtService.extractUsername(readerToken)).thenReturn("reader");
        when(jwtService.extractRole(readerToken)).thenReturn("READER");

        when(jwtService.isTokenValid(adminToken)).thenReturn(true);
        when(jwtService.extractUsername(adminToken)).thenReturn("admin");
        when(jwtService.extractRole(adminToken)).thenReturn("ADMIN");
    }

    @Test
    void getBooksShouldReturn401WhenNoToken() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getBooksShouldReturn200WithValidToken() throws Exception {
        when(bookService.getAllBooks(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/books")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk());
    }

    @Test
    void addBookShouldReturn403ForReaderRole() throws Exception {
        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Dune\",\"totalPages\":0,\"pagesRead\":0}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void addBookShouldReturn201ForAdminRole() throws Exception {
        Book savedBook = new Book();
        savedBook.setTitle("Dune");

        when(userRepository.findByUsername("admin"))
                .thenReturn(java.util.Optional.of(new com.pocketlibrary.server.model.User()));
        when(bookService.addBook(any(Book.class))).thenReturn(savedBook);

        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Dune\",\"author\":\"Frank Herbert\",\"totalPages\":1,\"pagesRead\":0}"))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteBookShouldReturn403ForReaderRole() throws Exception {
        mockMvc.perform(delete("/api/books/1")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteBookShouldReturn204WhenFound() throws Exception {
        when(bookService.deleteBook(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/books/1")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteBookShouldReturn404WhenNotFound() throws Exception {
        when(bookService.deleteBook(99L)).thenReturn(false);

        mockMvc.perform(delete("/api/books/99")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateBookShouldReturn200ForReaderRole() throws Exception {
        Book updatedBook = new Book();
        updatedBook.setId(1L);
        updatedBook.setPagesRead(50);

        when(bookService.updateBook(1L, 50, null))
                .thenReturn(java.util.Optional.of(updatedBook));

        mockMvc.perform(patch("/api/books/1")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pagesRead\":50}"))
                .andExpect(status().isOk());
    }

    @Test
    void updateBookShouldOnlyUpdatePagesReadWhenOnlyThatFieldIsSent() throws Exception {
        Book updatedBook = new Book();
        updatedBook.setId(1L);
        updatedBook.setPagesRead(75);

        when(bookService.updateBook(1L, 75, null))
                .thenReturn(java.util.Optional.of(updatedBook));

        mockMvc.perform(patch("/api/books/1")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pagesRead\":75}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagesRead").value(75));

        verify(bookService).updateBook(1L, 75, null);
    }

    @Test
    void updateBookShouldOnlyUpdateTotalPagesWhenOnlyThatFieldIsSent() throws Exception {
        Book updatedBook = new Book();
        updatedBook.setId(1L);
        updatedBook.setTotalPages(300);

        when(bookService.updateBook(1L, null, 300))
                .thenReturn(java.util.Optional.of(updatedBook));

        mockMvc.perform(patch("/api/books/1")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"totalPages\":300}"))
                .andExpect(status().isOk());

        verify(bookService).updateBook(1L, null, 300);
    }

    @Test
    void updateBookShouldReturn404WhenNotFound() throws Exception {
        when(bookService.updateBook(99L, 10, null))
                .thenReturn(java.util.Optional.empty());

        mockMvc.perform(patch("/api/books/99")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pagesRead\":10}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateBookShouldReturn401WhenNoToken() throws Exception {
        mockMvc.perform(patch("/api/books/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pagesRead\":10}"))
                .andExpect(status().isUnauthorized());
    }
}