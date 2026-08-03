package com.delivery.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String name;

    @NotBlank(message = "Telefone é obrigatório")
    private String phone;

    @Email(message = "E-mail inválido")
    private String email;

    private String cep;
    private String street;
    private String number;
    private String complement;
    private String neighborhood;
    private String city;
    private String state;
}
