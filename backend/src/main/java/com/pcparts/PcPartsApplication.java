package com.pcparts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

/**
 * Main entry point for PC Parts E-Commerce Backend.
 */
@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class PcPartsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PcPartsApplication.class, args);
    }
}
