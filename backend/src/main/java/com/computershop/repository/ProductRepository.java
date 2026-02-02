package com.computershop.repository;

import com.computershop.entity.Product;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.query.QueryUtils;
import org.springframework.data.jpa.repository.support.JpaEntityInformationSupport;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;


@Repository
public class ProductRepository extends SimpleJpaRepository<Product, Long> {

    private static final String DEFAULT_ALIAS = "p";
    private static final String DEFAULT_ORDER = " ORDER BY p.id ASC";

    private final EntityManager entityManager;

    public ProductRepository(EntityManager entityManager) {
        super(JpaEntityInformationSupport.getEntityInformation(Product.class, entityManager), entityManager);
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<Product> findByIsActiveTrue() {
        String jpql = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.isActive = true";
        return entityManager.createQuery(jpql, Product.class).getResultList();
    }

    @Transactional(readOnly = true)
    public Page<Product> findByIsActiveTrue(Pageable pageable) {
        String select = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.isActive = true";
        String count = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.isActive = true";
        return executePagedQuery(select, count, Collections.emptyMap(), pageable);
    }

    @Transactional(readOnly = true)
    public long countByIsActiveTrue() {
        String jpql = "SELECT COUNT(p) FROM Product p WHERE p.isActive = true";
        return entityManager.createQuery(jpql, Long.class).getSingleResult();
    }

    @Transactional(readOnly = true)
    public Page<Product> findByNameContainingIgnoreCaseAndIsActiveTrue(String keyword, Pageable pageable) {
        String select = "SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.isActive = true AND " +
                "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                "LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))";
        String count = "SELECT COUNT(p) FROM Product p JOIN p.category c WHERE p.isActive = true AND c.isActive = true AND " +
                "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                "LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))";
        Map<String, Object> params = Map.of("keyword", keyword);
        return executePagedQuery(select, count, params, pageable);
    }

    @Transactional(readOnly = true)
    public List<Product> findLowStockProducts() {
        String jpql = "SELECT p FROM Product p WHERE p.quantity <= p.lowStockThreshold AND p.isActive = true";
        return entityManager.createQuery(jpql, Product.class).getResultList();
    }

    @Transactional(readOnly = true)
    public List<Product> findByQuantityLessThanEqual(Integer threshold) {
        String jpql = "SELECT p FROM Product p WHERE p.quantity <= :threshold";
        return entityManager.createQuery(jpql, Product.class)
                .setParameter("threshold", threshold)
                .getResultList();
    }

    @Transactional(readOnly = true)
    public List<Product> findByQuantity(Integer quantity) {
        String jpql = "SELECT p FROM Product p WHERE p.quantity = :quantity";
        return entityManager.createQuery(jpql, Product.class)
                .setParameter("quantity", quantity)
                .getResultList();
    }

    @Transactional(readOnly = true)
    public Page<Product> findProductsForManagement(Long categoryId,
                                                   String stockStatus,
                                                   String search,
                                                   Pageable pageable) {
        StringBuilder select = new StringBuilder("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category c WHERE p.isActive = true");
        StringBuilder count = new StringBuilder("SELECT COUNT(DISTINCT p) FROM Product p LEFT JOIN p.category c WHERE p.isActive = true");
        Map<String, Object> params = new HashMap<>();

        if (categoryId != null) {
            select.append(" AND c.id = :categoryId");
            count.append(" AND c.id = :categoryId");
            params.put("categoryId", categoryId);
        }

        if (stockStatus != null && !stockStatus.isBlank()) {
            switch (stockStatus) {
                case "in_stock" -> {
                    select.append(" AND p.quantity > p.lowStockThreshold");
                    count.append(" AND p.quantity > p.lowStockThreshold");
                }
                case "low_stock" -> {
                    select.append(" AND p.quantity > 0 AND p.quantity <= p.lowStockThreshold");
                    count.append(" AND p.quantity > 0 AND p.quantity <= p.lowStockThreshold");
                }
                case "out_of_stock" -> {
                    select.append(" AND p.quantity = 0");
                    count.append(" AND p.quantity = 0");
                }
            }
        }

        if (search != null && !search.isBlank()) {
            select.append(" AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))"
                    + " OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))"
                    + " OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))"
                    + " OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))");
            count.append(" AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))"
                    + " OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))"
                    + " OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))"
                    + " OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))");
            params.put("search", search.trim());
        }

        return executePagedQuery(select.toString(), count.toString(), params, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Product> findProductsWithFilters(Long categoryId,
                                                 String keyword,
                                                 BigDecimal minPrice,
                                                 BigDecimal maxPrice,
                                                 Pageable pageable) {
        StringBuilder select = new StringBuilder("SELECT p FROM Product p JOIN p.category c WHERE p.isActive = true AND c.isActive = true");
        StringBuilder count = new StringBuilder("SELECT COUNT(p) FROM Product p JOIN p.category c WHERE p.isActive = true AND c.isActive = true");
        Map<String, Object> params = new HashMap<>();

        if (categoryId != null) {
            select.append(" AND c.id = :categoryId");
            count.append(" AND c.id = :categoryId");
            params.put("categoryId", categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            select.append(" AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR")
                    .append(" LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR")
                    .append(" LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR")
                    .append(" LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))");
            count.append(" AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR")
                    .append(" LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR")
                    .append(" LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR")
                    .append(" LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))");
            params.put("keyword", keyword);
        }
        if (minPrice != null) {
            select.append(" AND p.price >= :minPrice");
            count.append(" AND p.price >= :minPrice");
            params.put("minPrice", minPrice);
        }
        if (maxPrice != null) {
            select.append(" AND p.price <= :maxPrice");
            count.append(" AND p.price <= :maxPrice");
            params.put("maxPrice", maxPrice);
        }

        return executePagedQuery(select.toString(), count.toString(), params, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Product> findProductsWithAdvancedFilters(List<Long> categoryIds,
                                                         BigDecimal minPrice,
                                                         BigDecimal maxPrice,
                                                         Boolean inStock,
                                                         String search,
                                                         Pageable pageable) {
        StringBuilder select = new StringBuilder("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category c WHERE p.isActive = true AND c.isActive = true");
        StringBuilder count = new StringBuilder("SELECT COUNT(DISTINCT p) FROM Product p LEFT JOIN p.category c WHERE p.isActive = true AND c.isActive = true");
        Map<String, Object> params = new HashMap<>();

        if (categoryIds != null && !categoryIds.isEmpty()) {
            select.append(" AND c.id IN :categoryIds");
            count.append(" AND c.id IN :categoryIds");
            params.put("categoryIds", categoryIds);
        }
        if (minPrice != null) {
            select.append(" AND p.price >= :minPrice");
            count.append(" AND p.price >= :minPrice");
            params.put("minPrice", minPrice);
        }
        if (maxPrice != null) {
            select.append(" AND p.price <= :maxPrice");
            count.append(" AND p.price <= :maxPrice");
            params.put("maxPrice", maxPrice);
        }
        if (Boolean.TRUE.equals(inStock)) {
            select.append(" AND p.quantity > 0");
            count.append(" AND p.quantity > 0");
        }
        if (search != null && !search.isBlank()) {
            select.append(" AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR")
                    .append(" LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR")
                    .append(" LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))");
            count.append(" AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR")
                    .append(" LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR")
                    .append(" LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))");
            params.put("search", search);
        }

        return executePagedQuery(select.toString(), count.toString(), params, pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Product> findByIdWithImages(Long id) {
        String jpql = "SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id";
        TypedQuery<Product> query = entityManager.createQuery(jpql, Product.class);
        query.setParameter("id", id);
        try {
            return Optional.of(query.getSingleResult());
        } catch (NoResultException ex) {
            return Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public Page<Product> searchWithAttributes(List<Long> categoryIds,
                                              BigDecimal minPrice,
                                              BigDecimal maxPrice,
                                              Boolean inStock,
                                              String search,
                                              Map<String, List<String>> attrEquals,
                                              Map<String, Number> attrMin,
                                              Map<String, Number> attrMax,
                                              Pageable pageable) {
        StringBuilder base = new StringBuilder();
        base.append(" FROM products p JOIN categories c ON c.id = p.category_id ")
                .append(" WHERE p.is_active = true AND c.is_active = true ");

        Map<String, Object> params = new HashMap<>();

        if (categoryIds != null && !categoryIds.isEmpty()) {
            base.append(" AND c.id IN (:categoryIds) ");
            params.put("categoryIds", categoryIds);
        }
        if (minPrice != null) {
            base.append(" AND p.price >= :minPrice ");
            params.put("minPrice", minPrice);
        }
        if (maxPrice != null) {
            base.append(" AND p.price <= :maxPrice ");
            params.put("maxPrice", maxPrice);
        }
        if (Boolean.TRUE.equals(inStock)) {
            base.append(" AND p.quantity > 0 ");
        }
        if (search != null && !search.isBlank()) {
            base.append(" AND ( ")
                    .append(" LOWER(p.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR ")
                    .append(" LOWER(p.description) LIKE LOWER(CONCAT('%', :kw, '%')) OR ")
                    .append(" LOWER(c.name) LIKE LOWER(CONCAT('%', :kw, '%')) ")
                    .append(") ");
            params.put("kw", search);
        }

        if (attrEquals != null && !attrEquals.isEmpty()) {
            for (Map.Entry<String, List<String>> entry : attrEquals.entrySet()) {
                List<String> values = entry.getValue() == null
                        ? Collections.emptyList()
                        : entry.getValue().stream()
                        .filter(value -> value != null && !value.isBlank())
                        .distinct()
                        .collect(Collectors.toList());
                if (values.isEmpty()) {
                    continue;
                }
                String sanitized = sanitizeKey(entry.getKey());
                String paramName = "attr_eq_" + sanitized;
                base.append(" AND (p.attributes ->> :k_")
                        .append(sanitized)
                        .append(") IN (:")
                        .append(paramName)
                        .append(") ");
                params.put(paramName, values);
                params.put("k_" + sanitized, entry.getKey());
            }
        }

        if (attrMin != null && !attrMin.isEmpty()) {
            for (Map.Entry<String, Number> entry : attrMin.entrySet()) {
                String sanitized = sanitizeKey(entry.getKey());
                String paramName = "attr_min_" + sanitized;
                base.append(" AND (NULLIF(p.attributes ->> :kmin_")
                        .append(sanitized)
                        .append(", '') IS NULL OR CAST(p.attributes ->> :kmin_")
                        .append(sanitized)
                        .append(" AS NUMERIC) >= :")
                        .append(paramName)
                        .append(") ");
                params.put(paramName, entry.getValue());
                params.put("kmin_" + sanitized, entry.getKey());
            }
        }

        if (attrMax != null && !attrMax.isEmpty()) {
            for (Map.Entry<String, Number> entry : attrMax.entrySet()) {
                String sanitized = sanitizeKey(entry.getKey());
                String paramName = "attr_max_" + sanitized;
                base.append(" AND (NULLIF(p.attributes ->> :kmax_")
                        .append(sanitized)
                        .append(", '') IS NULL OR CAST(p.attributes ->> :kmax_")
                        .append(sanitized)
                        .append(" AS NUMERIC) <= :")
                        .append(paramName)
                        .append(") ");
                params.put(paramName, entry.getValue());
                params.put("kmax_" + sanitized, entry.getKey());
            }
        }

        String orderClause = buildNativeOrderClause(pageable);
        String sqlData = "SELECT p.*" + base + orderClause + " LIMIT :limit OFFSET :offset";
        String sqlCount = "SELECT COUNT(1)" + base;

        Query dataQuery = entityManager.createNativeQuery(sqlData, Product.class);
        Query countQuery = entityManager.createNativeQuery(sqlCount);

        bindNativeParameters(params, dataQuery);
        bindNativeParameters(params, countQuery);

        dataQuery.setParameter("limit", pageable.getPageSize());
        dataQuery.setParameter("offset", pageable.getOffset());

        @SuppressWarnings("unchecked")
        List<Product> result = dataQuery.getResultList();
        Number total = (Number) countQuery.getSingleResult();
        return new PageImpl<>(result, pageable, total.longValue());
    }

    private Page<Product> executePagedQuery(String select, String count, Map<String, Object> params, Pageable pageable) {
        return executePagedQuery(select, count, params, pageable, null);
    }

    private Page<Product> executePagedQuery(String select,
                                            String count,
                                            Map<String, Object> params,
                                            Pageable pageable,
                                            String defaultOrder) {
        String sortedSelect = applySorting(select, pageable, defaultOrder);
        TypedQuery<Product> dataQuery = entityManager.createQuery(sortedSelect, Product.class);
        params.forEach(dataQuery::setParameter);

        if (pageable != null && pageable.isPaged()) {
            dataQuery.setFirstResult((int) pageable.getOffset());
            dataQuery.setMaxResults(pageable.getPageSize());
        }

        TypedQuery<Long> countQuery = entityManager.createQuery(count, Long.class);
        params.forEach(countQuery::setParameter);

        long total = countQuery.getSingleResult();
        return new PageImpl<>(dataQuery.getResultList(), pageable, total);
    }

    private String applySorting(String query, Pageable pageable, String defaultOrder) {
        if (pageable != null && pageable.getSort().isSorted()) {
            return QueryUtils.applySorting(query, pageable.getSort(), DEFAULT_ALIAS);
        }
        if (query.toLowerCase(Locale.ROOT).contains("order by")) {
            return query;
        }
        if (defaultOrder != null && !defaultOrder.isBlank()) {
            return query + " ORDER BY " + defaultOrder;
        }
        return query + DEFAULT_ORDER;
    }

    private String buildNativeOrderClause(Pageable pageable) {
        if (pageable == null || pageable.getSort().isUnsorted()) {
            return " ORDER BY p.id ASC";
        }
        String sort = pageable.getSort().stream()
                .map(order -> "p." + toSnakeCase(order.getProperty()) + " " + order.getDirection().name())
                .collect(Collectors.joining(", "));
        return sort.isBlank() ? " ORDER BY p.id ASC" : " ORDER BY " + sort;
    }

    private String toSnakeCase(String value) {
        if (value == null || value.isBlank()) {
            return "id";
        }
        String snake = value.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase(Locale.ROOT);
        return snake.replaceAll("__+", "_");
    }

    private String sanitizeKey(String key) {
        if (key == null || key.isBlank()) {
            return "attr";
        }
        return key.replaceAll("[^a-zA-Z0-9_]+", "_");
    }

    private void bindNativeParameters(Map<String, Object> params, Query query) {
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Collection<?>) {
                query.setParameter(entry.getKey(), value);
            } else {
                query.setParameter(entry.getKey(), value);
            }
        }
    }
}
