package com.delivery.backend.dto;

import com.delivery.backend.model.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private String name;
    private Integer quantity;
    private Double unitPrice;

    public static OrderItemResponse fromEntity(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .build();
    }
}
