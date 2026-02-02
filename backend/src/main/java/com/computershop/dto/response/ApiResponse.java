package com.computershop.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @JsonProperty("status_code")
    private int statusCode;

    private String message;
    private T data;
    private Object errors;

    public ApiResponse(int statusCode, String message) {
        this.statusCode = statusCode;
        this.message = message;
    }

    public ApiResponse(int statusCode, String message, T data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "Success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(200, message);
    }

    public static ApiResponse<Void> created(String message) {
        return new ApiResponse<>(201, message);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(201, message, data);
    }

    public static ApiResponse<Void> badRequest(String message) {
        return new ApiResponse<>(400, message);
    }

    public static ApiResponse<Void> badRequest(String message, Object errors) {
        return ApiResponse.<Void>builder()
                .statusCode(400)
                .message(message)
                .errors(errors)
                .build();
    }

    public static ApiResponse<Void> notFound(String message) {
        return new ApiResponse<>(404, message);
    }

    public static ApiResponse<Void> internalServerError(String message) {
        return new ApiResponse<>(500, message);
    }
}
