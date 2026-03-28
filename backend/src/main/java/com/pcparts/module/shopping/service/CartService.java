package com.pcparts.module.shopping.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.inventory.entity.Inventory;
import com.pcparts.module.inventory.repository.InventoryRepository;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for cart operations with guest/customer merge.
 * BUG-08 fix: checks inventory when adding items.
 * BUG-09 fix: merge respects inventory limits.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserProfileRepository userProfileRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional
    public CartDto getCart(Long userId, String sessionId) {
        Cart cart = findOrCreateCart(userId, sessionId);
        return toDto(cart);
    }

    /**
     * Adds an item to cart with inventory check (BUG-08 fix).
     */
    @Transactional
    public CartDto addItem(Long userId, String sessionId, CartItemRequest request) {
        Cart cart = findOrCreateCart(userId, sessionId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        // BUG-08 fix: check inventory availability
        int availableQty = getAvailableQuantity(product.getId());
        Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        int currentQtyInCart = existing.map(CartItem::getQuantity).orElse(0);
        int requestedTotal = currentQtyInCart + request.getQuantity();

        if (requestedTotal > availableQty) {
            if (availableQty <= currentQtyInCart) {
                throw new BusinessException("Sản phẩm " + product.getName() + " đã hết hàng hoặc đã đạt giới hạn tồn kho",
                        HttpStatus.BAD_REQUEST);
            }
            // Cap at max available
            requestedTotal = availableQty;
        }

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(requestedTotal);
            cartItemRepository.save(item);
        } else {
            cartItemRepository.save(CartItem.builder()
                    .cart(cart).product(product).quantity(requestedTotal).build());
        }
        return toDto(cart);
    }

    @Transactional
    public CartDto updateItem(Long userId, String sessionId, Long productId, Integer quantity) {
        Cart cart = findOrCreateCart(userId, sessionId);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "productId", productId));
        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            // BUG-08 fix: cap quantity at available inventory
            int availableQty = getAvailableQuantity(productId);
            if (quantity > availableQty) {
                quantity = availableQty;
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
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

    /**
     * Merges guest session cart into customer's cart (BUG-09 fix: respects inventory limits).
     */
    @Transactional
    public CartDto mergeCart(Long userId, String sessionId) {
        Optional<Cart> guestCartOpt = cartRepository.findBySessionId(sessionId);
        if (guestCartOpt.isEmpty()) return getCart(userId, null);

        Cart guestCart = guestCartOpt.get();
        Cart customerCart = findOrCreateCart(userId, null);

        for (CartItem guestItem : cartItemRepository.findByCartId(guestCart.getId())) {
            Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(
                    customerCart.getId(), guestItem.getProduct().getId());

            // BUG-09 fix: cap merged quantity at available inventory
            int availableQty = getAvailableQuantity(guestItem.getProduct().getId());

            if (existing.isPresent()) {
                int mergedQty = existing.get().getQuantity() + guestItem.getQuantity();
                if (mergedQty > availableQty) {
                    mergedQty = availableQty;
                }
                existing.get().setQuantity(mergedQty);
                cartItemRepository.save(existing.get());
            } else {
                int qty = Math.min(guestItem.getQuantity(), availableQty);
                cartItemRepository.save(CartItem.builder()
                        .cart(customerCart)
                        .product(guestItem.getProduct())
                        .quantity(qty)
                        .build());
            }
        }
        cartItemRepository.deleteByCartId(guestCart.getId());
        cartRepository.delete(guestCart);
        return toDto(customerCart);
    }

    /**
     * Gets available inventory quantity for a product.
     * Returns 0 if no inventory record exists.
     */
    private int getAvailableQuantity(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .map(Inventory::getQuantity)
                .orElse(0);
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
        throw new BusinessException("userId hoặc sessionId phải có giá trị", HttpStatus.BAD_REQUEST);
    }

    private CartDto toDto(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        List<CartItemDto> itemDtos = items.stream().map(this::toItemDto).collect(Collectors.toList());
        BigDecimal total = itemDtos.stream().map(CartItemDto::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return CartDto.builder()
                .id(cart.getId())
                .items(itemDtos)
                .totalAmount(total)
                .totalItems(itemDtos.size())
                .build();
    }

    private CartItemDto toItemDto(CartItem item) {
        Product p = item.getProduct();
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(p.getId());
        String img = images.stream().filter(ProductImage::getIsPrimary).findFirst().map(ProductImage::getImageUrl)
                .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());
        return CartItemDto.builder()
                .id(item.getId())
                .productId(p.getId())
                .productName(p.getName())
                .productImage(img)
                .sellingPrice(p.getSellingPrice())
                .quantity(item.getQuantity())
                .lineTotal(p.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
}
