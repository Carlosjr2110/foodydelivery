package com.delivery.backend.dto;

import com.delivery.backend.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStatusRequest {

    @NotNull(message = "Status é obrigatório")
    private OrderStatus status;
}
