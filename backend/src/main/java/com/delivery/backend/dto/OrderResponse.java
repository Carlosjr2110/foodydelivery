package com.delivery.backend.dto;

import com.delivery.backend.model.Order;
import com.delivery.backend.model.OrderStatus;
import com.delivery.backend.model.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private OrderStatus status;
    private List<OrderItemResponse> items;
    private Double total;
    private Long courierId;
    private String courierName;
    private VehicleType courierVehicleType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime preparingAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;

    public static OrderResponse fromEntity(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(OrderItemResponse::fromEntity)
                .toList();

        double total = items.stream()
                .mapToDouble(i -> i.getUnitPrice() * i.getQuantity())
                .sum();

        var builder = OrderResponse.builder()
                .id(order.getId())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .status(order.getStatus())
                .items(items)
                .total(total)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .preparingAt(order.getPreparingAt())
                .dispatchedAt(order.getDispatchedAt())
                .deliveredAt(order.getDeliveredAt());

        if (order.getCourier() != null) {
            builder.courierId(order.getCourier().getId())
                    .courierName(order.getCourier().getName())
                    .courierVehicleType(order.getCourier().getVehicleType());
        }

        return builder.build();
    }
}
