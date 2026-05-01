package com.pcparts.module.auth.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.common.constant.ValidationConstants;
import com.pcparts.module.auth.dto.AddressDto;
import com.pcparts.module.auth.entity.Address;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.AddressRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Service for managing user shipping addresses.
 */
@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Gets all addresses for the current user.
     */
    @Transactional(readOnly = true)
    public List<AddressDto> getAddresses(String accountId) {
        UserProfile user = getUserProfile(accountId);
        return addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new address.
     */
    @Transactional
    public AddressDto createAddress(String accountId, AddressDto dto) {
        UserProfile user = getUserProfile(accountId);
        validateShippingArea(dto);
        List<Address> existingAddresses = addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(user.getId());
        boolean shouldBeDefault = existingAddresses.isEmpty() || Boolean.TRUE.equals(dto.getIsDefault());

        Address address = Address.builder()
                .user(user)
                .label(dto.getLabel())
                .receiverName(dto.getReceiverName())
                .receiverPhone(dto.getReceiverPhone())
                .province(dto.getProvince())
                .district(dto.getDistrict())
                .ward(dto.getWard())
                .street(dto.getStreet())
                .isDefault(shouldBeDefault)
                .build();

        if (shouldBeDefault) {
            unsetDefaultAddresses(existingAddresses);
        }

        address = addressRepository.save(address);
        return toDto(address);
    }

    /**
     * Updates an existing address.
     */
    @Transactional
    public AddressDto updateAddress(String accountId, Long addressId, AddressDto dto) {
        UserProfile user = getUserProfile(accountId);
        Address address = findOwnedAddress(addressId, user.getId());
        validateShippingArea(dto);

        address.setLabel(dto.getLabel());
        address.setReceiverName(dto.getReceiverName());
        address.setReceiverPhone(dto.getReceiverPhone());
        address.setProvince(dto.getProvince());
        address.setDistrict(dto.getDistrict());
        address.setWard(dto.getWard());
        address.setStreet(dto.getStreet());

        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            unsetDefaultAddresses(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(user.getId()));
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return toDto(address);
    }

    /**
     * Deletes an address.
     */
    @Transactional
    public void deleteAddress(String accountId, Long addressId) {
        UserProfile user = getUserProfile(accountId);
        Address address = findOwnedAddress(addressId, user.getId());
        if (addressRepository.countByUserId(user.getId()) <= 1) {
            throw new BusinessException("Bạn cần tạo địa chỉ mới trước khi xóa");
        }

        addressRepository.delete(address);
    }

    /**
     * Sets an address as the user's default shipping address.
     */
    @Transactional
    public AddressDto setDefaultAddress(String accountId, Long addressId) {
        UserProfile user = getUserProfile(accountId);
        Address address = findOwnedAddress(addressId, user.getId());
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(user.getId());

        unsetDefaultAddresses(addresses);
        address.setIsDefault(true);
        address = addressRepository.save(address);
        return toDto(address);
    }

    private UserProfile getUserProfile(String accountId) {
        Long id = Long.parseLong(accountId);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        return userProfileRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", account.getId()));
    }

    private Address findOwnedAddress(Long addressId, Long userId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ"));
    }

    private void unsetDefaultAddresses(List<Address> addresses) {
        addresses
                .stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .forEach(a -> {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                });
    }

    private void validateShippingArea(AddressDto dto) {
        if (!ValidationConstants.SUPPORTED_PROVINCE.equals(dto.getProvince())) {
            throw new BusinessException("Địa chỉ nằm ngoài vùng giao hàng hỗ trợ");
        }

        if (!isSupportedHanoiDistrict(dto.getDistrict())) {
            throw new BusinessException("Địa chỉ nằm ngoài vùng giao hàng hỗ trợ");
        }
    }

    private boolean isSupportedHanoiDistrict(String district) {
        if (district == null) {
            return false;
        }
        String normalizedDistrict = normalizeDistrict(district);
        return ValidationConstants.HANOI_DISTRICTS.stream()
                .map(this::normalizeDistrict)
                .anyMatch(normalizedDistrict::equals);
    }

    private String normalizeDistrict(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replace("quận ", "")
                .replace("huyện ", "")
                .replace("thị xã ", "")
                .trim();
    }

    private AddressDto toDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .label(address.getLabel())
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getReceiverPhone())
                .province(address.getProvince())
                .district(address.getDistrict())
                .ward(address.getWard())
                .street(address.getStreet())
                .isDefault(address.getIsDefault())
                .build();
    }
}
