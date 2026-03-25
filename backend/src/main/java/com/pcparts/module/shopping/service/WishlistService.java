package com.pcparts.module.shopping.service;


import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.shopping.entity.Wishlist;
import com.pcparts.module.shopping.repository.WishlistRepository;
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public List<WishlistItemDto> getWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId).stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Adds product to wishlist, or removes it if already exists (toggle behavior — BUG-16 fix).
     */
    @Transactional
    public void addToWishlist(Long userId, Long productId) {
        // BUG-16 fix: toggle instead of throw
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return;
        }
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        wishlistRepository.save(Wishlist.builder().user(user).product(product).build());
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        Wishlist w = wishlistRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist", "productId", productId));
        wishlistRepository.delete(w);
    }

    private WishlistItemDto toDto(Wishlist w) {
        Product p = w.getProduct();
        return WishlistItemDto.builder().productId(p.getId()).productName(p.getName())
                .sellingPrice(p.getSellingPrice()).slug(p.getSlug()).status(p.getStatus()).build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WishlistItemDto {
        private Long productId;
        private String productName;
        private BigDecimal sellingPrice;
        private String slug;
        private String status;
    }
}
