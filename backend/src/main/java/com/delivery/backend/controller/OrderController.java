package com.delivery.backend.controller;

import com.delivery.backend.dto.AssignCourierRequest;
import com.delivery.backend.dto.OrderRequest;
import com.delivery.backend.dto.OrderResponse;
import com.delivery.backend.dto.UpdateStatusRequest;
import com.delivery.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> listAll() {
        return ResponseEntity.ok(orderService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/courier")
    public ResponseEntity<OrderResponse> assignCourier(@PathVariable Long id,
                                                         @Valid @RequestBody AssignCourierRequest request) {
        return ResponseEntity.ok(orderService.assignCourier(id, request.getCourierId()));
    }
}
