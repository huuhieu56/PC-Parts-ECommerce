package com.computershop.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "promotions_seq")
    @SequenceGenerator(name = "promotions_seq", sequenceName = "promotions_seq", allocationSize = 1)
    private Long id;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0")
    @Column(name = "minimum_order_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minimumOrderAmount = BigDecimal.ZERO;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;


    public boolean isValidNow() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && !now.isBefore(startDate) && !now.isAfter(endDate);
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        if (!isValidNow() || orderAmount.compareTo(minimumOrderAmount) < 0) {
            return BigDecimal.ZERO;
        }

        if (discountType == DiscountType.PERCENTAGE) {
            return orderAmount.multiply(discountValue).divide(new BigDecimal("100"));
        } else {
            return discountValue;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Promotion promotion = (Promotion) o;
        return Objects.equals(id, promotion.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // Các enum
    public enum DiscountType {
        PERCENTAGE, FIXED_AMOUNT
    }
}
