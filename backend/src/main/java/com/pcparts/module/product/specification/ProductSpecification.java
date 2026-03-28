package com.pcparts.module.product.specification;

import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.entity.ProductAttribute;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic product filtering.
 * Supports category, brand, keyword, price range, and attribute value filtering.
 */
public class ProductSpecification {

    private ProductSpecification() {
    }

    /**
     * Builds a combined specification from all filter parameters.
     *
     * @param categoryId        filter by category
     * @param brandId           filter by brand
     * @param keyword           search keyword (name or SKU)
     * @param minPrice          minimum selling price
     * @param maxPrice          maximum selling price
     * @param attributeValueIds filter by attribute value IDs (AND logic — product must have ALL)
     * @return combined Specification
     */
    public static Specification<Product> buildFilter(
            Long categoryId, Long brandId, String keyword,
            BigDecimal minPrice, BigDecimal maxPrice,
            List<Long> attributeValueIds) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only active products
            predicates.add(cb.equal(root.get("status"), "ACTIVE"));

            // Category filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // Brand filter
            if (brandId != null) {
                predicates.add(cb.equal(root.get("brand").get("id"), brandId));
            }

            // Keyword search
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern)
                ));
            }

            // Price range
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("sellingPrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("sellingPrice"), maxPrice));
            }

            // Attribute value filter (AND logic: product must have ALL selected values)
            if (attributeValueIds != null && !attributeValueIds.isEmpty()) {
                for (Long attrValId : attributeValueIds) {
                    Subquery<Long> subquery = query.subquery(Long.class);
                    Root<ProductAttribute> paRoot = subquery.from(ProductAttribute.class);
                    subquery.select(paRoot.get("product").get("id"));
                    subquery.where(
                            cb.equal(paRoot.get("product").get("id"), root.get("id")),
                            cb.equal(paRoot.get("attributeValue").get("id"), attrValId)
                    );
                    predicates.add(cb.exists(subquery));
                }
            }

            // Ensure distinct results
            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
