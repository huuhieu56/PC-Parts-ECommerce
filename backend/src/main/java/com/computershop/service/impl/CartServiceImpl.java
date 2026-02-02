package com.computershop.service.impl;

import com.computershop.dto.request.CartItemRequest;
import com.computershop.dto.request.GuestCartMergeRequest;
import com.computershop.dto.response.CartResponse;
import com.computershop.entity.Cart;
import com.computershop.entity.CartItem;
import com.computershop.entity.Product;
import com.computershop.entity.User;
import com.computershop.repository.CartItemRepository;
import com.computershop.repository.CartRepository;
import com.computershop.repository.ProductRepository;
import com.computershop.repository.UserRepository;
import com.computershop.service.interfaces.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public CartResponse getCartByUserId(Long userId) {
        Cart cart = getOrCreateCartWithItems(userId);
        return CartResponse.fromEntity(cart);
    }

    @Override
    public CartResponse addItemToCart(Long userId, CartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + request.getProductId()));

        if (!product.getIsActive()) {
            throw new RuntimeException("Sản phẩm hiện không hoạt động");
        }

        if (product.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Số lượng trong kho không đủ cho sản phẩm: " + product.getName());
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItem.isPresent()) {
            // Cập nhật số lượng nếu sản phẩm đã có trong giỏ
            CartItem cartItem = existingItem.get();
            int newQuantity = cartItem.getQuantity() + request.getQuantity();

            if (product.getQuantity() < newQuantity) {
                throw new RuntimeException("Số lượng trong kho không đủ cho sản phẩm: " + product.getName());
            }

            cartItem.setQuantity(newQuantity);
            cartItemRepository.save(cartItem);
        } else {
            CartItem cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(cartItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        cart = cartRepository.findByIdWithItems(cart.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng sau khi lưu"));

        return CartResponse.fromEntity(cart);
    }

    @Override
    public CartResponse updateCartItem(Long userId, Long cartItemId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục giỏ hàng với id: " + cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Mục giỏ hàng không thuộc về người dùng này");
        }

        if (quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        Product product = cartItem.getProduct();
        if (product.getQuantity() < quantity) {
            throw new RuntimeException("Không đủ hàng cho sản phẩm: " + product.getName());
        }

        cartItem.setQuantity(quantity);
        cartItem.setUpdatedAt(LocalDateTime.now());
        cartItemRepository.save(cartItem);

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        // Refresh cart với cart items để return data mới nhất
        cart = cartRepository.findByIdWithItems(cart.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng sau khi cập nhật"));

        return CartResponse.fromEntity(cart);
    }

    @Override
    public CartResponse removeItemFromCart(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục giỏ hàng với id: " + cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Mục giỏ hàng không thuộc về người dùng này");
        }


        cartItemRepository.delete(cartItem);

        try {
            cart.getCartItems().removeIf(ci -> ci.getId().equals(cartItemId));
        } catch (Exception ex) {
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        // Refresh cart với cart items để return data mới nhất
        cart = cartRepository.findByIdWithItems(cart.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng sau khi xóa"));

        return CartResponse.fromEntity(cart);
    }

    @Override
    public void clearCart(Long userId) {
        getCustomerUser(userId);
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng cho người dùng: " + userId));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        cartItemRepository.deleteAll(cartItems);

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    @Override
    public CartResponse mergeGuestCart(Long userId, GuestCartMergeRequest request) {
        Cart userCart = getOrCreateCart(userId);

        for (GuestCartMergeRequest.GuestCartItem guestItem : request.getGuestCartItems()) {
            Product product = productRepository.findById(guestItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + guestItem.getProductId()));

            if (!product.getIsActive()) {
                continue;
            }


            Optional<CartItem> existingItem = userCart.getCartItems().stream()
                    .filter(item -> item.getProduct().getId().equals(guestItem.getProductId()))
                    .findFirst();

            if (existingItem.isPresent()) {
                CartItem cartItem = existingItem.get();
                int newQuantity = cartItem.getQuantity() + guestItem.getQuantity();

                // Check stock availability
                if (product.getQuantity() >= newQuantity) {
                    cartItem.setQuantity(newQuantity);
                    cartItem.setUpdatedAt(LocalDateTime.now());
                    cartItemRepository.save(cartItem);
                }
            } else {
                if (product.getQuantity() >= guestItem.getQuantity()) {
                    CartItem newCartItem = CartItem.builder()
                            .cart(userCart)
                            .product(product)
                            .quantity(guestItem.getQuantity())
                            .build();
                    cartItemRepository.save(newCartItem);
                    userCart.getCartItems().add(newCartItem);
                }
            }
        }

        userCart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(userCart);

        return CartResponse.fromEntity(userCart);
    }

    private Cart getOrCreateCart(Long userId) {
        User user = getCustomerUser(userId);

        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private Cart getOrCreateCartWithItems(Long userId) {
        User user = getCustomerUser(userId);

        return cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private User getCustomerUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));

        if (user.getRole() == null || user.getRole().getName() == null ||
                !"CUSTOMER".equalsIgnoreCase(user.getRole().getName())) {
            throw new AccessDeniedException("Chỉ khách hàng mới được phép sử dụng giỏ hàng");
        }

        return user;
    }
}
