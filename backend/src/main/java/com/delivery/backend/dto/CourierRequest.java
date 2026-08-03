package com.delivery.backend.dto;

import com.delivery.backend.model.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourierRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String name;

    @NotBlank(message = "Telefone é obrigatório")
    private String phone;

    @NotBlank(message = "CPF é obrigatório")
    private String cpf;

    @NotNull(message = "Tipo de veículo é obrigatório")
    private VehicleType vehicleType;

    // obrigatória somente quando vehicleType é MOTO ou CARRO (validado no service)
    private String licensePlate;
}
