package com.computershop.controller;

import com.computershop.dto.request.CartItemRequest;
import com.computershop.dto.request.GuestCartMergeRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.CartResponse;
import com.computershop.service.interfaces.CartService;
import com.computershop.util.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final JwtUtils jwtUtils;

    // Lấy giỏ hàng của người dùng hiện tại (userId lấy từ JWT)
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getUserCart() {
        Long userId = jwtUtils.getCurrentUserId();
        CartResponse cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy giỏ hàng thành công")
                .data(cart)
                .build());
    }

    // Thêm sản phẩm vào giỏ hàng của người dùng hiện tại
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItemToCart(
            @Valid @RequestBody CartItemRequest request) {
        Long userId = jwtUtils.getCurrentUserId();
        CartResponse cart = cartService.addItemToCart(userId, request);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Thêm sản phẩm vào giỏ hàng thành công")
                .data(cart)
                .build());
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng của người dùng hiện tại
    @PreAuthorize("hasRole('CUSTOMER')")
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        Long userId = jwtUtils.getCurrentUserId();
        CartResponse cart = cartService.updateCartItem(userId, itemId, quantity);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật giỏ hàng thành công")
                .data(cart)
                .build());
    }

    // Xóa sản phẩm khỏi giỏ hàng của người dùng hiện tại
    @PreAuthorize("hasRole('CUSTOMER')")
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItemFromCart(
            @PathVariable Long cartItemId) {
        Long userId = jwtUtils.getCurrentUserId();
        CartResponse cart = cartService.removeItemFromCart(userId, cartItemId);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa sản phẩm khỏi giỏ hàng thành công")
                .data(cart)
                .build());
    }

    // Xóa toàn bộ giỏ hàng của người dùng hiện tại
    @PreAuthorize("hasRole('CUSTOMER')")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        Long userId = jwtUtils.getCurrentUserId();
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa toàn bộ giỏ hàng thành công")
                .build());
    }

    // Hợp nhất giỏ hàng tạm của khách với giỏ hàng người dùng sau khi đăng nhập
    @PostMapping("/merge")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CartResponse>> mergeGuestCart(
            @Valid @RequestBody GuestCartMergeRequest request) {
        Long userId = jwtUtils.getCurrentUserId();

        CartResponse mergedCart = cartService.mergeGuestCart(userId, request);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Hợp nhất giỏ hàng thành công")
                .data(mergedCart)
                .build());
    }
}
