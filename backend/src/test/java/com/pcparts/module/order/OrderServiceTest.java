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
import com.pcparts.module.order.dto.CreateOrderRequest;
import com.pcparts.module.order.dto.OrderDto;
import com.pcparts.module.order.service.OrderMapper;
import com.pcparts.module.order.service.OrderService;
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
    @Mock private com.pcparts.module.order.repository.ShippingRepository shippingRepository;
    @Mock private com.pcparts.module.order.repository.CouponUsageRepository couponUsageRepository;
    @Mock private OrderMapper orderMapper;

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
        testAddress = Address.builder()
                .id(10L)
                .user(testUser)
                .receiverName("Test")
                .receiverPhone("0901111111")
                .province("Hà Nội")
                .district("Cầu Giấy")
                .ward("Dịch Vọng")
                .street("123 ABC")
                .build();
        testProduct = Product.builder().id(100L).name("Intel i7").sellingPrice(new BigDecimal("9990000")).build();
        testCart = Cart.builder().id(50L).user(testUser).build();
        testCartItem = CartItem.builder().id(1L).cart(testCart).product(testProduct).quantity(2).build();
        testOrder = Order.builder().id(200L).user(testUser).address(testAddress).subtotal(new BigDecimal("19980000"))
                .discountAmount(BigDecimal.ZERO).totalAmount(new BigDecimal("19980000")).status("PENDING")
                .createdAt(LocalDateTime.now()).build();

        // Stub orderMapper.toDto to build a minimal DTO from the Order argument
        lenient().when(orderMapper.toDto(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            List<OrderDto.OrderDetailDto> items = orderDetailRepository.findByOrderId(o.getId()).stream()
                    .map(d -> OrderDto.OrderDetailDto.builder()
                            .id(d.getId()).productId(d.getProduct().getId())
                            .productName(d.getProduct().getName())
                            .quantity(d.getQuantity()).unitPrice(d.getUnitPrice())
                            .lineTotal(d.getLineTotal()).build())
                    .collect(java.util.stream.Collectors.toList());
            return OrderDto.builder()
                    .id(o.getId()).status(o.getStatus())
                    .subtotal(o.getSubtotal()).discountAmount(o.getDiscountAmount())
                    .totalAmount(o.getTotalAmount()).itemCount(items.size())
                    .items(items).build();
        });
    }

    // === CREATE ORDER ===
    @Test
    @DisplayName("Create order — success without coupon")
    void createOrder_success() {
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(10L).note("Ship nhanh").paymentMethod("COD").build();
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
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
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(10L).paymentMethod("COD").build();
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of());

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("trống");
    }

    @Test
    @DisplayName("Create order — no cart throws")
    void createOrder_noCart() {
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(10L).paymentMethod("COD").build();
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
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
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(10L).couponCode("SAVE10").paymentMethod("COD").build();

        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
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
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(10L).couponCode("FAKE").paymentMethod("COD").build();
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(50L)).thenReturn(List.of(testCartItem));
        when(couponRepository.findByCode("FAKE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("TC-ORD-ADDR-01: Create order — address not owned by current user")
    void createOrder_addressNotOwnedByCurrentUserThrowsNotFound() {
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(99L).paymentMethod("COD").build();
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy địa chỉ giao hàng");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("TC-ORD-ADDR-02: Create order — address outside supported shipping area")
    void createOrder_addressOutsideSupportedAreaThrows() {
        Address unsupportedAddress = Address.builder()
                .id(20L)
                .user(testUser)
                .receiverName("Test")
                .receiverPhone("0901111111")
                .province("Hồ Chí Minh")
                .district("Quận 1")
                .ward("Bến Nghé")
                .street("1 ABC")
                .build();
        CreateOrderRequest req = CreateOrderRequest.builder().addressId(20L).paymentMethod("COD").build();
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(unsupportedAddress));

        assertThatThrownBy(() -> orderService.createOrder(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ngoài vùng giao hàng");

        verify(orderRepository, never()).save(any(Order.class));
    }

    // === GET ORDER ===
    @Test
    @DisplayName("Get order by ID — success for owner")
    void getOrderById_success() {
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));
        when(orderDetailRepository.findByOrderId(200L)).thenReturn(List.of());

        OrderDto result = orderService.getOrderById(200L, 1L);

        assertThat(result.getId()).isEqualTo(200L);
    }

    @Test
    @DisplayName("Get order by ID — not owner throws forbidden")
    void getOrderById_notOwner() {
        UserProfile otherUser = UserProfile.builder().id(99L).build();
        when(userProfileRepository.findByAccountId(99L)).thenReturn(Optional.of(otherUser));
        when(orderRepository.findById(200L)).thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderService.getOrderById(200L, 99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không có quyền");
    }

    @Test
    @DisplayName("Get order by ID — not found throws")
    void getOrderById_notFound() {
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === GET MY ORDERS ===
    @Test
    @DisplayName("Get my orders — returns paginated list")
    void getMyOrders_success() {
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
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
    @DisplayName("Update status — SHIPPING to COMPLETED succeeds")
    void updateStatus_completed_exportsStock() {
        Order shippingOrder = Order.builder().id(300L).user(testUser).address(testAddress)
                .subtotal(new BigDecimal("19980000")).discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("19980000")).status("SHIPPING")
                .createdAt(LocalDateTime.now()).build();
        when(orderRepository.findById(300L)).thenReturn(Optional.of(shippingOrder));
        when(orderRepository.save(any())).thenReturn(shippingOrder);
        when(orderDetailRepository.findByOrderId(300L)).thenReturn(List.of());
        when(statusHistoryRepository.save(any())).thenReturn(null);

        OrderDto result = orderService.updateStatus(300L, "COMPLETED", "1");

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
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
