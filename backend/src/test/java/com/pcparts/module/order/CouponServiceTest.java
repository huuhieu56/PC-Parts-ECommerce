package com.pcparts.module.order;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.order.entity.Coupon;
import com.pcparts.module.order.repository.CouponRepository;
import com.pcparts.module.order.service.CouponService;
import com.pcparts.module.order.service.CouponService.CouponDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock private CouponRepository couponRepository;

    @InjectMocks
    private CouponService couponService;

    private Coupon testCoupon;

    @BeforeEach
    void setUp() {
        testCoupon = Coupon.builder()
                .id(1L).code("SUMMER20").discountType("PERCENTAGE")
                .discountValue(new BigDecimal("20")).minOrderValue(new BigDecimal("500000"))
                .maxDiscount(new BigDecimal("200000")).maxUses(100).usedCount(5)
                .startDate(LocalDateTime.now().minusDays(5))
                .endDate(LocalDateTime.now().plusDays(25))
                .build();
    }

    @Test
    @DisplayName("Get all coupons — returns list")
    void getAllCoupons() {
        when(couponRepository.findAll()).thenReturn(List.of(testCoupon));

        List<CouponDto> result = couponService.getAllCoupons();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCode()).isEqualTo("SUMMER20");
    }

    @Test
    @DisplayName("Create coupon — success")
    void createCoupon_success() {
        CouponDto dto = CouponDto.builder().code("NEW10").discountType("FIXED")
                .discountValue(new BigDecimal("50000"))
                .startDate(LocalDateTime.now()).endDate(LocalDateTime.now().plusDays(30)).build();
        when(couponRepository.existsByCode("NEW10")).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(inv -> {
            Coupon c = inv.getArgument(0); c.setId(2L); return c;
        });

        CouponDto result = couponService.createCoupon(dto);

        assertThat(result.getCode()).isEqualTo("NEW10");
        verify(couponRepository).save(any(Coupon.class));
    }

    @Test
    @DisplayName("Create coupon — duplicate code throws conflict")
    void createCoupon_duplicate() {
        CouponDto dto = CouponDto.builder().code("SUMMER20").build();
        when(couponRepository.existsByCode("SUMMER20")).thenReturn(true);

        assertThatThrownBy(() -> couponService.createCoupon(dto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("Validate coupon — valid coupon passes")
    void validateCoupon_valid() {
        when(couponRepository.findByCode("SUMMER20")).thenReturn(Optional.of(testCoupon));

        CouponDto result = couponService.validateCoupon("SUMMER20", new BigDecimal("1000000"));

        assertThat(result).isNotNull();
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Validate coupon — below min order throws")
    void validateCoupon_belowMinOrder() {
        when(couponRepository.findByCode("SUMMER20")).thenReturn(Optional.of(testCoupon));

        assertThatThrownBy(() -> couponService.validateCoupon("SUMMER20", new BigDecimal("100000")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("giá trị tối thiểu");
    }

    @Test
    @DisplayName("Validate coupon — expired throws")
    void validateCoupon_expired() {
        testCoupon.setEndDate(LocalDateTime.now().minusDays(1));
        when(couponRepository.findByCode("SUMMER20")).thenReturn(Optional.of(testCoupon));

        assertThatThrownBy(() -> couponService.validateCoupon("SUMMER20", new BigDecimal("1000000")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không hoạt động");
    }

    @Test
    @DisplayName("Validate coupon — not found throws")
    void validateCoupon_notFound() {
        when(couponRepository.findByCode("INVALID")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.validateCoupon("INVALID", new BigDecimal("1000000")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không tồn tại");
    }

    @Test
    @DisplayName("Delete coupon — success")
    void deleteCoupon_success() {
        when(couponRepository.findById(1L)).thenReturn(Optional.of(testCoupon));

        couponService.deleteCoupon(1L);

        verify(couponRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Delete coupon — not found throws")
    void deleteCoupon_notFound() {
        when(couponRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.deleteCoupon(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
