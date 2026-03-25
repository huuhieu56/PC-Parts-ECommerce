package com.pcparts.module.auth.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.auth.dto.AddressDto;
import com.pcparts.module.auth.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for address management.
 * Base path: /api/v1/users/addresses
 */
@RestController
@RequestMapping("/api/v1/users/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    /**
     * GET /api/v1/users/addresses — Get all addresses for current user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(Authentication authentication) {
        List<AddressDto> addresses = addressService.getAddresses(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    /**
     * POST /api/v1/users/addresses — Create a new address.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AddressDto>> createAddress(
            Authentication authentication,
            @Valid @RequestBody AddressDto dto) {
        AddressDto created = addressService.createAddress(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    /**
     * PUT /api/v1/users/addresses/{id} — Update an address.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AddressDto dto) {
        AddressDto updated = addressService.updateAddress(authentication.getName(), id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * DELETE /api/v1/users/addresses/{id} — Delete an address.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            Authentication authentication,
            @PathVariable Long id) {
        addressService.deleteAddress(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ thành công", null));
    }
}
