package com.pocketlibrary.server.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookUpdateRequest {

    @Min(0)
    private Integer pagesRead;

    @Min(1)
    private Integer totalPages;
}