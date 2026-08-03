package com.delivery.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrderRequest {

    @NotBlank(message = "Nome do cliente é obrigatório")
    private String customerName;

    @NotBlank(message = "Telefone do cliente é obrigatório")
    private String customerPhone;

    @NotBlank(message = "Endereço de entrega é obrigatório")
    private String deliveryAddress;

    @NotEmpty(message = "O pedido deve ter ao menos um item")
    @Valid
    private List<OrderItemRequest> items;
}
