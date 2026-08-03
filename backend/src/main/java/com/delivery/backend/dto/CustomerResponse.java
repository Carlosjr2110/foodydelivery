package com.delivery.backend.dto;

import com.delivery.backend.model.Customer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CustomerResponse {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String cep;
    private String street;
    private String number;
    private String complement;
    private String neighborhood;
    private String city;
    private String state;
    private LocalDateTime createdAt;

    public static CustomerResponse fromEntity(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .cep(customer.getCep())
                .street(customer.getStreet())
                .number(customer.getNumber())
                .complement(customer.getComplement())
                .neighborhood(customer.getNeighborhood())
                .city(customer.getCity())
                .state(customer.getState())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
