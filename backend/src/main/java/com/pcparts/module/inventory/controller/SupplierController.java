package com.pcparts.module.inventory.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.inventory.entity.Supplier;
import com.pcparts.module.inventory.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CRUD controller for Supplier entity.
 */
@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierRepository supplierRepository;

    /**
     * Lists all suppliers.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('inventory.view')")
    public ResponseEntity<ApiResponse<List<Supplier>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách nhà cung cấp", supplierRepository.findAll()));
    }

    /**
     * Gets a supplier by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('inventory.view')")
    public ResponseEntity<ApiResponse<Supplier>> getById(@PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        return ResponseEntity.ok(ApiResponse.success("Chi tiết nhà cung cấp", supplier));
    }

    /**
     * Creates a new supplier.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('inventory.manage')")
    public ResponseEntity<ApiResponse<Supplier>> create(@RequestBody Supplier supplier) {
        Supplier saved = supplierRepository.save(supplier);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nhà cung cấp thành công", saved));
    }

    /**
     * Updates an existing supplier.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('inventory.manage')")
    public ResponseEntity<ApiResponse<Supplier>> update(@PathVariable Long id, @RequestBody Supplier request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        supplier.setName(request.getName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhà cung cấp thành công", supplierRepository.save(supplier)));
    }

    /**
     * Deletes a supplier.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('inventory.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        supplierRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhà cung cấp thành công", null));
    }
}
