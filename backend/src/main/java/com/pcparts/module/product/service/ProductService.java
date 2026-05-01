package com.pcparts.module.product.service;

import com.pcparts.common.dto.PageResponse;
import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.product.dto.*;
import com.pcparts.module.product.entity.*;
import com.pcparts.module.product.repository.*;
import com.pcparts.module.product.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for product CRUD, search, filtering, and image management.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductAttributeRepository productAttributeRepository;
    private final AttributeRepository attributeRepository;
    private final AttributeValueRepository attributeValueRepository;
    private final FileService fileService;

    /**
     * Lists products with pagination and dynamic filtering.
     * Supports category, brand, keyword, price range, attribute value filtering, and sale filter.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductDto> listProducts(int page, int size, String sort,
                                                  Long categoryId, Long brandId, String keyword,
                                                  BigDecimal minPrice, BigDecimal maxPrice,
                                                  List<Long> attributeValueIds, Boolean isSale) {
        boolean isDiscountSort = false;
        Sort springSort;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            String field = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                    ? Sort.Direction.ASC : Sort.Direction.DESC;
            if ("discountPercent".equals(field)) {
                // discountPercent is not a real column — handled via CriteriaBuilder below
                isDiscountSort = true;
                springSort = Sort.unsorted();
            } else {
                springSort = Sort.by(direction, field);
            }
        } else {
            springSort = Sort.by(Sort.Direction.DESC, "createdAt");
        }
        Pageable pageable = PageRequest.of(page, size, springSort);

        Specification<Product> spec = ProductSpecification.buildFilter(
                categoryId, brandId, keyword, minPrice, maxPrice, attributeValueIds, isSale);

        // Sort by discount amount (originalPrice - sellingPrice) DESC
        if (isDiscountSort) {
            spec = spec.and((root, query, cb) -> {
                query.orderBy(cb.desc(cb.diff(root.get("originalPrice"), root.get("sellingPrice"))));
                return cb.conjunction();
            });
        }

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        return PageResponse.from(productPage, this::toDto);
    }


    /**
     * Gets available filter options for a given category.
     * Returns attribute groups with values (and product counts), brands, and price range.
     */
    @Transactional(readOnly = true)
    public ProductFilterDto getFiltersForCategory(Long categoryId) {
        // Get all active products in this category
        List<Product> products = productRepository.findAll(
                ProductSpecification.buildFilter(categoryId, null, null, null, null, null, null));

        Set<Long> productIds = products.stream().map(Product::getId).collect(Collectors.toSet());

        // Build attribute filter groups
        List<Attribute> attributes = attributeRepository.findByCategoryId(categoryId);
        List<ProductFilterDto.AttributeFilterGroup> attrGroups = new ArrayList<>();

        // Single batch query — replaces N+1 findAll() calls
        List<ProductAttribute> allPa = productAttributeRepository.findByProductIdIn(productIds);

        for (Attribute attr : attributes) {
            List<AttributeValue> values = attributeValueRepository.findByAttributeId(attr.getId());
            List<ProductFilterDto.AttributeValueOption> valueOptions = new ArrayList<>();

            for (AttributeValue val : values) {
                long count = allPa.stream()
                        .filter(pa -> pa.getAttributeValue().getId().equals(val.getId()))
                        .count();
                if (count > 0) {
                    valueOptions.add(ProductFilterDto.AttributeValueOption.builder()
                            .valueId(val.getId())
                            .value(val.getValue())
                            .count(count)
                            .build());
                }
            }

            if (!valueOptions.isEmpty()) {
                attrGroups.add(ProductFilterDto.AttributeFilterGroup.builder()
                        .attributeId(attr.getId())
                        .attributeName(attr.getName())
                        .values(valueOptions)
                        .build());
            }
        }

        // Build brand filter options
        Map<Long, String> brandMap = new LinkedHashMap<>();
        Map<Long, Long> brandCount = new LinkedHashMap<>();
        for (Product p : products) {
            Long bId = p.getBrand().getId();
            brandMap.put(bId, p.getBrand().getName());
            brandCount.merge(bId, 1L, Long::sum);
        }
        List<ProductFilterDto.BrandFilterOption> brandOptions = brandMap.entrySet().stream()
                .map(e -> ProductFilterDto.BrandFilterOption.builder()
                        .brandId(e.getKey())
                        .brandName(e.getValue())
                        .count(brandCount.get(e.getKey()))
                        .build())
                .collect(Collectors.toList());

        // Price range
        BigDecimal minPrice = products.stream()
                .map(Product::getSellingPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = products.stream()
                .map(Product::getSellingPrice)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return ProductFilterDto.builder()
                .attributes(attrGroups)
                .brands(brandOptions)
                .priceRange(ProductFilterDto.PriceRangeDto.builder()
                        .minPrice(minPrice)
                        .maxPrice(maxPrice)
                        .build())
                .build();
    }


    /**
     * Gets a product by slug (for public detail page).
     */
    @Transactional(readOnly = true)
    public ProductDto getBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "slug", slug));
        return toDto(product);
    }

    /**
     * Gets a product by ID (for admin).
     */
    @Transactional(readOnly = true)
    public ProductDto getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return toDto(product);
    }

    /**
     * Creates a new product.
     */
    @Transactional
    public ProductDto createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new BusinessException("SKU đã tồn tại", HttpStatus.CONFLICT);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", request.getBrandId()));

        String slug = generateSlug(request.getName());

        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .slug(slug)
                .originalPrice(request.getOriginalPrice())
                .sellingPrice(request.getSellingPrice())
                .description(request.getDescription())
                .category(category)
                .brand(brand)
                .productCondition(request.getCondition() != null ? request.getCondition() : "NEW")
                .status("ACTIVE")
                .build();

        product = productRepository.save(product);

        // Save attributes
        if (request.getAttributes() != null) {
            saveProductAttributes(product, request.getAttributes());
        }

        return toDto(product);
    }

    /**
     * Updates an existing product.
     */
    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        // BUG-14 fix: check SKU uniqueness when updating (exclude self)
        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw new BusinessException("SKU đã tồn tại", HttpStatus.CONFLICT);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", request.getBrandId()));

        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setSlug(generateSlug(request.getName()));
        product.setOriginalPrice(request.getOriginalPrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setBrand(brand);
        if (request.getCondition() != null) {
            product.setProductCondition(request.getCondition());
        }

        product = productRepository.save(product);

        // Update attributes
        if (request.getAttributes() != null) {
            productAttributeRepository.deleteByProductId(id);
            saveProductAttributes(product, request.getAttributes());
        }

        return toDto(product);
    }

    /**
     * Soft-deletes a product (sets status to INACTIVE).
     */
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setStatus("INACTIVE");
        productRepository.save(product);
    }

    /**
     * Uploads images for a product.
     */
    @Transactional
    public List<ProductImageDto> uploadImages(Long productId, List<MultipartFile> files, boolean primaryFirst) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        List<ProductImage> existing = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
        int sortOrder = existing.size();

        for (int i = 0; i < files.size(); i++) {
            String url = fileService.uploadFile(files.get(i), "products");
            ProductImage image = ProductImage.builder()
                    .product(product)
                    .imageUrl(url)
                    .isPrimary(primaryFirst && i == 0 && existing.isEmpty())
                    .sortOrder(sortOrder + i)
                    .build();
            productImageRepository.save(image);
        }

        return productImageRepository.findByProductIdOrderBySortOrderAsc(productId)
                .stream()
                .map(this::toImageDto)
                .collect(Collectors.toList());
    }

    /**
     * Deletes a product image.
     */
    @Transactional
    public void deleteImage(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", "id", imageId));
        fileService.deleteFile(image.getImageUrl());
        productImageRepository.delete(image);
    }

    // --- Helper methods ---

    private void saveProductAttributes(Product product, List<ProductAttributeRequest> attrs) {
        for (ProductAttributeRequest attrReq : attrs) {
            Attribute attr = attributeRepository.findById(attrReq.getAttributeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Attribute", "id", attrReq.getAttributeId()));
            AttributeValue attrVal = attributeValueRepository.findById(attrReq.getAttributeValueId())
                    .orElseThrow(() -> new ResourceNotFoundException("AttributeValue", "id", attrReq.getAttributeValueId()));

            ProductAttribute pa = ProductAttribute.builder()
                    .product(product)
                    .attribute(attr)
                    .attributeValue(attrVal)
                    .build();
            productAttributeRepository.save(pa);
        }
    }

    private String generateSlug(String name) {
        String slug = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("đ", "d").replaceAll("Đ", "D")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("-+", "-")
                .trim();
        // Ensure uniqueness
        if (productRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }
        return slug;
    }

    private ProductDto toDto(Product product) {
        List<ProductAttributeDto> attributes = productAttributeRepository.findByProductId(product.getId())
                .stream()
                .map(pa -> ProductAttributeDto.builder()
                        .attributeId(pa.getAttribute().getId())
                        .attributeName(pa.getAttribute().getName())
                        .value(pa.getAttributeValue().getValue())
                        .build())
                .collect(Collectors.toList());

        List<ProductImageDto> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId())
                .stream()
                .map(this::toImageDto)
                .collect(Collectors.toList());

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .slug(product.getSlug())
                .originalPrice(product.getOriginalPrice())
                .sellingPrice(product.getSellingPrice())
                .description(product.getDescription())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .brandId(product.getBrand().getId())
                .brandName(product.getBrand().getName())
                .condition(product.getProductCondition())
                .status(product.getStatus())
                .images(images)
                .attributes(attributes)
                .build();
    }

    private ProductImageDto toImageDto(ProductImage image) {
        return ProductImageDto.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .isPrimary(image.getIsPrimary())
                .sortOrder(image.getSortOrder())
                .build();
    }
}
