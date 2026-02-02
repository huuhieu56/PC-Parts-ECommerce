package com.computershop.service.interfaces;

import com.computershop.dto.request.AttributeDefinitionRequest;
import com.computershop.dto.response.AttributeDefinitionResponse;

import java.util.List;

public interface AttributeDefinitionService {

    AttributeDefinitionResponse createAttribute(Long categoryId, AttributeDefinitionRequest request);

    AttributeDefinitionResponse updateAttribute(Long categoryId, Long attributeId, AttributeDefinitionRequest request);

    void deleteAttribute(Long categoryId, Long attributeId);

    List<AttributeDefinitionResponse> getActiveAttributesByCategory(Long categoryId);
}
