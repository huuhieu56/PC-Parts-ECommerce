package com.computershop.service.interfaces;

import com.computershop.dto.request.InventoryRequest;
import com.computershop.dto.response.InventoryLogResponse;
import com.computershop.dto.response.InventoryResponse;
import com.computershop.dto.response.LowStockSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface InventoryService {

    InventoryResponse adjustInventory(Long productId, InventoryRequest request);


    LowStockSummaryResponse getLowStockSummary(int threshold);

    Page<InventoryLogResponse> getAllInventoryHistory(Pageable pageable);

    boolean isStockAvailable(Long productId, int quantity);
}
