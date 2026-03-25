package com.pcparts.module.shopping.service;

import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.entity.ProductImage;
import com.pcparts.module.product.repository.ProductImageRepository;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.shopping.dto.CartDto;
import com.pcparts.module.shopping.dto.CartItemDto;
import com.pcparts.module.shopping.dto.CartItemRequest;
import com.pcparts.module.shopping.entity.Cart;
import com.pcparts.module.shopping.entity.CartItem;
import com.pcparts.module.shopping.repository.CartItemRepository;
import com.pcparts.module.shopping.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for cart operations with guest/customer merge.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public CartDto getCart(Long userId, String sessionId) {
        Cart cart = findOrCreateCart(userId, sessionId);
        return toDto(cart);
    }

    @Transactional
    public CartDto addItem(Long userId, String sessionId, CartItemRequest request) {
        Cart cart = findOrCreateCart(userId, sessionId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            cartItemRepository.save(CartItem.builder().cart(cart).product(product).quantity(request.getQuantity()).build());
        }
        return toDto(cart);
    }

    @Transactional
    public CartDto updateItem(Long userId, String sessionId, Long productId, Integer quantity) {
        Cart cart = findOrCreateCart(userId, sessionId);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "productId", productId));
        if (quantity <= 0) { cartItemRepository.delete(item); } else { item.setQuantity(quantity); cartItemRepository.save(item); }
        return toDto(cart);
    }

    @Transactional
    public CartDto removeItem(Long userId, String sessionId, Long productId) {
        Cart cart = findOrCreateCart(userId, sessionId);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "productId", productId));
        cartItemRepository.delete(item);
        return toDto(cart);
    }

    @Transactional
    public void clearCart(Long userId, String sessionId) {
        Cart cart = findOrCreateCart(userId, sessionId);
        cartItemRepository.deleteByCartId(cart.getId());
    }

    @Transactional
    public CartDto mergeCart(Long userId, String sessionId) {
        Optional<Cart> guestCartOpt = cartRepository.findBySessionId(sessionId);
        if (guestCartOpt.isEmpty()) return getCart(userId, null);

        Cart guestCart = guestCartOpt.get();
        Cart customerCart = findOrCreateCart(userId, null);

        for (CartItem guestItem : cartItemRepository.findByCartId(guestCart.getId())) {
            Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(customerCart.getId(), guestItem.getProduct().getId());
            if (existing.isPresent()) {
                existing.get().setQuantity(existing.get().getQuantity() + guestItem.getQuantity());
                cartItemRepository.save(existing.get());
            } else {
                cartItemRepository.save(CartItem.builder().cart(customerCart).product(guestItem.getProduct()).quantity(guestItem.getQuantity()).build());
            }
        }
        cartItemRepository.deleteByCartId(guestCart.getId());
        cartRepository.delete(guestCart);
        return toDto(customerCart);
    }

    private Cart findOrCreateCart(Long userId, String sessionId) {
        if (userId != null) {
            return cartRepository.findByUserId(userId).orElseGet(() -> {
                UserProfile user = userProfileRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));
                return cartRepository.save(Cart.builder().user(user).build());
            });
        }
        if (sessionId != null) {
            return cartRepository.findBySessionId(sessionId).orElseGet(() ->
                    cartRepository.save(Cart.builder().sessionId(sessionId).build()));
        }
        throw new IllegalArgumentException("userId hoặc sessionId phải có giá trị");
    }

    private CartDto toDto(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        List<CartItemDto> itemDtos = items.stream().map(this::toItemDto).collect(Collectors.toList());
        BigDecimal total = itemDtos.stream().map(CartItemDto::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return CartDto.builder().id(cart.getId()).items(itemDtos).totalAmount(total).totalItems(itemDtos.size()).build();
    }

    private CartItemDto toItemDto(CartItem item) {
        Product p = item.getProduct();
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(p.getId());
        String img = images.stream().filter(ProductImage::getIsPrimary).findFirst().map(ProductImage::getImageUrl)
                .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());
        return CartItemDto.builder().id(item.getId()).productId(p.getId()).productName(p.getName())
                .productImage(img).sellingPrice(p.getSellingPrice()).quantity(item.getQuantity())
                .lineTotal(p.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity()))).build();
    }
}
