package com.pcparts.module.auth.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
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
    public List<AddressDto> getAddresses(String email) {
        UserProfile user = getUserProfile(email);
        return addressRepository.findByUserIdOrderByIsDefaultDesc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new address.
     */
    @Transactional
    public AddressDto createAddress(String email, AddressDto dto) {
        UserProfile user = getUserProfile(email);

        Address address = Address.builder()
                .user(user)
                .label(dto.getLabel())
                .receiverName(dto.getReceiverName())
                .receiverPhone(dto.getReceiverPhone())
                .province(dto.getProvince())
                .district(dto.getDistrict())
                .ward(dto.getWard())
                .street(dto.getStreet())
                .isDefault(dto.getIsDefault() != null && dto.getIsDefault())
                .build();

        // If this is default, unset other defaults
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            unsetDefaultAddresses(user.getId());
        }

        address = addressRepository.save(address);
        return toDto(address);
    }

    /**
     * Updates an existing address.
     */
    @Transactional
    public AddressDto updateAddress(String email, Long addressId, AddressDto dto) {
        UserProfile user = getUserProfile(email);
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền sửa địa chỉ này");
        }

        address.setLabel(dto.getLabel());
        address.setReceiverName(dto.getReceiverName());
        address.setReceiverPhone(dto.getReceiverPhone());
        address.setProvince(dto.getProvince());
        address.setDistrict(dto.getDistrict());
        address.setWard(dto.getWard());
        address.setStreet(dto.getStreet());

        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            unsetDefaultAddresses(user.getId());
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return toDto(address);
    }

    /**
     * Deletes an address.
     */
    @Transactional
    public void deleteAddress(String email, Long addressId) {
        UserProfile user = getUserProfile(email);
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền xóa địa chỉ này");
        }

        addressRepository.delete(address);
    }

    private UserProfile getUserProfile(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "email", email));
        return userProfileRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", account.getId()));
    }

    private void unsetDefaultAddresses(Long userId) {
        addressRepository.findByUserIdOrderByIsDefaultDesc(userId)
                .stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .forEach(a -> {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                });
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
