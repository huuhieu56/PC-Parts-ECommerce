package com.pcparts.module.order.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.order.service.CouponService;
import com.pcparts.module.order.service.CouponService.CouponDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST controller for coupon management.
 */
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('coupon.create', 'coupon.update', 'coupon.delete')")
    public ResponseEntity<ApiResponse<List<CouponDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách mã giảm giá", couponService.getAllCoupons()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('coupon.create')")
    public ResponseEntity<ApiResponse<CouponDto>> create(@RequestBody CouponDto dto) {
        CouponDto created = couponService.createCoupon(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mã giảm giá thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('coupon.update')")
    public ResponseEntity<ApiResponse<CouponDto>> update(@PathVariable Long id, @RequestBody CouponDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", couponService.updateCoupon(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('coupon.delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<CouponDto>> validate(
            @RequestParam String code, @RequestParam BigDecimal orderAmount) {
        return ResponseEntity.ok(ApiResponse.success("Mã giảm giá hợp lệ", couponService.validateCoupon(code, orderAmount)));
    }
}
