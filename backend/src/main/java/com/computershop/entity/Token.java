package com.computershop.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Token {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tokens_seq")
    @SequenceGenerator(name = "tokens_seq", sequenceName = "tokens_seq", allocationSize = 1)
    private Long id;

    @NotBlank
    @Column(name = "token", nullable = false, unique = true, length = 500)
    private String token;

    @NotBlank
    @Builder.Default
    @Column(name = "token_type", nullable = false, length = 50)
    private String tokenType = "ACCESS_TOKEN";

    @NotNull
    @Column(name = "expiration_date", nullable = false)
    private LocalDateTime expirationDate;

    @NotNull
    @Builder.Default
    @Column(name = "revoked", nullable = false)
    private Boolean revoked = false;

    @NotNull
    @Builder.Default
    @Column(name = "expired", nullable = false)
    private Boolean expired = false;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    public boolean isExpired() {
        return expired || LocalDateTime.now().isAfter(expirationDate);
    }

    public boolean isValid() {
        return !revoked && !isExpired();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Token token1 = (Token) o;
        return Objects.equals(id, token1.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
