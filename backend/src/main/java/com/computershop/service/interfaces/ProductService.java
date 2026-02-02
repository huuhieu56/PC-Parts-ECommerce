package com.computershop.service.interfaces;

import com.computershop.dto.request.ProductRequest;
import com.computershop.dto.request.ProductWithImageUrlsRequest;
import com.computershop.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface ProductService {


    ProductResponse getProductById(Long id);


    Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);


    Page<ProductResponse> searchProducts(String keyword, Pageable pageable);

    Page<ProductResponse> searchProductsWithFilters(Long categoryId, String keyword,
                                                    BigDecimal minPrice, BigDecimal maxPrice,
                                                    Pageable pageable);

    Page<ProductResponse> getProductsWithFiltersAndAttributes(
            List<Long> categoryIds,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            String search,
            String sortBy,
            String sortDirection,
            Map<String, List<String>> attrEquals,
            Map<String, Number> attrMin,
            Map<String, Number> attrMax,
            Pageable pageable
    );


    Page<ProductResponse> getProductsForManagement(Long categoryId, String stockStatus, String search, Pageable pageable);


    ProductResponse createProduct(ProductRequest request);


    ProductResponse createProductWithImageUrls(ProductWithImageUrlsRequest request);


    ProductResponse createProduct(ProductRequest request, MultipartFile[] images) throws IOException;


    ProductResponse updateProduct(Long id, ProductRequest request);


    void deleteProduct(Long id);


    void updateStock(Long productId, Integer newQuantity, String reason, Long performedBy);


    long countProducts();
}
