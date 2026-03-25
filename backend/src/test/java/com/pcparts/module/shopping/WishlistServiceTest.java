package com.pcparts.module.shopping;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.shopping.entity.Wishlist;
import com.pcparts.module.shopping.repository.WishlistRepository;
import com.pcparts.module.shopping.service.WishlistService;
import com.pcparts.module.shopping.service.WishlistService.WishlistItemDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock private WishlistRepository wishlistRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserProfileRepository userProfileRepository;

    @InjectMocks
    private WishlistService wishlistService;

    private UserProfile testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder().id(1L).fullName("Test").phone("0901111111").build();
        testProduct = Product.builder().id(10L).name("GPU RTX 4090").slug("gpu-rtx-4090")
                .sellingPrice(new BigDecimal("45000000")).status("ACTIVE").build();
    }

    @Test
    @DisplayName("Get wishlist — returns items")
    void getWishlist_returnsItems() {
        Wishlist w = Wishlist.builder().id(1L).user(testUser).product(testProduct).build();
        when(wishlistRepository.findByUserId(1L)).thenReturn(List.of(w));

        List<WishlistItemDto> result = wishlistService.getWishlist(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProductName()).isEqualTo("GPU RTX 4090");
        assertThat(result.get(0).getSellingPrice()).isEqualByComparingTo(new BigDecimal("45000000"));
    }

    @Test
    @DisplayName("Add to wishlist — success")
    void addToWishlist_success() {
        when(wishlistRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(false);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));

        wishlistService.addToWishlist(1L, 10L);

        verify(wishlistRepository).save(any(Wishlist.class));
    }

    @Test
    @DisplayName("Add to wishlist — duplicate throws conflict")
    void addToWishlist_duplicate() {
        when(wishlistRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(true);

        assertThatThrownBy(() -> wishlistService.addToWishlist(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã có trong danh sách yêu thích");
    }

    @Test
    @DisplayName("Remove from wishlist — success")
    void removeFromWishlist_success() {
        Wishlist w = Wishlist.builder().id(1L).user(testUser).product(testProduct).build();
        when(wishlistRepository.findByUserIdAndProductId(1L, 10L)).thenReturn(Optional.of(w));

        wishlistService.removeFromWishlist(1L, 10L);

        verify(wishlistRepository).delete(w);
    }

    @Test
    @DisplayName("Remove from wishlist — not found throws exception")
    void removeFromWishlist_notFound() {
        when(wishlistRepository.findByUserIdAndProductId(1L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.removeFromWishlist(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
