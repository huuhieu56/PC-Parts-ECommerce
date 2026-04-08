package com.pcparts.module.buildpc.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcparts.module.buildpc.config.CerebrasConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * Service for communicating with Cerebras LLM API.
 * Provider-agnostic abstraction layer for AI compatibility checks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CerebrasService {

    private final CerebrasConfig config;
    private final ObjectMapper objectMapper;

    /**
     * Sends a chat completion request to Cerebras API.
     *
     * @param prompt the user prompt to send
     * @return the AI-generated response text
     */
    public String chat(String prompt) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(config.getTimeout()))
                    .build();

            ChatRequest chatRequest = ChatRequest.builder()
                    .model(config.getModel())
                    .messages(List.of(
                            Message.builder()
                                    .role("system")
                                    .content(getSystemPrompt())
                                    .build(),
                            Message.builder()
                                    .role("user")
                                    .content(prompt)
                                    .build()
                    ))
                    .build();

            String requestBody = objectMapper.writeValueAsString(chatRequest);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getBaseUrl() + "/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Cerebras API error: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("Cerebras API error: " + response.statusCode());
            }

            ChatResponse chatResponse = objectMapper.readValue(response.body(), ChatResponse.class);

            if (chatResponse.getChoices() != null && !chatResponse.getChoices().isEmpty()) {
                return chatResponse.getChoices().get(0).getMessage().getContent();
            }

            return "Không có phản hồi từ AI.";

        } catch (Exception e) {
            log.error("Failed to call Cerebras API", e);
            throw new RuntimeException("Dịch vụ AI tạm không khả dụng: " + e.getMessage(), e);
        }
    }

    private String getSystemPrompt() {
        return """
            Bạn là chuyên gia tư vấn phần cứng máy tính. Nhiệm vụ của bạn là phân tích cấu hình PC 
            và kiểm tra tính tương thích giữa các linh kiện.
            
            Khi phân tích, hãy chú ý:
            1. Socket CPU và Mainboard phải khớp (VD: LGA 1700, AM5)
            2. RAM phải tương thích với Mainboard (DDR4 vs DDR5)
            3. PSU phải đủ công suất cho toàn bộ hệ thống
            4. Case phải vừa Mainboard (ATX, mATX, ITX)
            5. Tản nhiệt phải phù hợp với TDP của CPU
            
            Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.
            Format câu trả lời:
            - Đánh giá tổng quan (1-2 câu)
            - Các điểm tương thích tốt
            - Cảnh báo (nếu có)
            - Gợi ý cải thiện (nếu có)
            """;
    }

    // DTO classes for Cerebras API

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String model;
        private List<Message> messages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String role;
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String id;
        private String object;
        private Long created;
        private String model;
        private List<Choice> choices;
        private Usage usage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Choice {
        private int index;
        private Message message;
        @JsonProperty("finish_reason")
        private String finishReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Usage {
        @JsonProperty("prompt_tokens")
        private int promptTokens;
        @JsonProperty("completion_tokens")
        private int completionTokens;
        @JsonProperty("total_tokens")
        private int totalTokens;
    }
}
