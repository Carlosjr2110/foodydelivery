package com.delivery.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignCourierRequest {
    // null desatribui o entregador do pedido
    private Long courierId;
}
