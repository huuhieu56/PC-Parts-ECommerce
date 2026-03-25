package com.pcparts.module.product.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.product.dto.BrandDto;
import com.pcparts.module.product.entity.Brand;
import com.pcparts.module.product.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for brand CRUD.
 */
@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;

    /**
     * Gets all brands.
     */
    @Transactional(readOnly = true)
    public List<BrandDto> getAllBrands() {
        return brandRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Gets a brand by ID.
     */
    @Transactional(readOnly = true)
    public BrandDto getById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", id));
        return toDto(brand);
    }

    /**
     * Creates a new brand.
     */
    @Transactional
    public BrandDto createBrand(BrandDto dto) {
        if (brandRepository.existsByName(dto.getName())) {
            throw new BusinessException("Thương hiệu đã tồn tại", HttpStatus.CONFLICT);
        }
        Brand brand = Brand.builder()
                .name(dto.getName())
                .logoUrl(dto.getLogoUrl())
                .description(dto.getDescription())
                .build();
        brand = brandRepository.save(brand);
        return toDto(brand);
    }

    /**
     * Updates an existing brand.
     */
    @Transactional
    public BrandDto updateBrand(Long id, BrandDto dto) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", id));
        brand.setName(dto.getName());
        brand.setLogoUrl(dto.getLogoUrl());
        brand.setDescription(dto.getDescription());
        brand = brandRepository.save(brand);
        return toDto(brand);
    }

    /**
     * Deletes a brand.
     */
    @Transactional
    public void deleteBrand(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", id));
        brandRepository.delete(brand);
    }

    private BrandDto toDto(Brand brand) {
        return BrandDto.builder()
                .id(brand.getId())
                .name(brand.getName())
                .logoUrl(brand.getLogoUrl())
                .description(brand.getDescription())
                .build();
    }
}
