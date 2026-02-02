package com.computershop.service.interfaces;

import com.computershop.dto.request.CartItemRequest;
import com.computershop.dto.request.GuestCartMergeRequest;
import com.computershop.dto.response.CartResponse;

public interface CartService {


    CartResponse getCartByUserId(Long userId);


    CartResponse addItemToCart(Long userId, CartItemRequest request);


    CartResponse updateCartItem(Long userId, Long cartItemId, Integer quantity);


    CartResponse removeItemFromCart(Long userId, Long cartItemId);


    void clearCart(Long userId);


    CartResponse mergeGuestCart(Long userId, GuestCartMergeRequest request);
}