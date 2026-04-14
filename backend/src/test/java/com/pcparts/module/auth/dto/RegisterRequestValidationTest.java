package com.pcparts.module.auth.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validation tests for RegisterRequest.
 */
class RegisterRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    @Test
    @DisplayName("RegisterRequest - should fail when email has no top-level domain")
    void shouldFailWhenEmailHasNoTopLevelDomain() {
        RegisterRequest request = new RegisterRequest(
                "Nguyen Van A",
                "nhh1@gmail",
                "0901234567",
                "Password123"
        );

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "email".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("RegisterRequest - should pass when email is valid")
    void shouldPassWhenEmailIsValid() {
        RegisterRequest request = new RegisterRequest(
                "Nguyen Van A",
                "nhh1@gmail.com",
                "0901234567",
                "Password123"
        );

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations)
                .noneMatch(v -> "email".equals(v.getPropertyPath().toString()));
    }
}
