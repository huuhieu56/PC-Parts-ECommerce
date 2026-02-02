package com.computershop.controller;

import com.computershop.dto.request.PromotionRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.PagedResponse;
import com.computershop.dto.response.PromotionResponse;
import com.computershop.entity.Promotion;
import com.computershop.service.interfaces.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// REST Controller quản lý khuyến mãi
// Xử lý CRUD khuyến mãi, tính toán giảm giá và truy vấn khuyến mãi đang hoạt động
@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
@Slf4j
public class PromotionController {

    private final PromotionService promotionService;

    // Lấy tất cả khuyến mãi đang hoạt động
    // Công khai - ai cũng có thể xem
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActivePromotions() {

        log.info("Đang lấy danh sách khuyến mãi đang hoạt động");
        List<PromotionResponse> activePromotions = promotionService.getActivePromotions();

        return ResponseEntity.ok(ApiResponse.<List<PromotionResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách khuyến mãi đang hoạt động thành công")
                .data(activePromotions)
                .build());
    }

    // Lấy các khuyến mãi áp dụng cho một mức giá cụ thể
    // Công khai - hữu ích để khách xem giảm giá khả dụng
    @GetMapping("/applicable")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getApplicablePromotions(
            @RequestParam BigDecimal price) {

        log.info("Đang lấy khuyến mãi áp dụng cho giá: {}", price);
        List<PromotionResponse> applicablePromotions = promotionService.getApplicablePromotions(price);

        return ResponseEntity.ok(ApiResponse.<List<PromotionResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách khuyến mãi áp dụng cho giá thành công")
                .data(applicablePromotions)
                .build());
    }

    // Lấy khuyến mãi tốt nhất cho một mức giá
    // Công khai - giúp khách tìm ưu đãi tốt nhất
    @GetMapping("/best")
    public ResponseEntity<ApiResponse<PromotionResponse>> getBestPromotionForPrice(
            @RequestParam BigDecimal price) {

        log.info("Đang tìm khuyến mãi tốt nhất cho giá: {}", price);
        PromotionResponse bestPromotion = promotionService.getBestPromotionForPrice(price);

        if (bestPromotion != null) {
            return ResponseEntity.ok(ApiResponse.<PromotionResponse>builder()
                    .statusCode(HttpStatus.OK.value())
                    .message("Tìm khuyến mãi tốt nhất thành công")
                    .data(bestPromotion)
                    .build());
        } else {
            return ResponseEntity.ok(ApiResponse.<PromotionResponse>builder()
                    .statusCode(HttpStatus.OK.value())
                    .message("Không tìm thấy khuyến mãi phù hợp")
                    .data(null)
                    .build());
        }
    }

