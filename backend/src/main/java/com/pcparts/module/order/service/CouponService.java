package com.pcparts.module.order.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.order.entity.Coupon;
import com.pcparts.module.order.repository.CouponRepository;
import lombok.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public List<CouponDto> getAllCoupons() {
        return couponRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public CouponDto createCoupon(CouponDto dto) {
        if (couponRepository.existsByCode(dto.getCode())) throw new BusinessException("Mã giảm giá đã tồn tại", HttpStatus.CONFLICT);
        Coupon coupon = Coupon.builder().code(dto.getCode().toUpperCase()).discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue()).minOrderValue(dto.getMinOrderValue())
                .maxDiscount(dto.getMaxDiscount()).maxUses(dto.getMaxUses())
                .startDate(dto.getStartDate()).endDate(dto.getEndDate()).build();
        coupon = couponRepository.save(coupon);
        return toDto(coupon);
    }

    @Transactional
    public CouponDto updateCoupon(Long id, CouponDto dto) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        coupon.setCode(dto.getCode().toUpperCase());
        coupon.setDiscountType(dto.getDiscountType());
        coupon.setDiscountValue(dto.getDiscountValue());
        coupon.setMinOrderValue(dto.getMinOrderValue());
        coupon.setMaxDiscount(dto.getMaxDiscount());
        coupon.setMaxUses(dto.getMaxUses());
        coupon.setStartDate(dto.getStartDate());
        coupon.setEndDate(dto.getEndDate());
        coupon = couponRepository.save(coupon);
        return toDto(coupon);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        couponRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        couponRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CouponDto validateCoupon(String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new BusinessException("Mã giảm giá không tồn tại", HttpStatus.NOT_FOUND));
        if (!coupon.isActive()) throw new BusinessException("Mã giảm giá không hoạt động", HttpStatus.BAD_REQUEST);
        if (coupon.getMinOrderValue() != null && orderAmount.compareTo(coupon.getMinOrderValue()) < 0)
            throw new BusinessException("Đơn hàng chưa đạt giá trị tối thiểu", HttpStatus.BAD_REQUEST);

        BigDecimal discountAmount;
        if ("PERCENTAGE".equals(coupon.getDiscountType())) {
            discountAmount = orderAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscount() != null && discountAmount.compareTo(coupon.getMaxDiscount()) > 0) {
                discountAmount = coupon.getMaxDiscount();
            }
        } else {
            discountAmount = coupon.getDiscountValue();
        }
        // Cap discount to order amount
        if (discountAmount.compareTo(orderAmount) > 0) {
            discountAmount = orderAmount;
        }

        CouponDto dto = toDto(coupon);
        dto.setComputedDiscount(discountAmount);
        return dto;
    }

    private CouponDto toDto(Coupon c) {
        return CouponDto.builder().id(c.getId()).code(c.getCode()).discountType(c.getDiscountType())
                .discountValue(c.getDiscountValue()).minOrderValue(c.getMinOrderValue())
                .maxDiscount(c.getMaxDiscount()).maxUses(c.getMaxUses()).usedCount(c.getUsedCount())
                .startDate(c.getStartDate()).endDate(c.getEndDate()).isActive(c.isActive()).build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CouponDto {
        private Long id;
        private String code;
        private String discountType;
        private BigDecimal discountValue;
        private BigDecimal minOrderValue;
        private BigDecimal maxDiscount;
        private Integer maxUses;
        private Integer usedCount;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Boolean isActive;
        private BigDecimal computedDiscount;
    }
}
