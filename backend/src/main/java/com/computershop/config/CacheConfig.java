package com.computershop.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

// CẤU HÌNH CACHE
// Sử dụng Caffeine (in-memory cache) để tối ưu hiệu năng:
// - products: Cache danh sách và chi tiết sản phẩm (TTL: 10 phút)
// - categories: Cache danh mục sản phẩm (TTL: 30 phút)
// - promotions: Cache khuyến mãi (TTL: 5 phút)
// - productSearch: Cache kết quả tìm kiếm (TTL: 5 phút)
@Configuration
@EnableCaching
public class CacheConfig {

    // Cấu hình Caffeine cache manager với nhiều cache khác nhau
    // Mỗi cache có TTL và giới hạn kích thước riêng
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "products",           // Cache cho danh sách products (getProductsByCategory, getProductsWithFiltersAndAttributes)
                "productDetail",      // Cache cho chi tiết product (getProductById)
                "productSearch",      // Cache cho search results
                "categories",         // Cache cho categories
                "promotions",         // Cache cho promotions
                "activePromotions"    // Cache cho active promotions only
        );

        // Cấu hình cache mặc định
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)                      // Giới hạn 1000 bản ghi cho mỗi cache
                .expireAfterWrite(10, TimeUnit.MINUTES) // TTL 10 phút
                .recordStats());                        // Bật thống kê để hỗ trợ giám sát

        return cacheManager;
    }

    // Cấu hình cache cho categories (TTL dài hơn vì ít thay đổi)
    @Bean("categoriesCache")
    public Caffeine<Object, Object> categoriesCacheConfig() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(30, TimeUnit.MINUTES)  // Categories ít thay đổi
                .recordStats();
    }

    // Cấu hình cache cho promotions (TTL ngắn hơn vì thay đổi thường xuyên)
    @Bean("promotionsCache")
    public Caffeine<Object, Object> promotionsCacheConfig() {
        return Caffeine.newBuilder()
                .maximumSize(200)
                .expireAfterWrite(5, TimeUnit.MINUTES)   // Promotions cần dữ liệu mới thường xuyên
                .recordStats();
    }

    // Cấu hình cache cho search results (TTL ngắn, size lớn)
    @Bean("searchCache")
    public Caffeine<Object, Object> searchCacheConfig() {
        return Caffeine.newBuilder()
                .maximumSize(2000)                       // Search queries nhiều
                .expireAfterWrite(5, TimeUnit.MINUTES)   // Search results cần update thường xuyên
                .recordStats();
    }
}
