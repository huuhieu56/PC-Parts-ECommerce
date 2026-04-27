package com.pcparts.module.content.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.content.dto.BannerDto;
import com.pcparts.module.content.dto.BannerOrderRequest;
import com.pcparts.module.content.entity.Banner;
import com.pcparts.module.content.repository.BannerRepository;
import com.pcparts.module.product.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
<<<<<<< HEAD
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
=======
>>>>>>> 8094214 (feat: add homepage banner management)
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
<<<<<<< HEAD
import java.util.concurrent.atomic.AtomicBoolean;
=======
>>>>>>> 8094214 (feat: add homepage banner management)
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for UC-AD-11 homepage banner/slider management.
 */
@Service
@RequiredArgsConstructor
public class BannerService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "INACTIVE");

    private final BannerRepository bannerRepository;
    private final FileService fileService;

    /**
     * Returns active banners currently eligible for homepage display.
     */
    @Transactional(readOnly = true)
    public List<BannerDto> getActiveBanners() {
        return bannerRepository.findActiveBanners(LocalDateTime.now())
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Returns all banners for Admin CMS management.
     */
    @Transactional(readOnly = true)
    public List<BannerDto> getAllBanners() {
        return bannerRepository.findAllByOrderBySortOrderAscCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Creates a banner and uploads its image to MinIO.
     */
    @Transactional
    public BannerDto createBanner(
            String title,
            MultipartFile image,
            String linkUrl,
            Integer sortOrder,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String status) {
        validateTitle(title);
        validateRequiredImage(image);
        validateDateRange(startDate, endDate);

        String imageUrl = fileService.uploadFile(image, "banners");
<<<<<<< HEAD
        Runnable cleanupUploadedImage = registerRollbackCleanup(imageUrl);
=======
>>>>>>> 8094214 (feat: add homepage banner management)
        Banner banner = Banner.builder()
                .title(title.trim())
                .imageUrl(imageUrl)
                .linkUrl(blankToNull(linkUrl))
                .sortOrder(sortOrder == null ? 0 : sortOrder)
                .startDate(startDate)
                .endDate(endDate)
                .status(normalizeStatus(status))
                .build();

<<<<<<< HEAD
        try {
            return toDto(bannerRepository.save(banner));
        } catch (RuntimeException exception) {
            cleanupUploadedImage.run();
            throw exception;
        }
=======
        return toDto(bannerRepository.save(banner));
>>>>>>> 8094214 (feat: add homepage banner management)
    }

    /**
     * Updates banner metadata and optionally replaces its image.
     */
    @Transactional
    public BannerDto updateBanner(
            Long id,
            String title,
            MultipartFile image,
            String linkUrl,
            Integer sortOrder,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String status) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner", "id", id));

        validateTitle(title);
        validateOptionalImage(image);
        validateDateRange(startDate, endDate);

<<<<<<< HEAD
        String oldImageUrl = banner.getImageUrl();
        Runnable cleanupUploadedImage = () -> {};

        if (image != null && !image.isEmpty()) {
            String imageUrl = fileService.uploadFile(image, "banners");
            cleanupUploadedImage = registerRollbackCleanup(imageUrl);
            banner.setImageUrl(imageUrl);
=======
        if (image != null && !image.isEmpty()) {
            String oldImageUrl = banner.getImageUrl();
            String imageUrl = fileService.uploadFile(image, "banners");
            banner.setImageUrl(imageUrl);
            fileService.deleteFile(oldImageUrl);
>>>>>>> 8094214 (feat: add homepage banner management)
        }

        banner.setTitle(title.trim());
        banner.setLinkUrl(blankToNull(linkUrl));
        banner.setSortOrder(sortOrder == null ? 0 : sortOrder);
        banner.setStartDate(startDate);
        banner.setEndDate(endDate);
        banner.setStatus(normalizeStatus(status));

<<<<<<< HEAD
        try {
            Banner savedBanner = bannerRepository.save(banner);
            if (image != null && !image.isEmpty()) {
                runAfterCommit(() -> fileService.deleteFile(oldImageUrl));
            }
            return toDto(savedBanner);
        } catch (RuntimeException exception) {
            cleanupUploadedImage.run();
            throw exception;
        }
=======
        return toDto(bannerRepository.save(banner));
>>>>>>> 8094214 (feat: add homepage banner management)
    }

    /**
     * Deletes a banner and its stored image.
     */
    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner", "id", id));
<<<<<<< HEAD
        bannerRepository.delete(banner);
        runAfterCommit(() -> fileService.deleteFile(banner.getImageUrl()));
=======
        fileService.deleteFile(banner.getImageUrl());
        bannerRepository.delete(banner);
>>>>>>> 8094214 (feat: add homepage banner management)
    }

    /**
     * Updates display order for multiple banners.
     */
    @Transactional
    public List<BannerDto> reorderBanners(List<BannerOrderRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BusinessException("Danh sách sắp xếp không được để trống");
        }

        List<Long> ids = requests.stream().map(BannerOrderRequest::getId).toList();
        Map<Long, Banner> bannersById = bannerRepository.findAllById(ids)
                .stream()
                .collect(Collectors.toMap(Banner::getId, Function.identity()));

        for (BannerOrderRequest request : requests) {
            Banner banner = bannersById.get(request.getId());
            if (banner == null) {
                throw new ResourceNotFoundException("Banner", "id", request.getId());
            }
            banner.setSortOrder(request.getSortOrder());
        }

        bannerRepository.saveAll(bannersById.values());
        return getAllBanners();
    }

    private void validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new BusinessException("Tiêu đề banner không được để trống");
        }
    }

    private void validateRequiredImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BusinessException("Hình ảnh banner không được để trống");
        }
        validateImage(image);
    }

    private void validateOptionalImage(MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            validateImage(image);
        }
    }

    private void validateImage(MultipartFile image) {
        if (!ALLOWED_IMAGE_TYPES.contains(image.getContentType())) {
            throw new BusinessException("Chỉ chấp nhận ảnh JPG, PNG, WEBP");
        }
        if (image.getSize() > MAX_IMAGE_BYTES) {
            throw new BusinessException("Ảnh tối đa 5MB");
        }
    }

    private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("Ngày kết thúc phải sau ngày bắt đầu");
        }
    }

    private String normalizeStatus(String status) {
        String normalized = status == null || status.isBlank() ? "ACTIVE" : status.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new BusinessException("Trạng thái banner không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

<<<<<<< HEAD
    private Runnable registerRollbackCleanup(String imageUrl) {
        AtomicBoolean cleaned = new AtomicBoolean(false);
        Runnable cleanup = () -> {
            if (imageUrl != null && cleaned.compareAndSet(false, true)) {
                fileService.deleteFile(imageUrl);
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        cleanup.run();
                    }
                }
            });
        }

        return cleanup;
    }

    private void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

=======
>>>>>>> 8094214 (feat: add homepage banner management)
    private BannerDto toDto(Banner banner) {
        return BannerDto.builder()
                .id(banner.getId())
                .title(banner.getTitle())
                .imageUrl(banner.getImageUrl())
                .linkUrl(banner.getLinkUrl())
                .sortOrder(banner.getSortOrder())
                .status(banner.getStatus())
                .startDate(banner.getStartDate())
                .endDate(banner.getEndDate())
                .createdAt(banner.getCreatedAt())
                .updatedAt(banner.getUpdatedAt())
                .build();
    }
}
