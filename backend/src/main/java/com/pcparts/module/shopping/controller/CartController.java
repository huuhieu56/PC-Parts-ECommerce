package com.pcparts.module.shopping.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.shopping.dto.CartDto;
import com.pcparts.module.shopping.dto.CartItemRequest;
import com.pcparts.module.shopping.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for cart operations.
 * Supports guest (session-based) and authenticated carts.
 */
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Gets the current cart.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Long accountId = getAccountId(auth);
        CartDto cart = cartService.getCart(accountId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Giỏ hàng", cart));
    }

    /**
     * Adds an item to the cart.
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDto>> addItem(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @Valid @RequestBody CartItemRequest request) {
        Long accountId = getAccountId(auth);
        CartDto cart = cartService.addItem(accountId, sessionId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sản phẩm vào giỏ hàng", cart));
    }

    /**
     * Updates item quantity.
     */
    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartDto>> updateItem(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        Long accountId = getAccountId(auth);
        CartDto cart = cartService.updateItem(accountId, sessionId, productId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật số lượng", cart));
    }

    /**
     * Removes an item from the cart.
     */
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartDto>> removeItem(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable Long productId) {
        Long accountId = getAccountId(auth);
        CartDto cart = cartService.removeItem(accountId, sessionId, productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi giỏ hàng", cart));
    }

    /**
     * Clears the entire cart.
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Long accountId = getAccountId(auth);
        cartService.clearCart(accountId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa giỏ hàng", null));
    }

    /**
     * Merges guest cart into customer cart (called after login).
     */
    @PostMapping("/merge")
    public ResponseEntity<ApiResponse<CartDto>> mergeCart(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id") String sessionId) {
        Long accountId = getAccountId(auth);
        if (accountId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Cần đăng nhập để ghép giỏ hàng"));
        }
        CartDto cart = cartService.mergeCart(accountId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Đã ghép giỏ hàng", cart));
    }

    private Long getAccountId(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return Long.parseLong(auth.getName());
        }
        return null;
    }
}
