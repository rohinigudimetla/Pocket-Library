package com.pocketlibrary.server.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestSummary {
    private Long id;
    private String title;
    private String author;
    private String coverId;
    private int totalPages;
    private String status;
    private String requestedByUsername;
}
