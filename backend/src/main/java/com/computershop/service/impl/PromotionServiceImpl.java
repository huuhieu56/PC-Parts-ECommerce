package com.computershop.service.impl;

import com.computershop.dto.request.PromotionRequest;
import com.computershop.dto.response.PromotionResponse;
import com.computershop.entity.Promotion;
import com.computershop.exception.ResourceNotFoundException;
import com.computershop.repository.PromotionRepository;
import com.computershop.service.interfaces.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;

    @Override
    public PromotionResponse createPromotion(PromotionRequest request) {
        log.info("Tạo khuyến mãi với tên: {}", request.getName());

        validatePromotion(request);

        Promotion promotion = Promotion.builder()
                .name(request.getName())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minimumOrderAmount(request.getMinimumOrderAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive())
                .build();

        Promotion savedPromotion = promotionRepository.save(promotion);
        log.info("Đã tạo khuyến mãi với ID: {}", savedPromotion.getId());

        return mapToResponse(savedPromotion);
    }

    @Override
    public PromotionResponse updatePromotion(Long id, PromotionRequest request) {
        log.info("Cập nhật khuyến mãi với ID: {}", id);

        Promotion existingPromotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + id));

        validatePromotion(request);

        existingPromotion.setName(request.getName());
        existingPromotion.setDescription(request.getDescription());
        existingPromotion.setDiscountType(request.getDiscountType());
        existingPromotion.setDiscountValue(request.getDiscountValue());
        existingPromotion.setMinimumOrderAmount(request.getMinimumOrderAmount());
        existingPromotion.setStartDate(request.getStartDate());
        existingPromotion.setEndDate(request.getEndDate());
        existingPromotion.setIsActive(request.getIsActive());

        Promotion updatedPromotion = promotionRepository.save(existingPromotion);
        log.info("Đã cập nhật khuyến mãi với ID: {}", updatedPromotion.getId());

        return mapToResponse(updatedPromotion);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getPromotionById(Long id) {
        log.info("Lấy khuyến mãi với ID: {}", id);

        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + id));

        return mapToResponse(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> getAllPromotions(Pageable pageable) {
        log.info("Lấy tất cả khuyến mãi với phân trang: {}", pageable);

        Page<Promotion> promotionsPage = promotionRepository.findAll(pageable);

        return promotionsPage.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getActivePromotions() {
        log.info("Lấy tất cả khuyến mãi đang hoạt động");

        LocalDateTime now = LocalDateTime.now();
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(now);

        return activePromotions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getApplicablePromotions(BigDecimal productPrice) {
        log.info("Lấy khuyến mãi áp dụng cho giá: {}", productPrice);

        LocalDateTime now = LocalDateTime.now();
        List<Promotion> applicablePromotions = promotionRepository.findApplicablePromotions(now, productPrice.doubleValue());

        return applicablePromotions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deletePromotion(Long id) {
        log.info("Xóa khuyến mãi với ID: {}", id);

        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + id));

        promotion.setIsActive(false);
        promotionRepository.save(promotion);

        log.info("Đã đánh dấu xóa khuyến mãi với ID: {}", id);
    }

    @Override
    public PromotionResponse activatePromotion(Long id) {
        log.info("Kích hoạt khuyến mãi với ID: {}", id);

        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + id));

        promotion.setIsActive(true);
        Promotion updatedPromotion = promotionRepository.save(promotion);

        log.info("Đã kích hoạt khuyến mãi với ID: {}", id);
        return mapToResponse(updatedPromotion);
    }

    @Override
    public PromotionResponse deactivatePromotion(Long id) {
        log.info("Vô hiệu hóa khuyến mãi với ID: {}", id);

        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with ID: " + id));

        promotion.setIsActive(false);
        Promotion updatedPromotion = promotionRepository.save(promotion);

        log.info("Đã vô hiệu hóa khuyến mãi với ID: {}", id);
        return mapToResponse(updatedPromotion);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateDiscount(BigDecimal originalPrice, Long promotionId) {
        log.info("Tính giảm giá cho khuyến mãi {} với giá {}", promotionId, originalPrice);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + promotionId));

        if (!isPromotionActive(promotionId) || !isPromotionApplicable(promotionId, originalPrice)) {
            log.warn("Khuyến mãi {} không hoạt động hoặc không áp dụng cho giá {}", promotionId, originalPrice);
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (promotion.getDiscountType() == Promotion.DiscountType.PERCENTAGE) {
            discount = originalPrice.multiply(promotion.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else {
            discount = promotion.getDiscountValue();
            if (discount.compareTo(originalPrice) > 0) {
                discount = originalPrice;
            }
        }

        log.info("Đã tính giảm giá: {} cho khuyến mãi: {}", discount, promotionId);
        return discount;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateFinalPrice(BigDecimal originalPrice, Long promotionId) {
        log.info("Tính giá cuối cùng cho khuyến mãi {} với giá gốc {}", promotionId, originalPrice);

        BigDecimal discount = calculateDiscount(originalPrice, promotionId);
        BigDecimal finalPrice = originalPrice.subtract(discount);

        if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
            finalPrice = BigDecimal.ZERO;
        }

        log.info("Giá cuối cùng sau khi giảm: {}", finalPrice);
        return finalPrice;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPromotionActive(Long promotionId) {
        log.debug("Kiểm tra khuyến mãi {} có đang hoạt động hay không", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với id: " + promotionId));

        LocalDateTime now = LocalDateTime.now();
        boolean isActive = promotion.getIsActive() &&
                now.isAfter(promotion.getStartDate()) &&
                now.isBefore(promotion.getEndDate());

        log.debug("Khuyến mãi {} trạng thái hoạt động: {}", promotionId, isActive);
        return isActive;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPromotionApplicable(Long promotionId, BigDecimal price) {
        log.debug("Kiểm tra khuyến mãi {} có áp dụng cho giá {} hay không", promotionId, price);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with ID: " + promotionId));

        boolean isApplicable = promotion.getMinimumOrderAmount() == null ||
                price.compareTo(promotion.getMinimumOrderAmount()) >= 0;

        log.debug("Khuyến mãi {} trạng thái áp dụng: {}", promotionId, isApplicable);
        return isApplicable && isPromotionActive(promotionId);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getBestPromotionForPrice(BigDecimal price) {
        log.info("Tìm khuyến mãi tốt nhất cho giá: {}", price);

        List<PromotionResponse> applicablePromotions = getApplicablePromotions(price);

        if (applicablePromotions.isEmpty()) {
            log.info("Không tìm thấy khuyến mãi áp dụng cho giá: {}", price);
            return null;
        }

        PromotionResponse bestPromotion = applicablePromotions.stream()
                .max((p1, p2) -> {
                    BigDecimal discount1 = calculateDiscount(price, p1.getId());
                    BigDecimal discount2 = calculateDiscount(price, p2.getId());
                    return discount1.compareTo(discount2);
                })
                .orElse(null);

        if (bestPromotion != null) {
            log.info("Khuyến mãi tốt nhất: {} với ID: {}", bestPromotion.getName(), bestPromotion.getId());
        }

        return bestPromotion;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> getPromotionsByDiscountType(Promotion.DiscountType discountType, Pageable pageable) {
        log.info("Fetching promotions by discount type: {} with pagination: {}", discountType, pageable);

        Page<Promotion> promotionsPage = promotionRepository.findByDiscountType(discountType, pageable);

        return promotionsPage.map(this::mapToResponse);
    }

    @Override
    public void validatePromotion(PromotionRequest request) {
        log.debug("Validating promotion request: {}", request.getName());

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (!request.getEndDate().isAfter(request.getStartDate())) {
                throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
            }
        }

        if (request.getDiscountType() == Promotion.DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0 ||
                    request.getDiscountValue().compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Phần trăm giảm giá phải nằm trong khoảng 0 đến 100");
            }
        }

        if (request.getDiscountType() == Promotion.DiscountType.FIXED_AMOUNT) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Số tiền giảm cố định phải là số dương");
            }
        }

        if (request.getMinimumOrderAmount() != null &&
                request.getMinimumOrderAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Số tiền tối thiểu cho đơn hàng không được là số âm");
        }

        log.debug("Promotion validation passed");
    }

    private PromotionResponse mapToResponse(Promotion promotion) {
        LocalDateTime now = LocalDateTime.now();

        return PromotionResponse.builder()
                .id(promotion.getId())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .minimumOrderAmount(promotion.getMinimumOrderAmount())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .isActive(promotion.getIsActive())
                .createdAt(promotion.getCreatedAt())
                .updatedAt(promotion.getUpdatedAt())
                .isCurrentlyActive(isPromotionActive(promotion.getId()))
                .isExpired(now.isAfter(promotion.getEndDate()))
                .isNotStarted(now.isBefore(promotion.getStartDate()))
                .status(getPromotionStatus(promotion, now))
                .build();
    }


    private String getPromotionStatus(Promotion promotion, LocalDateTime now) {
        if (!promotion.getIsActive()) {
            return "INACTIVE";
        }

        if (now.isBefore(promotion.getStartDate())) {
            return "NOT_STARTED";
        } else if (now.isAfter(promotion.getEndDate())) {
            return "EXPIRED";
        } else {
            return "ACTIVE";
        }
    }
}
