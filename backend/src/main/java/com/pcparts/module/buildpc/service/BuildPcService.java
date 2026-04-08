package com.pcparts.module.buildpc.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.module.buildpc.dto.CompatibilityRequest;
import com.pcparts.module.buildpc.dto.CompatibilityResponse;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.entity.ProductAttribute;
import com.pcparts.module.product.repository.ProductAttributeRepository;
import com.pcparts.module.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for PC Build compatibility checking using AI (LLM).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BuildPcService {

    private final ProductRepository productRepository;
    private final ProductAttributeRepository productAttributeRepository;
    private final CerebrasService cerebrasService;

    /**
     * Slot name mapping for display purposes.
     */
    private static final Map<Integer, String> SLOT_NAMES = Map.of(
            1, "CPU",
            2, "Mainboard",
            3, "RAM",
            4, "SSD 1",
            5, "SSD 2",
            6, "HDD",
            7, "VGA",
            8, "PSU",
            9, "Case",
            10, "Tản nhiệt"
    );

    /**
     * Checks compatibility of selected PC components using AI.
     *
     * @param request the compatibility check request with component list
     * @return compatibility analysis result from AI
     */
    @Transactional(readOnly = true)
    public CompatibilityResponse checkCompatibility(CompatibilityRequest request) {
        if (request.getComponents() == null || request.getComponents().size() < 2) {
            throw new BusinessException("Vui lòng chọn ít nhất 2 linh kiện để kiểm tra tương thích");
        }

        // Fetch all products
        List<Long> productIds = request.getComponents().stream()
                .map(CompatibilityRequest.ComponentItem::getProductId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);

        if (products.size() != productIds.size()) {
            throw new BusinessException("Một số sản phẩm không tồn tại");
        }

        // Build product info map
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Fetch attributes for all products
        Map<Long, List<ProductAttribute>> attributesMap = new HashMap<>();
        for (Long productId : productIds) {
            List<ProductAttribute> attrs = productAttributeRepository.findByProductId(productId);
            attributesMap.put(productId, attrs);
        }

        // Calculate total price
        BigDecimal totalPrice = products.stream()
                .map(Product::getSellingPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Build prompt for AI
        String prompt = buildPrompt(request.getComponents(), productMap, attributesMap);
        log.debug("AI Prompt: {}", prompt);

        // Call AI service
        String aiAnalysis;
        try {
            aiAnalysis = cerebrasService.chat(prompt);
        } catch (Exception e) {
            log.error("AI service failed, returning fallback response", e);
            return buildFallbackResponse(totalPrice, products);
        }

        // Parse AI response and build result
        return CompatibilityResponse.builder()
                .compatible(analyzeCompatibility(aiAnalysis))
                .totalPrice(totalPrice)
                .analysis(aiAnalysis)
                .warnings(extractWarnings(aiAnalysis))
                .suggestions(new ArrayList<>())
                .build();
    }

    /**
     * Builds a prompt for the AI with component specifications.
     */
    private String buildPrompt(List<CompatibilityRequest.ComponentItem> components,
                               Map<Long, Product> productMap,
                               Map<Long, List<ProductAttribute>> attributesMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("Kiểm tra tương thích cấu hình PC sau:\n\n");

        for (CompatibilityRequest.ComponentItem item : components) {
            Product product = productMap.get(item.getProductId());
            String slotName = SLOT_NAMES.getOrDefault(item.getSlotId(), "Linh kiện " + item.getSlotId());

            sb.append("**").append(slotName).append("**: ").append(product.getName()).append("\n");

            // Add attributes
            List<ProductAttribute> attrs = attributesMap.get(item.getProductId());
            if (attrs != null && !attrs.isEmpty()) {
                sb.append("  Thông số:\n");
                for (ProductAttribute attr : attrs) {
                    sb.append("  - ").append(attr.getAttribute().getName())
                            .append(": ").append(attr.getAttributeValue().getValue()).append("\n");
                }
            }
            sb.append("\n");
        }

        sb.append("\nVui lòng phân tích tính tương thích và đưa ra nhận xét.");
        return sb.toString();
    }

    /**
     * Analyzes AI response to determine overall compatibility.
     */
    private boolean analyzeCompatibility(String aiResponse) {
        String lower = aiResponse.toLowerCase();
        // Check for negative keywords
        if (lower.contains("không tương thích") ||
                lower.contains("không phù hợp") ||
                lower.contains("xung đột") ||
                lower.contains("không hỗ trợ")) {
            return false;
        }
        return true;
    }

    /**
     * Extracts warnings from AI response.
     */
    private List<String> extractWarnings(String aiResponse) {
        List<String> warnings = new ArrayList<>();
        String[] lines = aiResponse.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith("cảnh báo") ||
                    trimmed.toLowerCase().startsWith("lưu ý") ||
                    trimmed.toLowerCase().startsWith("⚠") ||
                    trimmed.toLowerCase().startsWith("warning")) {
                warnings.add(trimmed);
            }
        }
        return warnings;
    }

    /**
     * Builds a fallback response when AI service is unavailable.
     */
    private CompatibilityResponse buildFallbackResponse(BigDecimal totalPrice, List<Product> products) {
        StringBuilder analysis = new StringBuilder();
        analysis.append("✅ Kiểm tra cơ bản hoàn tất.\n\n");
        analysis.append("Cấu hình bao gồm:\n");
        for (Product p : products) {
            analysis.append("- ").append(p.getName()).append("\n");
        }
        analysis.append("\n⚠️ Lưu ý: Dịch vụ AI tạm không khả dụng. ");
        analysis.append("Vui lòng kiểm tra thủ công các thông số kỹ thuật như socket CPU/Mainboard, ");
        analysis.append("loại RAM (DDR4/DDR5), và công suất nguồn.");

        return CompatibilityResponse.builder()
                .compatible(true)
                .totalPrice(totalPrice)
                .analysis(analysis.toString())
                .warnings(List.of("Dịch vụ AI tạm không khả dụng — kết quả chỉ mang tính tham khảo"))
                .suggestions(new ArrayList<>())
                .build();
    }
}
