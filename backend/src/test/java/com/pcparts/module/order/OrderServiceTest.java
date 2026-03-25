package com.pcparts.module.order;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Address;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.AddressRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.inventory.service.InventoryService;
import com.pcparts.module.order.entity.*;
import com.pcparts.module.order.repository.*;
import com.pcparts.module.order.service.OrderService;
import com.pcparts.module.order.service.OrderService.*;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.shopping.entity.Cart;
import com.pcparts.module.shopping.entity.CartItem;
import com.pcparts.module.shopping.repository.CartItemRepository;
import com.pcparts.module.shopping.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderDetailRepository orderDetailRepository;
    @Mock private OrderStatusHistoryRepository statusHistoryRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private InventoryService inventoryService;

    @InjectMocks
    private OrderService orderService;

    private UserProfile testUser;
    private Address testAddress;
    private Product testProduct;
    private Cart testCart;
    private CartItem testCartItem;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        Role role = Role.builder().id(4L).name("CUSTOMER").build();
        Account account = Account.builder().id(1L).email("test@test.com").role(role).build();
        testUser = UserProfile.builder().id(1L).account(account).fullName("Test").phone("0901111111").build();
        testAddress = Address.builder().id(10L).user(testUser).province("HCM").district("Q1").build();
        testProduct = Product.builder().id(100L).name("Intel i7").sellingPrice(new BigDecimal("9990000")).build();
        testCart = Cart.builder().id(50L).user(testUser).build();
        testCartItem = CartItem.builder().id(1L).cart(testCart).product(testProduct).quantity(2).build();
        testOrder = Order.builder().id(200L).user(testUser).address(testAddress).subtotal(new BigDecimal("19980000"))
                .discountAmount(BigDecimal.ZERO).totalAmount(new BigDecimal("19980000")).status("PENDING")
                .createdAt(LocalDateTime.now()).build();
    }

    // === CREATE ORDER ===
    @Test
    @DisplayName("Create order — success without coupon")
    void createOrder_success() {
        CreateOrderRequest req = new CreateOrderRequest(10L, "Ship nhanh", null, "COD");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(testCartItem));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0); o.setId(200L); o.setCreatedAt(LocalDateTime.now()); return o;
        });
        when(paymentRepository.save(any(Payment.class))).thenReturn(null);
        when(statusHistoryRepository.save(any(OrderStatusHistory.class))).thenReturn(null);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of(
                OrderDetail.builder().id(1L).product(testProduct).quantity(2)
                        .unitPrice(new BigDecimal("9990000")).lineTotal(new BigDecimal("19980000")).build()
        ));

        OrderDto result = orderService.createOrder(1L, req);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getItems()).hasSize(1);
        verify(inventoryService).reserveStock(100L, 2);
        verify(cartItemRepository).deleteByCartId(50L);
    }

    @Test
    @DisplayName("Create order — empty cart throws")
    void createOrder_emptyCart() {
        CreateOrderRequest req = new CreateOrderRequest(10L, null, null, "COD");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of());

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("trống");
    }

    @Test
    @DisplayName("Create order — no cart throws")
    void createOrder_noCart() {
        CreateOrderRequest req = new CreateOrderRequest(10L, null, null, "COD");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("Create order — with valid coupon applies discount")
    void createOrder_withCoupon() {
        Coupon coupon = Coupon.builder().id(5L).code("SAVE10").discountType("PERCENTAGE")
                .discountValue(new BigDecimal("10")).minOrderValue(new BigDecimal("100000"))
                .maxDiscount(new BigDecimal("2000000")).maxUses(100).usedCount(0)
                .startDate(LocalDateTime.now().minusDays(1)).endDate(LocalDateTime.now().plusDays(30)).build();
        CreateOrderRequest req = new CreateOrderRequest(10L, null, "SAVE10", "COD");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(testCartItem));
        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any(Coupon.class))).thenReturn(coupon);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0); o.setId(201L); o.setCreatedAt(LocalDateTime.now()); return o;
        });
        when(paymentRepository.save(any())).thenReturn(null);
        when(statusHistoryRepository.save(any())).thenReturn(null);
        when(orderDetailRepository.findByOrderId(201L)).thenReturn(List.of());

        OrderDto result = orderService.createOrder(1L, req);

        assertThat(result).isNotNull();
        assertThat(coupon.getUsedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Create order — invalid coupon code throws")
    void createOrder_invalidCoupon() {
        CreateOrderRequest req = new CreateOrderRequest(10L, null, "FAKE", "COD");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(testCartItem));
        when(couponRepository.findByCode("FAKE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không hợp lệ");
    }

    // === GET ORDER ===
    @Test
    @DisplayName("Get order by ID — success for owner")
    void getOrderById_success() {
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of());

        OrderDto result = orderService.getOrderById(200L, 1L);

        assertThat(result.getId()).isEqualTo(200L);
    }

    @Test
    @DisplayName("Get order by ID — not owner throws forbidden")
    void getOrderById_notOwner() {
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderService.getOrderById(200L, 99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không có quyền");
    }

    @Test
    @DisplayName("Get order by ID — not found throws")
    void getOrderById_notFound() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === GET MY ORDERS ===
    @Test
    @DisplayName("Get my orders — returns paginated list")
    void getMyOrders_success() {
        Page<Order> page = new PageImpl<>(List.of(testOrder));
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class))).thenReturn(page);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of());

        var result = orderService.getMyOrders(1L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    // === UPDATE STATUS ===
    @Test
    @DisplayName("Update status — success")
    void updateStatus_success() {
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of());
        when(statusHistoryRepository.save(any())).thenReturn(null);

        OrderDto result = orderService.updateStatus(200L, "CONFIRMED", "1");

        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    @DisplayName("Update status — CANCELLED releases stock")
    void updateStatus_cancelled_releasesStock() {
        OrderDetail detail = OrderDetail.builder().product(testProduct).quantity(2).build();
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any())).thenReturn(testOrder);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of(detail));
        when(statusHistoryRepository.save(any())).thenReturn(null);

        orderService.updateStatus(200L, "CANCELLED", "1");

        verify(inventoryService).releaseStock(100L, 2);
    }

    @Test
    @DisplayName("Update status — COMPLETED exports stock")
    void updateStatus_completed_exportsStock() {
        OrderDetail detail = OrderDetail.builder().product(testProduct).quantity(2).build();
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any())).thenReturn(testOrder);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of(detail));
        when(statusHistoryRepository.save(any())).thenReturn(null);

        orderService.updateStatus(200L, "COMPLETED", "1");

        verify(inventoryService).exportStock(eq(100L), eq(2), anyString(), eq("1"));
    }

    @Test
    @DisplayName("Update status — order not found throws")
    void updateStatus_notFound() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.updateStatus(999L, "CONFIRMED", "1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === GET ALL ORDERS (admin) ===
    @Test
    @DisplayName("Get all orders — with status filter")
    void getAllOrders_withStatusFilter() {
        Page<Order> page = new PageImpl<>(List.of(testOrder));
        when(orderRepository.findByStatusOrderByCreatedAtDesc(eq("PENDING"), any(Pageable.class))).thenReturn(page);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of());

        var result = orderService.getAllOrders("PENDING", 0, 20);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("Get all orders — without status filter")
    void getAllOrders_noFilter() {
        Page<Order> page = new PageImpl<>(List.of(testOrder));
        when(orderRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of());

        var result = orderService.getAllOrders(null, 0, 20);

        assertThat(result.getContent()).hasSize(1);
    }
}