    // Tính mức giảm giá cho một giá gốc và khuyến mãi
    // Công khai - phục vụ tính toán thời gian thực
    @GetMapping("/{id}/calculate-discount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateDiscount(
            @PathVariable Long id,
            @RequestParam BigDecimal originalPrice) {

        log.info("Đang tính giảm giá cho promotion {} với giá {}", id, originalPrice);
        BigDecimal discountAmount = promotionService.calculateDiscount(originalPrice, id);
        BigDecimal finalPrice = promotionService.calculateFinalPrice(originalPrice, id);

        Map<String, Object> discountData = new HashMap<>();
        discountData.put("promotion_id", id);
        discountData.put("original_price", originalPrice);
        discountData.put("discount_amount", discountAmount);
        discountData.put("final_price", finalPrice);
        discountData.put("savings", discountAmount);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tính toán giảm giá thành công")
                .data(discountData)
                .build());
    }

    // Lấy tất cả khuyến mãi (phân trang)
    // Chỉ ADMIN
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<PromotionResponse>>> getAllPromotions(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Đang lấy tất cả khuyến mãi (phân trang): {}", pageable);
        Page<PromotionResponse> promotionsPage = promotionService.getAllPromotions(pageable);

        PagedResponse<PromotionResponse> paged = PagedResponse.fromPage(promotionsPage);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<PromotionResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách tất cả khuyến mãi thành công")
                .data(paged)
                .build());
    }

    // Lấy khuyến mãi theo ID
    // STAFF/ADMIN dùng để quản lý; công khai có thể xem
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionById(@PathVariable Long id) {

        log.info("Đang lấy khuyến mãi theo ID: {}", id);
        PromotionResponse promotion = promotionService.getPromotionById(id);

        return ResponseEntity.ok(ApiResponse.<PromotionResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin khuyến mãi thành công")
                .data(promotion)
                .build());
    }

    // Lấy khuyến mãi theo loại giảm giá
    // Chỉ ADMIN
    @GetMapping("/type/{discountType}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<PromotionResponse>>> getPromotionsByDiscountType(
            @PathVariable Promotion.DiscountType discountType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Đang lấy khuyến mãi theo loại giảm giá: {} (phân trang: {})", discountType, pageable);
        Page<PromotionResponse> promotionsPage = promotionService.getPromotionsByDiscountType(discountType, pageable);

        PagedResponse<PromotionResponse> paged = PagedResponse.fromPage(promotionsPage);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<PromotionResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách khuyến mãi theo loại giảm giá thành công")
                .data(paged)
                .build());
    }

    // Tạo khuyến mãi mới
    // Chỉ ADMIN
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(@Valid @RequestBody PromotionRequest request) {

        log.info("Đang tạo khuyến mãi mới với dữ liệu: {}", request);

        // Kiểm tra ràng buộc nghiệp vụ
        if (!request.isValidDateRange()) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        if (!request.isValidPercentage()) {
            throw new IllegalArgumentException("Phần trăm giảm giá phải nằm trong khoảng 0 đến 100");
        }

        PromotionResponse createdPromotion = promotionService.createPromotion(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PromotionResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo khuyến mãi mới thành công")
                        .data(createdPromotion)
                        .build());
    }

    // Cập nhật khuyến mãi
    // Chỉ ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequest request) {

        log.info("Đang cập nhật khuyến mãi {} với dữ liệu: {}", id, request);

        // Kiểm tra ràng buộc nghiệp vụ
        if (!request.isValidDateRange()) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        if (!request.isValidPercentage()) {
            throw new IllegalArgumentException("Phần trăm giảm giá phải nằm trong khoảng 0 đến 100");
        }

        PromotionResponse updatedPromotion = promotionService.updatePromotion(id, request);

        return ResponseEntity.ok(ApiResponse.<PromotionResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật khuyến mãi thành công")
                .data(updatedPromotion)
                .build());
    }


    // Xóa khuyến mãi (soft delete)
    // Chỉ ADMIN
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deletePromotion(@PathVariable Long id) {

        log.info("Đang xóa khuyến mãi với ID: {}", id);
        promotionService.deletePromotion(id);

        Map<String, String> deleteData = new HashMap<>();
        deleteData.put("message", "Xóa khuyến mãi thành công");
        deleteData.put("promotion_id", id.toString());

        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa khuyến mãi thành công")
                .data(deleteData)
                .build());
    }

    // Kích hoạt khuyến mãi
    // Chỉ ADMIN
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> activatePromotion(@PathVariable Long id) {

        log.info("Đang kích hoạt khuyến mãi với ID: {}", id);
        PromotionResponse activatedPromotion = promotionService.activatePromotion(id);

        return ResponseEntity.ok(ApiResponse.<PromotionResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Kích hoạt khuyến mãi thành công")
                .data(activatedPromotion)
                .build());
    }

    // Vô hiệu hóa khuyến mãi
    // Chỉ ADMIN
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> deactivatePromotion(@PathVariable Long id) {

        log.info("Đang vô hiệu hóa khuyến mãi với ID: {}", id);
        PromotionResponse deactivatedPromotion = promotionService.deactivatePromotion(id);

        return ResponseEntity.ok(ApiResponse.<PromotionResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Vô hiệu hóa khuyến mãi thành công")
                .data(deactivatedPromotion)
                .build());
    }

    // Kiểm tra khuyến mãi có đang hoạt động không
    // Công khai - hữu ích cho việc xác thực
    @GetMapping("/{id}/is-active")
    public ResponseEntity<ApiResponse<Map<String, Object>>> isPromotionActive(@PathVariable Long id) {

        log.info("Đang kiểm tra khuyến mãi {} có đang hoạt động hay không", id);
        boolean isActive = promotionService.isPromotionActive(id);

        Map<String, Object> activeData = new HashMap<>();
        activeData.put("promotion_id", id);
        activeData.put("is_active", isActive);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Kiểm tra trạng thái khuyến mãi thành công")
                .data(activeData)
                .build());
    }

    // Kiểm tra khuyến mãi có áp dụng cho mức giá cụ thể không
    // Công khai - hữu ích cho việc xác thực
    @GetMapping("/{id}/is-applicable")
    public ResponseEntity<ApiResponse<Map<String, Object>>> isPromotionApplicable(
            @PathVariable Long id,
            @RequestParam BigDecimal price) {

        log.info("Đang kiểm tra khuyến mãi {} có áp dụng cho giá {} hay không", id, price);
        boolean isApplicable = promotionService.isPromotionApplicable(id, price);

        Map<String, Object> applicableData = new HashMap<>();
        applicableData.put("promotion_id", id);
        applicableData.put("price", price);
        applicableData.put("is_applicable", isApplicable);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Kiểm tra khả năng áp dụng khuyến mãi thành công")
                .data(applicableData)
                .build());
    }

    // Xác thực dữ liệu khuyến mãi mà không tạo mới
    // Chỉ ADMIN - kiểm tra hợp lệ trước khi tạo
    @PostMapping("/validate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> validatePromotion(@Valid @RequestBody PromotionRequest request) {

        log.info("Đang xác thực dữ liệu khuyến mãi: {}", request);

        try {
            promotionService.validatePromotion(request);

            Map<String, String> validationData = new HashMap<>();
            validationData.put("status", "valid");
            validationData.put("message", "Dữ liệu khuyến mãi hợp lệ");

            return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                    .statusCode(HttpStatus.OK.value())
                    .message("Xác thực khuyến mãi thành công")
                    .data(validationData)
                    .build());

        } catch (IllegalArgumentException e) {
            Map<String, String> validationData = new HashMap<>();
            validationData.put("status", "invalid");
            validationData.put("message", e.getMessage());

            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, String>>builder()
                            .statusCode(HttpStatus.BAD_REQUEST.value())
                            .message("Xác thực khuyến mãi thất bại")
                            .data(validationData)
                            .build());
        }
    }
}
