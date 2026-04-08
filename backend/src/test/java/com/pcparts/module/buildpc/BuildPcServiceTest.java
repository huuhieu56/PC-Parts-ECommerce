package com.pcparts.module.buildpc;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.module.buildpc.dto.CompatibilityRequest;
import com.pcparts.module.buildpc.dto.CompatibilityResponse;
import com.pcparts.module.buildpc.service.BuildPcService;
import com.pcparts.module.buildpc.service.CerebrasService;
import com.pcparts.module.product.entity.*;
import com.pcparts.module.product.repository.ProductAttributeRepository;
import com.pcparts.module.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BuildPcService.
 */
@ExtendWith(MockitoExtension.class)
class BuildPcServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductAttributeRepository productAttributeRepository;

    @Mock
    private CerebrasService cerebrasService;

    @InjectMocks
    private BuildPcService buildPcService;

    private Product cpuProduct;
    private Product mainboardProduct;
    private Category cpuCategory;
    private Category mainboardCategory;
    private Brand intelBrand;
    private Brand asusBrand;

    @BeforeEach
    void setUp() {
        cpuCategory = Category.builder().id(1L).name("CPU").build();
        mainboardCategory = Category.builder().id(2L).name("Mainboard").build();
        intelBrand = Brand.builder().id(1L).name("Intel").build();
        asusBrand = Brand.builder().id(2L).name("ASUS").build();

        cpuProduct = Product.builder()
                .id(101L)
                .name("Intel Core i5-13600K")
                .sku("CPU-13600K")
                .slug("intel-core-i5-13600k")
                .originalPrice(new BigDecimal("8990000"))
                .sellingPrice(new BigDecimal("7990000"))
                .category(cpuCategory)
                .brand(intelBrand)
                .status("ACTIVE")
                .build();

        mainboardProduct = Product.builder()
                .id(202L)
                .name("ASUS ROG Strix Z790-A")
                .sku("MB-Z790-A")
                .slug("asus-rog-strix-z790-a")
                .originalPrice(new BigDecimal("12990000"))
                .sellingPrice(new BigDecimal("11990000"))
                .category(mainboardCategory)
                .brand(asusBrand)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("UC-CUS-08: Should check compatibility successfully with AI")
    void checkCompatibility_withValidComponents_returnsAiAnalysis() {
        // Given
        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(2).productId(202L).build()
                ))
                .build();

        when(productRepository.findAllById(anyList()))
                .thenReturn(List.of(cpuProduct, mainboardProduct));

        when(productAttributeRepository.findByProductId(101L))
                .thenReturn(List.of());
        when(productAttributeRepository.findByProductId(202L))
                .thenReturn(List.of());

        String aiResponse = """
            ✅ Cấu hình tương thích tốt!
            
            **Điểm tương thích:**
            - CPU Intel Core i5-13600K sử dụng socket LGA 1700
            - Mainboard ASUS Z790-A hỗ trợ socket LGA 1700
            - Cả hai đều hỗ trợ DDR5
            
            Lưu ý: Nên bổ sung tản nhiệt tower hoặc AIO cho CPU này do TDP 125W.
            """;
        when(cerebrasService.chat(anyString())).thenReturn(aiResponse);

        // When
        CompatibilityResponse response = buildPcService.checkCompatibility(request);

        // Then
        assertThat(response.isCompatible()).isTrue();
        assertThat(response.getTotalPrice()).isEqualByComparingTo(new BigDecimal("19980000"));
        assertThat(response.getAnalysis()).contains("tương thích tốt");
        assertThat(response.getWarnings()).contains("Lưu ý: Nên bổ sung tản nhiệt tower hoặc AIO cho CPU này do TDP 125W.");

        verify(cerebrasService).chat(contains("Intel Core i5-13600K"));
        verify(cerebrasService).chat(contains("ASUS ROG Strix Z790-A"));
    }

    @Test
    @DisplayName("UC-CUS-08: Should detect incompatibility from AI response")
    void checkCompatibility_withIncompatibleComponents_returnsNotCompatible() {
        // Given
        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(2).productId(202L).build()
                ))
                .build();

        when(productRepository.findAllById(anyList()))
                .thenReturn(List.of(cpuProduct, mainboardProduct));
        when(productAttributeRepository.findByProductId(anyLong()))
                .thenReturn(List.of());

        String aiResponse = """
            ❌ Cấu hình không tương thích!
            
            **Vấn đề:**
            - CPU sử dụng socket AM5 nhưng Mainboard chỉ hỗ trợ LGA 1700
            - Không hỗ trợ lẫn nhau
            
            **Gợi ý:** Chọn Mainboard hỗ trợ socket AM5 như ASUS ROG Crosshair X670E.
            """;
        when(cerebrasService.chat(anyString())).thenReturn(aiResponse);

        // When
        CompatibilityResponse response = buildPcService.checkCompatibility(request);

        // Then
        assertThat(response.isCompatible()).isFalse();
        assertThat(response.getAnalysis()).contains("không tương thích");
    }

    @Test
    @DisplayName("UC-CUS-08: Should return fallback when AI service unavailable")
    void checkCompatibility_whenAiServiceFails_returnsFallback() {
        // Given
        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(2).productId(202L).build()
                ))
                .build();

        when(productRepository.findAllById(anyList()))
                .thenReturn(List.of(cpuProduct, mainboardProduct));
        when(productAttributeRepository.findByProductId(anyLong()))
                .thenReturn(List.of());
        when(cerebrasService.chat(anyString()))
                .thenThrow(new RuntimeException("Dịch vụ AI tạm không khả dụng"));

        // When
        CompatibilityResponse response = buildPcService.checkCompatibility(request);

        // Then
        assertThat(response.isCompatible()).isTrue();
        assertThat(response.getTotalPrice()).isEqualByComparingTo(new BigDecimal("19980000"));
        assertThat(response.getAnalysis()).contains("Dịch vụ AI tạm không khả dụng");
        assertThat(response.getWarnings()).isNotEmpty();
    }

    @Test
    @DisplayName("UC-CUS-08: Should throw error when less than 2 components")
    void checkCompatibility_withLessThan2Components_throwsError() {
        // Given
        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build()
                ))
                .build();

        // When/Then
        assertThatThrownBy(() -> buildPcService.checkCompatibility(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ít nhất 2 linh kiện");
    }

    @Test
    @DisplayName("UC-CUS-08: Should throw error when product not found")
    void checkCompatibility_withNonExistentProduct_throwsError() {
        // Given
        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(2).productId(999L).build()
                ))
                .build();

        when(productRepository.findAllById(anyList()))
                .thenReturn(List.of(cpuProduct)); // Only returns 1 product

        // When/Then
        assertThatThrownBy(() -> buildPcService.checkCompatibility(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không tồn tại");
    }

    @Test
    @DisplayName("UC-CUS-08: Should calculate total price correctly")
    void checkCompatibility_shouldCalculateTotalPriceCorrectly() {
        // Given
        Product ramProduct = Product.builder()
                .id(303L)
                .name("G.Skill Trident Z5 32GB DDR5")
                .sku("RAM-TZ5-32")
                .slug("gskill-trident-z5-32gb")
                .originalPrice(new BigDecimal("5990000"))
                .sellingPrice(new BigDecimal("4990000"))
                .category(cpuCategory)
                .brand(intelBrand)
                .status("ACTIVE")
                .build();

        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(2).productId(202L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(3).productId(303L).build()
                ))
                .build();

        when(productRepository.findAllById(anyList()))
                .thenReturn(List.of(cpuProduct, mainboardProduct, ramProduct));
        when(productAttributeRepository.findByProductId(anyLong()))
                .thenReturn(List.of());
        when(cerebrasService.chat(anyString())).thenReturn("✅ Cấu hình tương thích!");

        // When
        CompatibilityResponse response = buildPcService.checkCompatibility(request);

        // Then
        // 7990000 + 11990000 + 4990000 = 24970000
        assertThat(response.getTotalPrice()).isEqualByComparingTo(new BigDecimal("24970000"));
    }

    @Test
    @DisplayName("UC-CUS-08: Should include product attributes in AI prompt")
    void checkCompatibility_shouldIncludeAttributesInPrompt() {
        // Given
        Attribute socketAttr = Attribute.builder().id(1L).name("Socket").category(cpuCategory).build();
        AttributeValue lga1700 = AttributeValue.builder().id(1L).attribute(socketAttr).value("LGA 1700").build();

        ProductAttribute cpuSocket = ProductAttribute.builder()
                .product(cpuProduct)
                .attribute(socketAttr)
                .attributeValue(lga1700)
                .build();

        CompatibilityRequest request = CompatibilityRequest.builder()
                .components(List.of(
                        CompatibilityRequest.ComponentItem.builder().slotId(1).productId(101L).build(),
                        CompatibilityRequest.ComponentItem.builder().slotId(2).productId(202L).build()
                ))
                .build();

        when(productRepository.findAllById(anyList()))
                .thenReturn(List.of(cpuProduct, mainboardProduct));
        when(productAttributeRepository.findByProductId(101L))
                .thenReturn(List.of(cpuSocket));
        when(productAttributeRepository.findByProductId(202L))
                .thenReturn(List.of());
        when(cerebrasService.chat(anyString())).thenReturn("✅ Tương thích!");

        // When
        buildPcService.checkCompatibility(request);

        // Then
        verify(cerebrasService).chat(argThat(prompt ->
                prompt.contains("Socket") && prompt.contains("LGA 1700")
        ));
    }
}
