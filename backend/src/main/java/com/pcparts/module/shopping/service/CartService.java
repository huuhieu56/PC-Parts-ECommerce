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
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
     * Returns a message if quantity was capped due to stock limits.
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

        String message = null;
        if (requestedTotal > availableQty) {
            if (availableQty <= currentQtyInCart) {
                throw new BusinessException("Sản phẩm " + product.getName() + " đã hết hàng hoặc đã đạt giới hạn tồn kho",
                        HttpStatus.BAD_REQUEST);
            }
            // Cap at max available
            requestedTotal = availableQty;
            message = "Chỉ còn " + availableQty + " sản phẩm trong kho, đã điều chỉnh số lượng";
        }

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(requestedTotal);
            cartItemRepository.save(item);
        } else {
            cartItemRepository.save(CartItem.builder()
                    .cart(cart).product(product).quantity(requestedTotal).build());
        }
        CartDto dto = toDto(cart);
        dto.setMessage(message);
        return dto;
    }

    @Transactional
    public CartDto updateItem(Long userId, String sessionId, Long productId, Integer quantity) {
        Cart cart = findOrCreateCart(userId, sessionId);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "productId", productId));
        String message = null;
        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            // BUG-08 fix: cap quantity at available inventory
            int availableQty = getAvailableQuantity(productId);
            if (quantity > availableQty) {
                quantity = availableQty;
                message = "Chỉ còn " + availableQty + " sản phẩm trong kho, đã điều chỉnh số lượng";
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        CartDto dto = toDto(cart);
        dto.setMessage(message);
        return dto;
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

        List<CartItem> guestItems = cartItemRepository.findByCartId(guestCart.getId());

        // Batch-fetch inventory for all guest products (Issue #5 fix)
        Set<Long> guestProductIds = guestItems.stream()
                .map(gi -> gi.getProduct().getId())
                .collect(Collectors.toSet());
        Map<Long, Integer> inventoryMap = buildInventoryMap(guestProductIds);

        for (CartItem guestItem : guestItems) {
            Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(
                    customerCart.getId(), guestItem.getProduct().getId());

            // BUG-09 fix: cap merged quantity at available inventory
            int availableQty = inventoryMap.getOrDefault(guestItem.getProduct().getId(), 0);

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

    /**
     * Batch-fetches inventory for multiple products into a productId → quantity map.
     */
    private Map<Long, Integer> buildInventoryMap(Set<Long> productIds) {
        if (productIds.isEmpty()) return Map.of();
        return inventoryRepository.findByProductIdIn(productIds).stream()
                .collect(Collectors.toMap(
                        inv -> inv.getProduct().getId(),
                        Inventory::getQuantity
                ));
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

        // Batch-fetch all product images in one query (Issue #2 fix)
        Set<Long> productIds = items.stream()
                .map(i -> i.getProduct().getId())
                .collect(Collectors.toSet());
        Map<Long, List<ProductImage>> imagesByProduct = productIds.isEmpty()
                ? Map.of()
                : productImageRepository.findByProductIdInOrderBySortOrderAsc(productIds).stream()
                        .collect(Collectors.groupingBy(img -> img.getProduct().getId()));

        List<CartItemDto> itemDtos = items.stream()
                .map(item -> toItemDto(item, imagesByProduct.getOrDefault(item.getProduct().getId(), List.of())))
                .collect(Collectors.toList());
        BigDecimal total = itemDtos.stream().map(CartItemDto::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return CartDto.builder()
                .id(cart.getId())
                .items(itemDtos)
                .totalAmount(total)
                .totalItems(itemDtos.size())
                .build();
    }

    private CartItemDto toItemDto(CartItem item, List<ProductImage> images) {
        Product p = item.getProduct();
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

