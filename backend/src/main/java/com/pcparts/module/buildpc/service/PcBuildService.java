package com.pcparts.module.buildpc.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.buildpc.entity.PcBuild;
import com.pcparts.module.buildpc.entity.PcBuildComponent;
import com.pcparts.module.buildpc.repository.PcBuildComponentRepository;
import com.pcparts.module.buildpc.repository.PcBuildRepository;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.shopping.entity.Cart;
import com.pcparts.module.shopping.entity.CartItem;
import com.pcparts.module.shopping.repository.CartItemRepository;
import com.pcparts.module.shopping.repository.CartRepository;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for PC Build configuration — allows users to assemble components.
 * Guests use sessionId, customers use userId.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PcBuildService {

    private final PcBuildRepository buildRepository;
    private final PcBuildComponentRepository componentRepository;
    private final ProductRepository productRepository;
    private final UserProfileRepository userProfileRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    /**
     * Valid PC component slot types.
     */
    public static final List<String> SLOT_TYPES = Arrays.asList(
            "CPU", "MAINBOARD", "RAM", "GPU", "SSD", "HDD", "PSU", "CASE", "COOLER", "FAN", "MONITOR"
    );

    /**
     * Gets available slot types for PC building.
     */
    public List<String> getSlotTypes() {
        return SLOT_TYPES;
    }

    /**
     * Creates a new PC build configuration.
     */
    @Transactional
    public PcBuildDto createBuild(Long userId, String sessionId, String name) {
        PcBuild build = PcBuild.builder()
                .name(name != null ? name : "Cấu hình mới")
                .build();

        if (userId != null) {
            UserProfile user = userProfileRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));
            build.setUser(user);
        } else if (sessionId != null) {
            build.setSessionId(sessionId);
        } else {
            throw new BusinessException("Cần userId hoặc sessionId", HttpStatus.BAD_REQUEST);
        }

        build = buildRepository.save(build);
        return toDto(build);
    }

    /**
     * Gets all builds for a user or session.
     */
    @Transactional(readOnly = true)
    public List<PcBuildDto> getBuilds(Long userId, String sessionId) {
        List<PcBuild> builds;
        if (userId != null) {
            builds = buildRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else if (sessionId != null) {
            builds = buildRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        } else {
            throw new BusinessException("Cần userId hoặc sessionId", HttpStatus.BAD_REQUEST);
        }
        return builds.stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Gets a specific build by ID with ownership check.
     */
    @Transactional(readOnly = true)
    public PcBuildDto getBuild(Long buildId, Long userId, String sessionId) {
        PcBuild build = findBuildWithOwnership(buildId, userId, sessionId);
        return toDto(build);
    }

    /**
     * Adds or replaces a component in a specific slot.
     * If the slot already has a component, it gets replaced.
     */
    @Transactional
    public PcBuildDto addComponent(Long buildId, Long userId, String sessionId,
                                   String slotType, Long productId, int quantity) {
        validateSlotType(slotType);
        PcBuild build = findBuildWithOwnership(buildId, userId, sessionId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        // Remove existing component in this slot
        componentRepository.findByBuildIdAndSlotType(buildId, slotType)
                .ifPresent(existing -> {
                    build.getComponents().remove(existing);
                    componentRepository.delete(existing);
                });

        // Add new component
        PcBuildComponent component = PcBuildComponent.builder()
                .build(build)
                .slotType(slotType)
                .product(product)
                .quantity(quantity)
                .unitPrice(product.getSellingPrice())
                .build();
        componentRepository.save(component);
        build.getComponents().add(component);

        recalculateTotal(build);
        return toDto(build);
    }

    /**
     * Removes a component from a specific slot.
     */
    @Transactional
    public PcBuildDto removeComponent(Long buildId, Long userId, String sessionId, String slotType) {
        PcBuild build = findBuildWithOwnership(buildId, userId, sessionId);

        PcBuildComponent component = componentRepository.findByBuildIdAndSlotType(buildId, slotType)
                .orElseThrow(() -> new ResourceNotFoundException("PcBuildComponent", "slotType", slotType));

        build.getComponents().remove(component);
        componentRepository.delete(component);
        recalculateTotal(build);
        return toDto(build);
    }

    /**
     * Adds all build components to the user's shopping cart.
     * Requires authentication (userId).
     */
    @Transactional
    public void addBuildToCart(Long buildId, Long userId) {
        if (userId == null) {
            throw new BusinessException("Cần đăng nhập để thêm cấu hình vào giỏ hàng", HttpStatus.UNAUTHORIZED);
        }

        PcBuild build = buildRepository.findByIdAndUserId(buildId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PcBuild", "id", buildId));
        List<PcBuildComponent> components = componentRepository.findByBuildId(buildId);

        if (components.isEmpty()) {
            throw new BusinessException("Cấu hình chưa có linh kiện", HttpStatus.BAD_REQUEST);
        }

        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));

        // Get or create cart
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });

        // Add each component as a cart item
        for (PcBuildComponent comp : components) {
            CartItem existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), comp.getProduct().getId())
                    .orElse(null);
            if (existing != null) {
                existing.setQuantity(existing.getQuantity() + comp.getQuantity());
                cartItemRepository.save(existing);
            } else {
                CartItem item = CartItem.builder()
                        .cart(cart)
                        .product(comp.getProduct())
                        .quantity(comp.getQuantity())
                        .build();
                cartItemRepository.save(item);
            }
        }

        // Mark build as ordered
        build.setStatus("ORDERED");
        buildRepository.save(build);
        log.info("Build {} added to cart for user {}", buildId, userId);
    }

    /**
     * Deletes a build configuration.
     */
    @Transactional
    public void deleteBuild(Long buildId, Long userId, String sessionId) {
        PcBuild build = findBuildWithOwnership(buildId, userId, sessionId);
        buildRepository.delete(build);
    }

    // === Private helpers ===

    private PcBuild findBuildWithOwnership(Long buildId, Long userId, String sessionId) {
        if (userId != null) {
            return buildRepository.findByIdAndUserId(buildId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("PcBuild", "id", buildId));
        } else if (sessionId != null) {
            return buildRepository.findByIdAndSessionId(buildId, sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("PcBuild", "id", buildId));
        }
        throw new BusinessException("Cần userId hoặc sessionId", HttpStatus.BAD_REQUEST);
    }

    private void recalculateTotal(PcBuild build) {
        BigDecimal total = componentRepository.findByBuildId(build.getId()).stream()
                .map(c -> c.getUnitPrice().multiply(BigDecimal.valueOf(c.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        build.setTotalPrice(total);
        buildRepository.save(build);
    }

    private void validateSlotType(String slotType) {
        if (!SLOT_TYPES.contains(slotType.toUpperCase())) {
            throw new BusinessException("Loại slot không hợp lệ: " + slotType +
                    ". Các loại hợp lệ: " + String.join(", ", SLOT_TYPES), HttpStatus.BAD_REQUEST);
        }
    }

    PcBuildDto toDto(PcBuild build) {
        List<PcBuildComponentDto> componentDtos = componentRepository.findByBuildId(build.getId()).stream()
                .map(c -> PcBuildComponentDto.builder()
                        .id(c.getId())
                        .slotType(c.getSlotType())
                        .productId(c.getProduct().getId())
                        .productName(c.getProduct().getName())
                        .quantity(c.getQuantity())
                        .unitPrice(c.getUnitPrice())
                        .lineTotal(c.getUnitPrice().multiply(BigDecimal.valueOf(c.getQuantity())))
                        .build())
                .collect(Collectors.toList());

        return PcBuildDto.builder()
                .id(build.getId())
                .name(build.getName())
                .totalPrice(build.getTotalPrice())
                .status(build.getStatus())
                .components(componentDtos)
                .createdAt(build.getCreatedAt() != null ? build.getCreatedAt().toString() : null)
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PcBuildDto {
        private Long id;
        private String name;
        private BigDecimal totalPrice;
        private String status;
        private List<PcBuildComponentDto> components;
        private String createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PcBuildComponentDto {
        private Long id;
        private String slotType;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AddComponentRequest {
        private String slotType;
        private Long productId;
        private Integer quantity;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CreateBuildRequest {
        private String name;
    }
}
