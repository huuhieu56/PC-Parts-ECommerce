package com.computershop.controller;

import com.computershop.dto.request.ProductRequest;
import com.computershop.dto.request.ProductWithImageUrlsRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.PagedResponse;
import com.computershop.dto.response.ProductResponse;
import com.computershop.service.interfaces.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // Lấy tất cả sản phẩm với phân trang và filtering
    // Hỗ trợ filter theo: categoryIds, minPrice, maxPrice, inStock, search, sortBy
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            Pageable pageable,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        Map<String, List<String>> attrEquals = new HashMap<>();
        Map<String, Number> attrMin = new HashMap<>();
        Map<String, Number> attrMax = new HashMap<>();

        if (queryParams != null) {
            for (Map.Entry<String, List<String>> e : queryParams.entrySet()) {
                String key = e.getKey();
                if (!key.startsWith("attr.")) continue;
                String bare = key.substring("attr.".length());
                if (bare.endsWith("_min")) {
                    String k = bare.substring(0, bare.length() - 4);
                    String v = e.getValue() != null && !e.getValue().isEmpty() ? e.getValue().get(0) : null;
                    if (v != null && !v.isBlank()) {
                        try {
                            attrMin.put(k, new java.math.BigDecimal(v));
                        } catch (Exception ignored) {
                        }
                    }
                } else if (bare.endsWith("_max")) {
                    String k = bare.substring(0, bare.length() - 4);
                    String v = e.getValue() != null && !e.getValue().isEmpty() ? e.getValue().get(0) : null;
                    if (v != null && !v.isBlank()) {
                        try {
                            attrMax.put(k, new java.math.BigDecimal(v));
                        } catch (Exception ignored) {
                        }
                    }
                } else {
                    java.util.List<String> vals = e.getValue();
                    if (vals != null && !vals.isEmpty()) {
                        attrEquals.put(bare, vals);
                    }
                }
            }
        }

        Page<ProductResponse> products = productService.getProductsWithFiltersAndAttributes(
                categoryIds, minPrice, maxPrice, inStock, search, sortBy, sortDirection,
                attrEquals, attrMin, attrMax, pageable
        );
        PagedResponse<ProductResponse> paged = PagedResponse.fromPage(products);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm thành công")
                .data(paged)
                .build());
    }

    // API dành riêng cho admin/staff quản lý sản phẩm với filter đơn giản.
    @GetMapping("/management")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getProductsForManagement(
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(name = "stock_status", required = false) String stockStatus,
            @RequestParam(name = "search", required = false) String search,
            Pageable pageable
    ) {
        Page<ProductResponse> products = productService.getProductsForManagement(categoryId, stockStatus, search, pageable);
        PagedResponse<ProductResponse> pagedResponse = PagedResponse.fromPage(products);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm (quản trị) thành công")
                .data(pagedResponse)
                .build());
    }

    // Lấy chi tiết sản phẩm theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin sản phẩm thành công")
                .data(product)
                .build());
    }

    // Lấy sản phẩm theo danh mục
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getProductsByCategory(
            @PathVariable Long categoryId, Pageable pageable) {
        Page<ProductResponse> products = productService.getProductsByCategory(categoryId, pageable);
        PagedResponse<ProductResponse> paged = PagedResponse.fromPage(products);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy sản phẩm theo danh mục thành công")
                .data(paged)
                .build());
    }

    // Tìm kiếm sản phẩm
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> searchProducts(
            @RequestParam String keyword, Pageable pageable) {
        Page<ProductResponse> products = productService.searchProducts(keyword, pageable);
        PagedResponse<ProductResponse> paged = PagedResponse.fromPage(products);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<ProductResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tìm kiếm sản phẩm thành công")
                .data(paged)
                .build());
    }

    // Lấy tổng số sản phẩm (không yêu cầu token, dùng cho paging trên frontend)
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getTotalProducts() {
        long total = productService.countProducts();
        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy tổng số sản phẩm thành công")
                .data(total)
                .build());
    }

    // Tạo sản phẩm mới
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(consumes = {"application/json", "multipart/form-data"})
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestPart(name = "product") @Valid ProductRequest request,
            @RequestPart(name = "images", required = false) MultipartFile[] images
    ) throws IOException {
        ProductResponse product = productService.createProduct(request, images);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo sản phẩm thành công")
                        .data(product)
                        .build());
    }

    // Tạo sản phẩm mới bằng cách truyền image URLs trong body JSON
    // Chỉ ADMIN được phép
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(path = "/with-image-urls", consumes = "application/json")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductWithImageUrls(
            @Valid @RequestBody ProductWithImageUrlsRequest request
    ) {
        ProductResponse product = productService.createProductWithImageUrls(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo sản phẩm thành công (image URLs)")
                        .data(product)
                        .build());
    }

    // Cập nhật sản phẩm
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật sản phẩm thành công")
                .data(product)
                .build());
    }

    // Xóa sản phẩm (soft delete)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa sản phẩm thành công")
                .build());
    }


}
