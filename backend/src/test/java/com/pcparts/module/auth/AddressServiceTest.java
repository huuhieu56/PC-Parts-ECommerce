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
                .receiverPhone("0901111111").province("Hà Nội").district("Cầu Giấy").ward("Dịch Vọng").street("123 ABC").isDefault(true).build();
    }

    // === GET ===
    @Test
    @DisplayName("Get addresses — returns list")
    void getAddresses_success() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(1L)).thenReturn(List.of(testAddress));

        List<AddressDto> result = addressService.getAddresses("1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLabel()).isEqualTo("Nhà");
        assertThat(result.get(0).getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("Get addresses — empty list for new user")
    void getAddresses_empty() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(1L)).thenReturn(Collections.emptyList());

        List<AddressDto> result = addressService.getAddresses("1");
        assertThat(result).isEmpty();
    }

    // === CREATE ===
    @Test
    @DisplayName("Create address — success")
    void createAddress_success() {
        AddressDto dto = AddressDto.builder().label("Công ty").receiverName("Test").receiverPhone("0909999999")
                .province("Hà Nội").district("Thanh Xuân").ward("P1").street("456 XYZ").isDefault(false).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(1L)).thenReturn(List.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0); a.setId(20L); return a;
        });

        AddressDto result = addressService.createAddress("1", dto);

        assertThat(result.getLabel()).isEqualTo("Công ty");
        verify(addressRepository).save(any(Address.class));
    }

    @Test
    @DisplayName("Create address — sets default, unsets others")
    void createAddress_defaultUnsetsOthers() {
        AddressDto dto = AddressDto.builder().label("Nhà mới").receiverName("T").receiverPhone("0900000000")
                .province("Hà Nội").district("Cầu Giấy").ward("P1").street("1 A").isDefault(true).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(1L)).thenReturn(List.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0); if (a.getId() == null) a.setId(30L); return a;
        });

        addressService.createAddress("1", dto);

        assertThat(testAddress.getIsDefault()).isFalse(); // old default unset
    }

    @Test
    @DisplayName("TC-ADDR-02: Create first address — automatically default")
    void createAddress_firstAddressBecomesDefault() {
        AddressDto dto = AddressDto.builder().label("Nhà").receiverName("Test").receiverPhone("0909999999")
                .province("Hà Nội").district("Cầu Giấy").ward("Dịch Vọng").street("456 XYZ").isDefault(false).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0); a.setId(20L); return a;
        });

        AddressDto result = addressService.createAddress("1", dto);

        assertThat(result.getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("TC-ADDR-06: Create address outside Hanoi — throws")
    void createAddress_outsideSupportedProvinceThrows() {
        AddressDto dto = AddressDto.builder().label("Nhà").receiverName("Test").receiverPhone("0909999999")
                .province("Hồ Chí Minh").district("Quận 1").ward("P1").street("456 XYZ").build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> addressService.createAddress("1", dto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ngoài vùng giao hàng");

        verify(addressRepository, never()).save(any(Address.class));
    }

    // === UPDATE ===
    @Test
    @DisplayName("Update address — success")
    void updateAddress_success() {
        AddressDto dto = AddressDto.builder().label("Nhà cập nhật").receiverName("Updated")
                .receiverPhone("0908888888").province("Hà Nội").district("Thanh Xuân").ward("P2").street("789 DEF").isDefault(false).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);

        AddressDto result = addressService.updateAddress("1", 10L, dto);

        assertThat(result.getLabel()).isEqualTo("Nhà cập nhật");
    }

    @Test
    @DisplayName("Update address — not own throws forbidden")
    void updateAddress_notOwn() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.updateAddress("1", 10L, new AddressDto()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update address — not found throws")
    void updateAddress_notFound() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.updateAddress("1", 999L, new AddressDto()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === DELETE ===
    @Test
    @DisplayName("Delete address — success")
    void deleteAddress_success() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.countByUserId(1L)).thenReturn(2L);

        addressService.deleteAddress("1", 10L);

        verify(addressRepository).delete(testAddress);
    }

    @Test
    @DisplayName("TC-ADDR-12: Delete only address — throws")
    void deleteAddress_onlyAddressThrows() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.countByUserId(1L)).thenReturn(1L);

        assertThatThrownBy(() -> addressService.deleteAddress("1", 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Bạn cần tạo địa chỉ mới trước khi xóa");

        verify(addressRepository, never()).delete(any(Address.class));
    }

    @Test
    @DisplayName("Delete address — not own throws forbidden")
    void deleteAddress_notOwn() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.deleteAddress("1", 10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Delete address — not found throws")
    void deleteAddress_notFound() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.deleteAddress("1", 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("TC-ADDR-09: Set default address — unsets previous default")
    void setDefaultAddress_unsetsPreviousDefault() {
        Address secondAddress = Address.builder().id(20L).user(testUser).label("Công ty")
                .receiverName("Test").receiverPhone("0909999999").province("Hà Nội")
                .district("Thanh Xuân").ward("P2").street("456 XYZ").isDefault(false).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(secondAddress));
        when(addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(1L)).thenReturn(List.of(testAddress, secondAddress));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

        AddressDto result = addressService.setDefaultAddress("1", 20L);

        assertThat(result.getIsDefault()).isTrue();
        assertThat(testAddress.getIsDefault()).isFalse();
        assertThat(secondAddress.getIsDefault()).isTrue();
    }
}
