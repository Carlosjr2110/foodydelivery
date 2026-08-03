package com.delivery.backend.service;

import com.delivery.backend.dto.CustomerRequest;
import com.delivery.backend.dto.CustomerResponse;
import com.delivery.backend.exception.ResourceNotFoundException;
import com.delivery.backend.model.Customer;
import com.delivery.backend.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = new Customer();
        applyRequest(customer, request);

        Customer saved = customerRepository.save(customer);
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findOrThrow(id);
        applyRequest(customer, request);

        Customer saved = customerRepository.save(customer);
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = findOrThrow(id);
        customerRepository.delete(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listAll() {
        return customerRepository.findAll().stream()
                .sorted(Comparator.comparing(Customer::getName))
                .map(CustomerResponse::fromEntity)
                .toList();
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setCep(request.getCep());
        customer.setStreet(request.getStreet());
        customer.setNumber(request.getNumber());
        customer.setComplement(request.getComplement());
        customer.setNeighborhood(request.getNeighborhood());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
    }

    private Customer findOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com id " + id));
    }
}
