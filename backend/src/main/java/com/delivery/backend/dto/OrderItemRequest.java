package com.delivery.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderItemRequest {

    @NotBlank(message = "Nome do item é obrigatório")
    private String name;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 1, message = "Quantidade deve ser ao menos 1")
    private Integer quantity;

    @NotNull(message = "Preço unitário é obrigatório")
    @Min(value = 0, message = "Preço unitário não pode ser negativo")
    private Double unitPrice;
}
