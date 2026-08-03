package com.delivery.backend.dto;

import com.delivery.backend.model.Courier;
import com.delivery.backend.model.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CourierResponse {
    private Long id;
    private String name;
    private String phone;
    private String cpf;
    private VehicleType vehicleType;
    private String licensePlate;
    private LocalDateTime createdAt;

    public static CourierResponse fromEntity(Courier courier) {
        return CourierResponse.builder()
                .id(courier.getId())
                .name(courier.getName())
                .phone(courier.getPhone())
                .cpf(courier.getCpf())
                .vehicleType(courier.getVehicleType())
                .licensePlate(courier.getLicensePlate())
                .createdAt(courier.getCreatedAt())
                .build();
    }
}
