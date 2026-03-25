package com.pcparts.module.product;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.product.dto.ProductDto;
import com.pcparts.module.product.dto.ProductRequest;
import com.pcparts.module.product.entity.Brand;
import com.pcparts.module.product.entity.Category;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.*;
import com.pcparts.module.product.service.FileService;
import com.pcparts.module.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductService.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private BrandRepository brandRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private ProductAttributeRepository productAttributeRepository;
    @Mock private AttributeRepository attributeRepository;
    @Mock private AttributeValueRepository attributeValueRepository;
    @Mock private FileService fileService;

    @InjectMocks
    private ProductService productService;

    private Category testCategory;
    private Brand testBrand;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testCategory = Category.builder().id(1L).name("CPU").level(0).build();
        testBrand = Brand.builder().id(1L).name("Intel").build();
        testProduct = Product.builder()
                .id(1L)
                .name("Intel Core i7-13700K")
                .sku("CPU-I7-13700K")
                .slug("intel-core-i7-13700k")
                .originalPrice(new BigDecimal("10990000"))
                .sellingPrice(new BigDecimal("9990000"))
                .category(testCategory)
                .brand(testBrand)
                .productCondition("NEW")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Create product — success")
    void createProduct_success() {
        ProductRequest request = new ProductRequest();
        request.setName("Intel Core i7-13700K");
        request.setSku("CPU-I7-13700K");
        request.setOriginalPrice(new BigDecimal("10990000"));
        request.setSellingPrice(new BigDecimal("9990000"));
        request.setCategoryId(1L);
        request.setBrandId(1L);

        when(productRepository.existsBySku("CPU-I7-13700K")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(brandRepository.findById(1L)).thenReturn(Optional.of(testBrand));
        when(productRepository.existsBySlug(any())).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);
        when(productAttributeRepository.findByProductId(anyLong())).thenReturn(Collections.emptyList());
        when(productImageRepository.findByProductIdOrderBySortOrderAsc(anyLong())).thenReturn(Collections.emptyList());

        ProductDto result = productService.createProduct(request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Intel Core i7-13700K");
        assertThat(result.getSku()).isEqualTo("CPU-I7-13700K");
        assertThat(result.getCategoryName()).isEqualTo("CPU");
        assertThat(result.getBrandName()).isEqualTo("Intel");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Create product — duplicate SKU should fail")
    void createProduct_duplicateSku() {
        ProductRequest request = new ProductRequest();
        request.setName("Test");
        request.setSku("EXISTING-SKU");
        request.setOriginalPrice(BigDecimal.ZERO);
        request.setSellingPrice(BigDecimal.ZERO);
        request.setCategoryId(1L);
        request.setBrandId(1L);

        when(productRepository.existsBySku("EXISTING-SKU")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("SKU đã tồn tại");
    }

    @Test
    @DisplayName("Get product by slug — not found")
    void getBySlug_notFound() {
        when(productRepository.findBySlug("invalid-slug")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getBySlug("invalid-slug"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Delete product — soft delete sets INACTIVE")
    void deleteProduct_softDelete() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        productService.deleteProduct(1L);

        assertThat(testProduct.getStatus()).isEqualTo("INACTIVE");
        verify(productRepository).save(testProduct);
    }
}
