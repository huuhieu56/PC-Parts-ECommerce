package com.computershop.service.impl;

import com.computershop.dto.request.AttributeDefinitionRequest;
import com.computershop.dto.response.AttributeDefinitionResponse;
import com.computershop.entity.AttributeDefinition;
import com.computershop.entity.Category;
import com.computershop.repository.AttributeDefinitionRepository;
import com.computershop.repository.CategoryRepository;
import com.computershop.service.interfaces.AttributeDefinitionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class AttributeDefinitionServiceImpl implements AttributeDefinitionService {

    private static final Set<String> CHOICE_INPUT_TYPES = Set.of("select", "multi_select", "checkbox");
    private final AttributeDefinitionRepository attributeDefinitionRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    @Override
    public AttributeDefinitionResponse createAttribute(Long categoryId, AttributeDefinitionRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + categoryId));

        if (Boolean.FALSE.equals(category.getIsActive())) {
            throw new RuntimeException("Danh mục đã bị vô hiệu hóa, không thể thêm thuộc tính mới");
        }

        String normalizedCode = normalizeCode(request.getCode());
        validateCodeUniqueness(categoryId, normalizedCode, null);

        String normalizedDataType = normalizeToLower(request.getDataType());
        String normalizedInputType = normalizeToLower(request.getInputType());

        AttributeDefinition attributeDefinition = AttributeDefinition.builder()
                .category(category)
                .code(normalizedCode)
                .displayName(normalizeText(request.getDisplayName()))
                .dataType(normalizedDataType)
                .inputType(normalizedInputType)
                .unit(normalizeNullable(request.getUnit()))
                .sortOrder(request.getSortOrder())
                .options(normalizeOptions(normalizedInputType, request.getOptions()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
                .build();

        AttributeDefinition saved = attributeDefinitionRepository.save(attributeDefinition);
        return AttributeDefinitionResponse.fromEntity(saved);
    }

    @Override
    public AttributeDefinitionResponse updateAttribute(Long categoryId, Long attributeId, AttributeDefinitionRequest request) {
        AttributeDefinition attributeDefinition = attributeDefinitionRepository.findByIdAndCategoryId(attributeId, categoryId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thuộc tính với id: " + attributeId));

        String normalizedCode = normalizeCode(request.getCode());
        validateCodeUniqueness(categoryId, normalizedCode, attributeDefinition.getId());

        String normalizedDataType = normalizeToLower(request.getDataType());
        String normalizedInputType = normalizeToLower(request.getInputType());

        attributeDefinition.setCode(normalizedCode);
        attributeDefinition.setDisplayName(normalizeText(request.getDisplayName()));
        attributeDefinition.setDataType(normalizedDataType);
        attributeDefinition.setInputType(normalizedInputType);
        attributeDefinition.setUnit(normalizeNullable(request.getUnit()));
        attributeDefinition.setSortOrder(request.getSortOrder());
        attributeDefinition.setOptions(normalizeOptions(normalizedInputType, request.getOptions()));
        if (request.getIsActive() != null) {
            attributeDefinition.setIsActive(request.getIsActive());
        }

        AttributeDefinition saved = attributeDefinitionRepository.save(attributeDefinition);
        return AttributeDefinitionResponse.fromEntity(saved);
    }

    @Override
    public void deleteAttribute(Long categoryId, Long attributeId) {
        AttributeDefinition attributeDefinition = attributeDefinitionRepository.findByIdAndCategoryId(attributeId, categoryId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thuộc tính với id: " + attributeId));
        attributeDefinitionRepository.delete(attributeDefinition);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttributeDefinitionResponse> getActiveAttributesByCategory(Long categoryId) {
        return attributeDefinitionRepository.findActiveByCategoryId(categoryId)
                .stream()
                .map(AttributeDefinitionResponse::fromEntity)
                .toList();
    }

    private void validateCodeUniqueness(Long categoryId, String code, Long currentId) {
        boolean exists;
        if (currentId == null) {
            exists = attributeDefinitionRepository.existsByCategoryIdAndCodeIgnoreCase(categoryId, code);
        } else {
            exists = attributeDefinitionRepository.existsByCategoryIdAndCodeIgnoreCaseAndIdNot(categoryId, code, currentId);
        }
        if (exists) {
            throw new RuntimeException("Mã thuộc tính đã tồn tại trong danh mục này");
        }
    }

    private String normalizeCode(String value) {
        String normalized = normalizeText(value);
        if (normalized == null || normalized.isEmpty()) {
            throw new RuntimeException("Mã thuộc tính không hợp lệ");
        }
        return normalized.toLowerCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeNullable(String value) {
        String normalized = normalizeText(value);
        return normalized != null && !normalized.isEmpty() ? normalized : null;
    }

    private String normalizeToLower(String value) {
        String normalized = normalizeText(value);
        return normalized != null ? normalized.toLowerCase() : null;
    }

    private JsonNode normalizeOptions(String inputType, JsonNode options) {
        if (options == null || options.isNull()) {
            return null;
        }

        if (inputType == null) {
            return options;
        }

        String normalizedInput = inputType.trim().toLowerCase();

        if (CHOICE_INPUT_TYPES.contains(normalizedInput)) {
            if (options.isArray() || options.isObject()) {
                return options;
            }

            if (options.isTextual()) {
                ArrayNode arrayNode = objectMapper.createArrayNode();
                LinkedHashSet<String> uniqueValues = new LinkedHashSet<>();
                String raw = options.asText();
                String[] parts = raw.split("\\r?\\n|,");
                for (String part : parts) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        uniqueValues.add(trimmed);
                    }
                }
                uniqueValues.forEach(arrayNode::add);

                if (arrayNode.isEmpty()) {
                    throw new IllegalArgumentException("Danh sách lựa chọn phải chứa ít nhất một giá trị hợp lệ");
                }

                return arrayNode;
            }

            throw new IllegalArgumentException("Tùy chọn phải là danh sách hoặc văn bản hợp lệ");
        }

        if ("range".equals(normalizedInput) && !options.isObject()) {
            throw new IllegalArgumentException("Tùy chọn kiểu range phải là JSON object");
        }

        return options;
    }
}
