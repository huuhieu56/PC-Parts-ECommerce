package com.computershop.service.interfaces;

import com.computershop.dto.request.PromotionRequest;
import com.computershop.dto.response.PromotionResponse;
import com.computershop.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;


public interface PromotionService {


    PromotionResponse createPromotion(PromotionRequest request);

    PromotionResponse updatePromotion(Long id, PromotionRequest request);

    PromotionResponse getPromotionById(Long id);

    Page<PromotionResponse> getAllPromotions(Pageable pageable);

    List<PromotionResponse> getActivePromotions();

    List<PromotionResponse> getApplicablePromotions(BigDecimal productPrice);

    void deletePromotion(Long id);

    PromotionResponse activatePromotion(Long id);

    PromotionResponse deactivatePromotion(Long id);

    BigDecimal calculateDiscount(BigDecimal originalPrice, Long promotionId);

    BigDecimal calculateFinalPrice(BigDecimal originalPrice, Long promotionId);

    boolean isPromotionActive(Long promotionId);

    boolean isPromotionApplicable(Long promotionId, BigDecimal price);

    PromotionResponse getBestPromotionForPrice(BigDecimal price);

    Page<PromotionResponse> getPromotionsByDiscountType(Promotion.DiscountType discountType, Pageable pageable);

    void validatePromotion(PromotionRequest request);
}
