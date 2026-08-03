package com.delivery.backend.controller;

import com.delivery.backend.dto.CourierRequest;
import com.delivery.backend.dto.CourierResponse;
import com.delivery.backend.service.CourierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/couriers")
@RequiredArgsConstructor
public class CourierController {

    private final CourierService courierService;

    @PostMapping
    public ResponseEntity<CourierResponse> create(@Valid @RequestBody CourierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courierService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CourierResponse>> listAll() {
        return ResponseEntity.ok(courierService.listAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourierResponse> update(@PathVariable Long id,
                                                    @Valid @RequestBody CourierRequest request) {
        return ResponseEntity.ok(courierService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
