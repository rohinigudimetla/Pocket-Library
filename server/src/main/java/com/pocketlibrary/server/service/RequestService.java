package com.pocketlibrary.server.service;

import com.pocketlibrary.server.dto.RequestSummary;
import com.pocketlibrary.server.model.Book;
import com.pocketlibrary.server.model.Request;
import com.pocketlibrary.server.model.User;
import com.pocketlibrary.server.repository.RequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RequestService {

    private final RequestRepository requestRepository;
    private final BookService bookService;
    private final RedisTemplate<String, String> redisTemplate;

    public RequestService(RequestRepository requestRepository, BookService bookService, RedisTemplate<String, String> redisTemplate) {
        this.requestRepository = requestRepository;
        this.bookService = bookService;
        this.redisTemplate = redisTemplate;
    }

    public Request createRequest(Request request) {
        request.setStatus("PENDING");
        return requestRepository.save(request);
    }

    public Page<RequestSummary> getMyRequests(User currentUser, Pageable pageable) {
        return requestRepository.findByRequestedBy(currentUser, pageable)
                .map(this::toSummary);
    }

    public Page<RequestSummary> getPendingRequests(Pageable pageable) {
        return requestRepository.findByStatusWithRequester("PENDING", pageable)
                .map(this::toSummary);
    }

    public boolean acceptRequest(Long id) {
        return requestRepository.findById(id)
                .map(request -> {
                    Book book = new Book();
                    book.setTitle(request.getTitle());
                    book.setAuthor(request.getAuthor());
                    book.setCoverId(request.getCoverId());
                    book.setTotalPages(request.getTotalPages());
                    book.setPagesRead(0);
                    book.setUser(request.getRequestedBy());
                    bookService.addBook(book);

                    request.setStatus("ACCEPTED");
                    requestRepository.save(request);
                    String message = request.getRequestedBy().getUsername() + ":" + request.getTitle();
                    redisTemplate.convertAndSend("requests:accepted", message);
                    return true;
                })
                .orElse(false);
    }

    public boolean dismissRequest(Long id) {
        return requestRepository.findById(id)
                .map(request -> {
                    request.setStatus("DISMISSED");
                    requestRepository.save(request);
                    return true;
                })
                .orElse(false);
    }

    private RequestSummary toSummary(Request request) {
        return new RequestSummary(
                request.getId(),
                request.getTitle(),
                request.getAuthor(),
                request.getCoverId(),
                request.getTotalPages(),
                request.getStatus(),
                request.getRequestedBy().getUsername()
        );
    }
}