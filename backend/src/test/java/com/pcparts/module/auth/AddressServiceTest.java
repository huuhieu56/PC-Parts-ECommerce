package com.pcparts.module.auth;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.AddressDto;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Address;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.AddressRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.auth.service.AddressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock private AddressRepository addressRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserProfileRepository userProfileRepository;

    @InjectMocks
    private AddressService addressService;

    private Account testAccount;
    private UserProfile testUser;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        testAccount = Account.builder().id(1L).email("test@test.com")
                .role(Role.builder().id(4L).name("CUSTOMER").build()).isActive(true).build();
        testUser = UserProfile.builder().id(1L).account(testAccount).fullName("Test").phone("0901111111").build();
        testAddress = Address.builder().id(10L).user(testUser).label("Nhà").receiverName("Test")
                .receiverPhone("0901111111").province("HCM").district("Q1").ward("P1").street("123 ABC").isDefault(true).build();
    }

    // === GET ===
    @Test
    @DisplayName("Get addresses — returns list")
    void getAddresses_success() {
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDesc(1L)).thenReturn(List.of(testAddress));

        List<AddressDto> result = addressService.getAddresses("test@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLabel()).isEqualTo("Nhà");
        assertThat(result.get(0).getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("Get addresses — empty list for new user")
    void getAddresses_empty() {
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDesc(1L)).thenReturn(Collections.emptyList());

        List<AddressDto> result = addressService.getAddresses("test@test.com");
        assertThat(result).isEmpty();
    }

    // === CREATE ===
    @Test
    @DisplayName("Create address — success")
    void createAddress_success() {
        AddressDto dto = AddressDto.builder().label("Công ty").receiverName("Test").receiverPhone("0909999999")
                .province("HCM").district("Q7").ward("P1").street("456 XYZ").isDefault(false).build();
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0); a.setId(20L); return a;
        });

        AddressDto result = addressService.createAddress("test@test.com", dto);

        assertThat(result.getLabel()).isEqualTo("Công ty");
        verify(addressRepository).save(any(Address.class));
    }

    @Test
    @DisplayName("Create address — sets default, unsets others")
    void createAddress_defaultUnsetsOthers() {
        AddressDto dto = AddressDto.builder().label("Nhà mới").receiverName("T").receiverPhone("0900000000")
                .province("HN").district("CG").ward("P1").street("1 A").isDefault(true).build();
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDesc(1L)).thenReturn(List.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0); if (a.getId() == null) a.setId(30L); return a;
        });

        addressService.createAddress("test@test.com", dto);

        assertThat(testAddress.getIsDefault()).isFalse(); // old default unset
    }

    // === UPDATE ===
    @Test
    @DisplayName("Update address — success")
    void updateAddress_success() {
        AddressDto dto = AddressDto.builder().label("Nhà cập nhật").receiverName("Updated")
                .receiverPhone("0908888888").province("HN").district("TX").ward("P2").street("789 DEF").isDefault(false).build();
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);

        AddressDto result = addressService.updateAddress("test@test.com", 10L, dto);

        assertThat(result.getLabel()).isEqualTo("Nhà cập nhật");
    }

    @Test
    @DisplayName("Update address — not own throws forbidden")
    void updateAddress_notOwn() {
        UserProfile otherUser = UserProfile.builder().id(99L).build();
        Address otherAddr = Address.builder().id(10L).user(otherUser).build();
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(otherAddr));

        assertThatThrownBy(() -> addressService.updateAddress("test@test.com", 10L, new AddressDto()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không có quyền");
    }

    @Test
    @DisplayName("Update address — not found throws")
    void updateAddress_notFound() {
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.updateAddress("test@test.com", 999L, new AddressDto()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === DELETE ===
    @Test
    @DisplayName("Delete address — success")
    void deleteAddress_success() {
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));

        addressService.deleteAddress("test@test.com", 10L);

        verify(addressRepository).delete(testAddress);
    }

    @Test
    @DisplayName("Delete address — not own throws forbidden")
    void deleteAddress_notOwn() {
        UserProfile otherUser = UserProfile.builder().id(99L).build();
        Address otherAddr = Address.builder().id(10L).user(otherUser).build();
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(otherAddr));

        assertThatThrownBy(() -> addressService.deleteAddress("test@test.com", 10L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("Delete address — not found throws")
    void deleteAddress_notFound() {
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.deleteAddress("test@test.com", 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
