package com.pcparts.module.shopping.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.shopping.service.WishlistService;
import com.pcparts.module.shopping.service.WishlistService.WishlistItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for wishlist operations.
 */
@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * Gets the user's wishlist.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistItemDto>>> getWishlist(Authentication auth) {
        Long accountId = Long.parseLong(auth.getName());
        List<WishlistItemDto> items = wishlistService.getWishlist(accountId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách yêu thích", items));
    }

    /**
     * Adds a product to the wishlist.
     */
    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> addToWishlist(
            Authentication auth, @PathVariable Long productId) {
        Long accountId = Long.parseLong(auth.getName());
        wishlistService.addToWishlist(accountId, productId);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm vào danh sách yêu thích", null));
    }

    /**
     * Removes a product from the wishlist.
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            Authentication auth, @PathVariable Long productId) {
        Long accountId = Long.parseLong(auth.getName());
        wishlistService.removeFromWishlist(accountId, productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa khỏi danh sách yêu thích", null));
    }
}
