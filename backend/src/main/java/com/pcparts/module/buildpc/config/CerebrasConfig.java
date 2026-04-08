package com.pcparts.module.buildpc.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Cerebras LLM API integration.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "cerebras")
public class CerebrasConfig {

    /**
     * Cerebras API key for authentication.
     */
    private String apiKey;

    /**
     * Base URL for Cerebras API.
     */
    private String baseUrl = "https://api.cerebras.ai/v1";

    /**
     * Model to use for chat completions.
     */
    private String model = "llama3.1-8b";

    /**
     * Request timeout in milliseconds.
     */
    private int timeout = 30000;
}
