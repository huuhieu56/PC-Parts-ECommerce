package com.pcparts.module.product;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.product.dto.BrandDto;
import com.pcparts.module.product.entity.Brand;
import com.pcparts.module.product.repository.BrandRepository;
import com.pcparts.module.product.service.BrandService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BrandServiceTest {

    @Mock private BrandRepository brandRepository;

    @InjectMocks
    private BrandService brandService;

    private Brand testBrand;

    @BeforeEach
    void setUp() {
        testBrand = Brand.builder().id(1L).name("Intel").logoUrl("https://intel.com/logo.png")
                .description("Processor manufacturer").build();
    }

    // === GET ALL ===
    @Test
    @DisplayName("Get all brands — returns list")
    void getAllBrands_success() {
        Brand brand2 = Brand.builder().id(2L).name("AMD").build();
        when(brandRepository.findAll()).thenReturn(List.of(testBrand, brand2));

        List<BrandDto> result = brandService.getAllBrands();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Intel");
        assertThat(result.get(1).getName()).isEqualTo("AMD");
    }

    // === GET BY ID ===
    @Test
    @DisplayName("Get brand by ID — success")
    void getById_success() {
        when(brandRepository.findById(1L)).thenReturn(Optional.of(testBrand));

        BrandDto result = brandService.getById(1L);

        assertThat(result.getName()).isEqualTo("Intel");
        assertThat(result.getLogoUrl()).isEqualTo("https://intel.com/logo.png");
    }

    @Test
    @DisplayName("Get brand by ID — not found throws")
    void getById_notFound() {
        when(brandRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> brandService.getById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === CREATE ===
    @Test
    @DisplayName("Create brand — success")
    void createBrand_success() {
        BrandDto dto = BrandDto.builder().name("NVIDIA").logoUrl("https://nvidia.com/logo.png")
                .description("GPU manufacturer").build();
        when(brandRepository.existsByName("NVIDIA")).thenReturn(false);
        when(brandRepository.save(any(Brand.class))).thenAnswer(inv -> {
            Brand b = inv.getArgument(0); b.setId(3L); return b;
        });

        BrandDto result = brandService.createBrand(dto);

        assertThat(result.getName()).isEqualTo("NVIDIA");
        verify(brandRepository).save(any(Brand.class));
    }

    @Test
    @DisplayName("Create brand — duplicate name throws conflict")
    void createBrand_duplicate() {
        BrandDto dto = BrandDto.builder().name("Intel").build();
        when(brandRepository.existsByName("Intel")).thenReturn(true);

        assertThatThrownBy(() -> brandService.createBrand(dto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã tồn tại");
    }

    // === UPDATE ===
    @Test
    @DisplayName("Update brand — success")
    void updateBrand_success() {
        BrandDto dto = BrandDto.builder().name("Intel Corporation").logoUrl("https://new-logo.png")
                .description("Updated description").build();
        when(brandRepository.findById(1L)).thenReturn(Optional.of(testBrand));
        when(brandRepository.save(any(Brand.class))).thenReturn(testBrand);

        BrandDto result = brandService.updateBrand(1L, dto);

        assertThat(result.getName()).isEqualTo("Intel Corporation");
        verify(brandRepository).save(testBrand);
    }

    @Test
    @DisplayName("Update brand — not found throws")
    void updateBrand_notFound() {
        when(brandRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> brandService.updateBrand(999L, new BrandDto()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === DELETE ===
    @Test
    @DisplayName("Delete brand — success")
    void deleteBrand_success() {
        when(brandRepository.findById(1L)).thenReturn(Optional.of(testBrand));

        brandService.deleteBrand(1L);

        verify(brandRepository).delete(testBrand);
    }

    @Test
    @DisplayName("Delete brand — not found throws")
    void deleteBrand_notFound() {
        when(brandRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> brandService.deleteBrand(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
