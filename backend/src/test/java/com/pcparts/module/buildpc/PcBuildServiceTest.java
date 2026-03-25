package com.pcparts.module.buildpc;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.buildpc.entity.PcBuild;
import com.pcparts.module.buildpc.entity.PcBuildComponent;
import com.pcparts.module.buildpc.repository.PcBuildComponentRepository;
import com.pcparts.module.buildpc.repository.PcBuildRepository;
import com.pcparts.module.buildpc.service.PcBuildService;
import com.pcparts.module.buildpc.service.PcBuildService.*;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PcBuildServiceTest {

    @Mock private PcBuildRepository buildRepository;
    @Mock private PcBuildComponentRepository componentRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;

    @InjectMocks
    private PcBuildService pcBuildService;

    private UserProfile testUser;
    private Product cpuProduct;
    private Product gpuProduct;
    private PcBuild testBuild;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder().id(1L).fullName("Test").build();
        cpuProduct = Product.builder().id(100L).name("Intel i9-14900K").sellingPrice(new BigDecimal("15990000")).build();
        gpuProduct = Product.builder().id(101L).name("RTX 4090").sellingPrice(new BigDecimal("45990000")).build();
        testBuild = PcBuild.builder().id(10L).user(testUser).name("Gaming PC")
                .totalPrice(BigDecimal.ZERO).status("DRAFT").components(new ArrayList<>())
                .createdAt(LocalDateTime.now()).build();
    }

    // === GET SLOT TYPES ===
    @Test
    @DisplayName("Get slot types — returns all valid slot types")
    void getSlotTypes() {
        List<String> slots = pcBuildService.getSlotTypes();
        assertThat(slots).contains("CPU", "MAINBOARD", "RAM", "GPU", "SSD", "PSU", "CASE");
    }

    // === CREATE BUILD ===
    @Test
    @DisplayName("Create build — authenticated user success")
    void createBuild_user_success() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(buildRepository.save(any(PcBuild.class))).thenAnswer(inv -> {
            PcBuild b = inv.getArgument(0); b.setId(10L); b.setCreatedAt(LocalDateTime.now()); return b;
        });
        when(componentRepository.findByBuildId(10L)).thenReturn(Collections.emptyList());

        PcBuildDto dto = pcBuildService.createBuild(1L, null, "Gaming PC");

        assertThat(dto.getName()).isEqualTo("Gaming PC");
        verify(buildRepository).save(any(PcBuild.class));
    }

    @Test
    @DisplayName("Create build — guest with sessionId success")
    void createBuild_guest_success() {
        when(buildRepository.save(any(PcBuild.class))).thenAnswer(inv -> {
            PcBuild b = inv.getArgument(0); b.setId(11L); b.setCreatedAt(LocalDateTime.now()); return b;
        });
        when(componentRepository.findByBuildId(11L)).thenReturn(Collections.emptyList());

        PcBuildDto dto = pcBuildService.createBuild(null, "session-123", null);

        assertThat(dto.getName()).isEqualTo("Cấu hình mới");
    }

    @Test
    @DisplayName("Create build — no userId or sessionId throws")
    void createBuild_noIdentity() {
        assertThatThrownBy(() -> pcBuildService.createBuild(null, null, "Test"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("userId hoặc sessionId");
    }

    // === GET BUILDS ===
    @Test
    @DisplayName("Get builds — user builds")
    void getBuilds_user() {
        when(buildRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testBuild));
        when(componentRepository.findByBuildId(10L)).thenReturn(Collections.emptyList());

        List<PcBuildDto> result = pcBuildService.getBuilds(1L, null);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("Get builds — session builds")
    void getBuilds_session() {
        PcBuild guestBuild = PcBuild.builder().id(20L).sessionId("s1").name("Guest PC")
                .totalPrice(BigDecimal.ZERO).components(new ArrayList<>())
                .createdAt(LocalDateTime.now()).build();
        when(buildRepository.findBySessionIdOrderByCreatedAtDesc("s1")).thenReturn(List.of(guestBuild));
        when(componentRepository.findByBuildId(20L)).thenReturn(Collections.emptyList());

        List<PcBuildDto> result = pcBuildService.getBuilds(null, "s1");
        assertThat(result).hasSize(1);
    }

    // === GET BUILD ===
    @Test
    @DisplayName("Get build — success for owner")
    void getBuild_success() {
        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(componentRepository.findByBuildId(10L)).thenReturn(Collections.emptyList());

        PcBuildDto result = pcBuildService.getBuild(10L, 1L, null);
        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("Get build — not found throws")
    void getBuild_notFound() {
        when(buildRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pcBuildService.getBuild(999L, 1L, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === ADD COMPONENT ===
    @Test
    @DisplayName("Add component — new slot success")
    void addComponent_newSlot() {
        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(productRepository.findById(100L)).thenReturn(Optional.of(cpuProduct));
        when(componentRepository.findByBuildIdAndSlotType(10L, "CPU")).thenReturn(Optional.empty());
        when(componentRepository.save(any(PcBuildComponent.class))).thenAnswer(inv -> {
            PcBuildComponent c = inv.getArgument(0); c.setId(1L); return c;
        });
        when(componentRepository.findByBuildId(10L)).thenReturn(List.of(
                PcBuildComponent.builder().id(1L).slotType("CPU").product(cpuProduct)
                        .quantity(1).unitPrice(new BigDecimal("15990000")).build()
        ));
        when(buildRepository.save(any(PcBuild.class))).thenReturn(testBuild);

        PcBuildDto result = pcBuildService.addComponent(10L, 1L, null, "CPU", 100L, 1);

        assertThat(result.getComponents()).hasSize(1);
        verify(componentRepository).save(any(PcBuildComponent.class));
    }

    @Test
    @DisplayName("Add component — replaces existing in same slot")
    void addComponent_replaceExisting() {
        PcBuildComponent existing = PcBuildComponent.builder().id(5L).build(testBuild)
                .slotType("CPU").product(cpuProduct).quantity(1).unitPrice(cpuProduct.getSellingPrice()).build();
        testBuild.getComponents().add(existing);

        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(productRepository.findById(100L)).thenReturn(Optional.of(cpuProduct));
        when(componentRepository.findByBuildIdAndSlotType(10L, "CPU")).thenReturn(Optional.of(existing));
        when(componentRepository.save(any(PcBuildComponent.class))).thenAnswer(inv -> {
            PcBuildComponent c = inv.getArgument(0); c.setId(6L); return c;
        });
        when(componentRepository.findByBuildId(10L)).thenReturn(Collections.emptyList());
        when(buildRepository.save(any(PcBuild.class))).thenReturn(testBuild);

        pcBuildService.addComponent(10L, 1L, null, "CPU", 100L, 1);

        verify(componentRepository).delete(existing); // old removed
        verify(componentRepository).save(any(PcBuildComponent.class)); // new added
    }

    @Test
    @DisplayName("Add component — invalid slot type throws")
    void addComponent_invalidSlot() {
        assertThatThrownBy(() -> pcBuildService.addComponent(10L, 1L, null, "INVALID_SLOT", 100L, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("slot không hợp lệ");
    }

    @Test
    @DisplayName("Add component — product not found throws")
    void addComponent_productNotFound() {
        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pcBuildService.addComponent(10L, 1L, null, "CPU", 999L, 1))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === REMOVE COMPONENT ===
    @Test
    @DisplayName("Remove component — success")
    void removeComponent_success() {
        PcBuildComponent comp = PcBuildComponent.builder().id(1L).build(testBuild).slotType("GPU")
                .product(gpuProduct).quantity(1).unitPrice(gpuProduct.getSellingPrice()).build();
        testBuild.getComponents().add(comp);

        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(componentRepository.findByBuildIdAndSlotType(10L, "GPU")).thenReturn(Optional.of(comp));
        when(componentRepository.findByBuildId(10L)).thenReturn(Collections.emptyList());
        when(buildRepository.save(any(PcBuild.class))).thenReturn(testBuild);

        PcBuildDto result = pcBuildService.removeComponent(10L, 1L, null, "GPU");

        verify(componentRepository).delete(comp);
    }

    @Test
    @DisplayName("Remove component — slot not found throws")
    void removeComponent_slotNotFound() {
        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(componentRepository.findByBuildIdAndSlotType(10L, "GPU")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pcBuildService.removeComponent(10L, 1L, null, "GPU"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === ADD BUILD TO CART ===
    @Test
    @DisplayName("Add build to cart — success")
    void addBuildToCart_success() {
        Product mbProduct = Product.builder().id(102L).name("ASUS Z790").sellingPrice(new BigDecimal("8990000")).build();
        PcBuildComponent cpuComp = PcBuildComponent.builder().id(1L).build(testBuild).slotType("CPU")
                .product(cpuProduct).quantity(1).unitPrice(cpuProduct.getSellingPrice()).build();
        PcBuildComponent mbComp = PcBuildComponent.builder().id(2L).build(testBuild).slotType("MAINBOARD")
                .product(mbProduct).quantity(1).unitPrice(mbProduct.getSellingPrice()).build();
        Cart cart = Cart.builder().id(50L).user(testUser).build();

        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(componentRepository.findByBuildId(10L)).thenReturn(List.of(cpuComp, mbComp));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndProductId(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(null);
        when(buildRepository.save(any(PcBuild.class))).thenReturn(testBuild);

        pcBuildService.addBuildToCart(10L, 1L);

        assertThat(testBuild.getStatus()).isEqualTo("ORDERED");
        verify(cartItemRepository, times(2)).save(any(CartItem.class));
    }

    @Test
    @DisplayName("Add build to cart — not authenticated throws")
    void addBuildToCart_notAuthenticated() {
        assertThatThrownBy(() -> pcBuildService.addBuildToCart(10L, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đăng nhập");
    }

    @Test
    @DisplayName("Add build to cart — empty build throws")
    void addBuildToCart_emptyBuild() {
        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));
        when(componentRepository.findByBuildId(10L)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> pcBuildService.addBuildToCart(10L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("chưa có linh kiện");
    }

    // === DELETE BUILD ===
    @Test
    @DisplayName("Delete build — success")
    void deleteBuild_success() {
        when(buildRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBuild));

        pcBuildService.deleteBuild(10L, 1L, null);

        verify(buildRepository).delete(testBuild);
    }

    @Test
    @DisplayName("Delete build — not found throws")
    void deleteBuild_notFound() {
        when(buildRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pcBuildService.deleteBuild(999L, 1L, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
