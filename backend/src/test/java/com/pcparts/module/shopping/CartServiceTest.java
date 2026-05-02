package com.pcparts.module.shopping;

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
import com.pcparts.module.shopping.dto.CartItemRequest;
import com.pcparts.module.shopping.entity.Cart;
import com.pcparts.module.shopping.entity.CartItem;
import com.pcparts.module.shopping.repository.CartItemRepository;
import com.pcparts.module.shopping.repository.CartRepository;
import com.pcparts.module.shopping.service.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private InventoryRepository inventoryRepository;

    @InjectMocks
    private CartService cartService;

    private UserProfile testUser;
    private Product testProduct;
    private Cart testCart;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder().id(1L).fullName("Test User").phone("0901234567").build();
        testProduct = Product.builder().id(10L).name("Intel i7").sellingPrice(new BigDecimal("9990000")).status("ACTIVE").build();
        testCart = Cart.builder().id(100L).user(testUser).build();
        testInventory = Inventory.builder().id(1L).product(testProduct).quantity(100).build();
    }

    @Test
    @DisplayName("Get cart — creates new cart for user if none exists")
    void getCart_createsNewForUser() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        when(cartItemRepository.findByCartId(100L)).thenReturn(Collections.emptyList());

        CartDto result = cartService.getCart(1L, null);

        assertThat(result).isNotNull();
        assertThat(result.getTotalItems()).isEqualTo(0);
        assertThat(result.getTotalAmount()).isEqualTo(BigDecimal.ZERO);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("Get cart — creates new cart for guest session")
    void getCart_createsNewForGuest() {
        Cart guestCart = Cart.builder().id(200L).sessionId("sess-123").build();
        when(cartRepository.findBySessionId("sess-123")).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenReturn(guestCart);
        when(cartItemRepository.findByCartId(200L)).thenReturn(Collections.emptyList());

        CartDto result = cartService.getCart(null, "sess-123");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(200L);
    }

    @Test
    @DisplayName("Add item — adds new item to cart")
    void addItem_newItem() {
        CartItemRequest request = new CartItemRequest(10L, 2);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(inventoryRepository.findByProductId(10L)).thenReturn(Optional.of(testInventory));
        when(cartItemRepository.findByCartIdAndProductId(100L, 10L)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(CartItem.builder().id(1L).cart(testCart).product(testProduct).quantity(2).build());
        when(cartItemRepository.findByCartId(100L)).thenReturn(List.of(
                CartItem.builder().id(1L).cart(testCart).product(testProduct).quantity(2).build()
        ));
        when(productImageRepository.findByProductIdInOrderBySortOrderAsc(any())).thenReturn(Collections.emptyList());

        CartDto result = cartService.addItem(1L, null, request);

        assertThat(result.getTotalItems()).isEqualTo(1);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("19980000"));
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    @DisplayName("Add item — increments quantity for existing item")
    void addItem_existingItem() {
        CartItemRequest request = new CartItemRequest(10L, 3);
        CartItem existing = CartItem.builder().id(1L).cart(testCart).product(testProduct).quantity(2).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(inventoryRepository.findByProductId(10L)).thenReturn(Optional.of(testInventory));
        when(cartItemRepository.findByCartIdAndProductId(100L, 10L)).thenReturn(Optional.of(existing));
        when(cartItemRepository.save(existing)).thenReturn(existing);
        when(cartItemRepository.findByCartId(100L)).thenReturn(List.of(existing));
        when(productImageRepository.findByProductIdInOrderBySortOrderAsc(any())).thenReturn(Collections.emptyList());

        cartService.addItem(1L, null, request);

        assertThat(existing.getQuantity()).isEqualTo(5); // 2 + 3
    }

    @Test
    @DisplayName("Add item — throws when product not found")
    void addItem_productNotFound() {
        CartItemRequest request = new CartItemRequest(999L, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.addItem(1L, null, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Remove item — removes from cart")
    void removeItem_success() {
        CartItem item = CartItem.builder().id(1L).cart(testCart).product(testProduct).quantity(1).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdAndProductId(100L, 10L)).thenReturn(Optional.of(item));
        when(cartItemRepository.findByCartId(100L)).thenReturn(Collections.emptyList());

        CartDto result = cartService.removeItem(1L, null, 10L);

        assertThat(result.getTotalItems()).isEqualTo(0);
        verify(cartItemRepository).delete(item);
    }

    @Test
    @DisplayName("Clear cart — deletes all items")
    void clearCart_success() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));

        cartService.clearCart(1L, null);

        verify(cartItemRepository).deleteByCartId(100L);
    }

    @Test
    @DisplayName("Merge cart — merges guest items into customer cart")
    void mergeCart_success() {
        Cart guestCart = Cart.builder().id(200L).sessionId("sess-123").build();
        CartItem guestItem = CartItem.builder().id(50L).cart(guestCart).product(testProduct).quantity(3).build();

        when(cartRepository.findBySessionId("sess-123")).thenReturn(Optional.of(guestCart));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(200L)).thenReturn(List.of(guestItem));
        when(inventoryRepository.findByProductIdIn(any())).thenReturn(List.of(testInventory));
        when(cartItemRepository.findByCartIdAndProductId(100L, 10L)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cartItemRepository.findByCartId(100L)).thenReturn(List.of(
                CartItem.builder().id(99L).cart(testCart).product(testProduct).quantity(3).build()
        ));
        when(productImageRepository.findByProductIdInOrderBySortOrderAsc(any())).thenReturn(Collections.emptyList());

        CartDto result = cartService.mergeCart(1L, "sess-123");

        assertThat(result.getTotalItems()).isEqualTo(1);
        verify(cartItemRepository).deleteByCartId(200L);
        verify(cartRepository).delete(guestCart);
    }
}
