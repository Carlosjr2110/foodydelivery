package com.delivery.backend.service;

import com.delivery.backend.dto.OrderItemRequest;
import com.delivery.backend.dto.OrderRequest;
import com.delivery.backend.dto.OrderResponse;
import com.delivery.backend.exception.ResourceNotFoundException;
import com.delivery.backend.model.Courier;
import com.delivery.backend.model.Order;
import com.delivery.backend.model.OrderItem;
import com.delivery.backend.model.OrderStatus;
import com.delivery.backend.repository.CourierRepository;
import com.delivery.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CourierRepository courierRepository;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        Order order = Order.builder()
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .deliveryAddress(request.getDeliveryAddress())
                .status(OrderStatus.RECEBIDO)
                .build();

        for (OrderItemRequest itemRequest : request.getItems()) {
            OrderItem item = OrderItem.builder()
                    .name(itemRequest.getName())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(itemRequest.getUnitPrice())
                    .build();
            order.addItem(item);
        }

        Order saved = orderRepository.save(order);
        return OrderResponse.fromEntity(saved);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = findOrderOrThrow(id);
        order.setStatus(status);

        LocalDateTime now = LocalDateTime.now();
        switch (status) {
            case EM_PREPARO -> order.setPreparingAt(now);
            case SAIU_PARA_ENTREGA -> order.setDispatchedAt(now);
            case ENTREGUE -> order.setDeliveredAt(now);
            default -> {
                // RECEBIDO já tem createdAt; CANCELADO não precisa de marcação própria
            }
        }

        Order saved = orderRepository.save(order);
        return OrderResponse.fromEntity(saved);
    }

    @Transactional
    public OrderResponse assignCourier(Long id, Long courierId) {
        Order order = findOrderOrThrow(id);

        if (courierId == null) {
            order.setCourier(null);
        } else {
            Courier courier = courierRepository.findById(courierId)
                    .orElseThrow(() -> new ResourceNotFoundException("Entregador não encontrado com id " + courierId));
            order.setCourier(courier);
        }

        Order saved = orderRepository.save(order);
        return OrderResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listAll() {
        return orderRepository.findAll().stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return OrderResponse.fromEntity(findOrderOrThrow(id));
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado com id " + id));
    }
}
