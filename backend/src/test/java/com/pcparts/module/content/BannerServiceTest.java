package com.pcparts.module.content;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.content.dto.BannerDto;
import com.pcparts.module.content.dto.BannerOrderRequest;
import com.pcparts.module.content.entity.Banner;
import com.pcparts.module.content.repository.BannerRepository;
import com.pcparts.module.content.service.BannerService;
import com.pcparts.module.product.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for BannerService according to UC-AD-11.
 */
@ExtendWith(MockitoExtension.class)
class BannerServiceTest {

    @Mock private BannerRepository bannerRepository;
    @Mock private FileService fileService;

    @InjectMocks
    private BannerService bannerService;

    private Banner banner;
    private MockMultipartFile validImage;

    @BeforeEach
    void setUp() {
        banner = Banner.builder()
                .id(1L)
                .title("Sale GPU tháng này")
                .imageUrl("http://localhost:9000/pcparts/banners/gpu.webp")
                .linkUrl("/products?category=gpu")
                .sortOrder(1)
                .status("ACTIVE")
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .build();

        validImage = new MockMultipartFile(
                "image",
                "banner.webp",
                "image/webp",
                "fake-image".getBytes()
        );
    }

    @Test
    @DisplayName("List active banners — returns only active effective banners ordered by sort")
    void listActiveBanners() {
        when(bannerRepository.findActiveBanners(any(LocalDateTime.class))).thenReturn(List.of(banner));

        List<BannerDto> result = bannerService.getActiveBanners();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Sale GPU tháng này");
        verify(bannerRepository).findActiveBanners(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Create banner — uploads image and saves metadata")
    void createBanner_success() {
        when(fileService.uploadFile(validImage, "banners"))
                .thenReturn("http://localhost:9000/pcparts/banners/new.webp");
        when(bannerRepository.save(any(Banner.class))).thenAnswer(invocation -> {
            Banner saved = invocation.getArgument(0);
            saved.setId(2L);
            return saved;
        });

        BannerDto result = bannerService.createBanner(
                "Build PC sale",
                validImage,
                "/build-pc",
                2,
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(10),
                "active"
        );

        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getImageUrl()).contains("/banners/new.webp");
        verify(fileService).uploadFile(validImage, "banners");
        verify(bannerRepository).save(any(Banner.class));
    }

    @Test
    @DisplayName("Create banner — blank title is rejected")
    void createBanner_blankTitle() {
        assertThatThrownBy(() -> bannerService.createBanner(
                " ",
                validImage,
                "/products",
                1,
                null,
                null,
                "ACTIVE"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tiêu đề");
    }

    @Test
    @DisplayName("Create banner — missing image is rejected")
    void createBanner_missingImage() {
        assertThatThrownBy(() -> bannerService.createBanner(
                "Sale RAM",
                null,
                "/products",
                1,
                null,
                null,
                "ACTIVE"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Hình ảnh");
    }

    @Test
    @DisplayName("Create banner — invalid image type is rejected")
    void createBanner_invalidImageType() {
        MockMultipartFile gif = new MockMultipartFile("image", "banner.gif", "image/gif", "gif".getBytes());

        assertThatThrownBy(() -> bannerService.createBanner(
                "Sale RAM",
                gif,
                "/products",
                1,
                null,
                null,
                "ACTIVE"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("JPG, PNG, WEBP");
    }

    @Test
    @DisplayName("Create banner — image larger than 5MB is rejected")
    void createBanner_tooLargeImage() {
        MockMultipartFile large = new MockMultipartFile(
                "image",
                "banner.png",
                "image/png",
                new byte[5 * 1024 * 1024 + 1]
        );

        assertThatThrownBy(() -> bannerService.createBanner(
                "Sale RAM",
                large,
                "/products",
                1,
                null,
                null,
                "ACTIVE"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("5MB");
    }

    @Test
    @DisplayName("Create banner — end date before start date is rejected")
    void createBanner_invalidDateRange() {
        LocalDateTime start = LocalDateTime.now().plusDays(2);
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        assertThatThrownBy(() -> bannerService.createBanner(
                "Sale RAM",
                validImage,
                "/products",
                1,
                start,
                end,
                "ACTIVE"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ngày kết thúc");
    }

    @Test
    @DisplayName("Update banner — keeps existing image when no new image is provided")
    void updateBanner_withoutImage() {
        when(bannerRepository.findById(1L)).thenReturn(Optional.of(banner));
        when(bannerRepository.save(any(Banner.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BannerDto result = bannerService.updateBanner(
                1L,
                "Sale GPU cập nhật",
                null,
                "/products?category=vga",
                3,
                null,
                null,
                "INACTIVE"
        );

        assertThat(result.getTitle()).isEqualTo("Sale GPU cập nhật");
        assertThat(result.getImageUrl()).isEqualTo("http://localhost:9000/pcparts/banners/gpu.webp");
        assertThat(result.getStatus()).isEqualTo("INACTIVE");
    }

    @Test
    @DisplayName("Delete banner — not found throws")
    void deleteBanner_notFound() {
        when(bannerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bannerService.deleteBanner(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Reorder banners — updates sort order for each id")
    void reorderBanners_success() {
        Banner second = Banner.builder().id(2L).title("Build PC").imageUrl("url").sortOrder(2).status("ACTIVE").build();
        when(bannerRepository.findAllById(List.of(2L, 1L))).thenReturn(List.of(second, banner));
        when(bannerRepository.saveAll(any())).thenReturn(List.of(banner, second));
        when(bannerRepository.findAllByOrderBySortOrderAscCreatedAtDesc()).thenReturn(List.of(second, banner));

        List<BannerDto> result = bannerService.reorderBanners(List.of(
                new BannerOrderRequest(2L, 1),
                new BannerOrderRequest(1L, 2)
        ));

        assertThat(second.getSortOrder()).isEqualTo(1);
        assertThat(banner.getSortOrder()).isEqualTo(2);
        assertThat(result).extracting(BannerDto::getId).containsExactly(2L, 1L);
    }
}
