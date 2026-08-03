package com.delivery.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private Map<String, String> fieldErrors;

    public ErrorResponse(int status, String message) {
        this(LocalDateTime.now(), status, message, null);
    }
}
