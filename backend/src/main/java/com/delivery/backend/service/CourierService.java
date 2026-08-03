package com.delivery.backend.service;

import com.delivery.backend.dto.CourierRequest;
import com.delivery.backend.dto.CourierResponse;
import com.delivery.backend.exception.BadRequestException;
import com.delivery.backend.exception.ResourceNotFoundException;
import com.delivery.backend.model.Courier;
import com.delivery.backend.model.VehicleType;
import com.delivery.backend.repository.CourierRepository;
import com.delivery.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CourierService {

    private static final Set<VehicleType> PLATE_REQUIRED = Set.of(VehicleType.MOTO, VehicleType.CARRO);

    private final CourierRepository courierRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public CourierResponse create(CourierRequest request) {
        Courier courier = new Courier();
        applyRequest(courier, request);

        Courier saved = courierRepository.save(courier);
        return CourierResponse.fromEntity(saved);
    }

    @Transactional
    public CourierResponse update(Long id, CourierRequest request) {
        Courier courier = findOrThrow(id);
        applyRequest(courier, request);

        Courier saved = courierRepository.save(courier);
        return CourierResponse.fromEntity(saved);
    }

    @Transactional
    public void delete(Long id) {
        Courier courier = findOrThrow(id);
        if (orderRepository.existsByCourierId(id)) {
            throw new BadRequestException(
                    "Não é possível excluir: este entregador está atribuído a pedidos. Remova a atribuição primeiro.");
        }
        courierRepository.delete(courier);
    }

    @Transactional(readOnly = true)
    public List<CourierResponse> listAll() {
        return courierRepository.findAll().stream()
                .sorted(Comparator.comparing(Courier::getName))
                .map(CourierResponse::fromEntity)
                .toList();
    }

    private void applyRequest(Courier courier, CourierRequest request) {
        boolean needsPlate = PLATE_REQUIRED.contains(request.getVehicleType());
        if (needsPlate && (request.getLicensePlate() == null || request.getLicensePlate().isBlank())) {
            throw new BadRequestException("Placa é obrigatória para moto ou carro");
        }

        courier.setName(request.getName());
        courier.setPhone(request.getPhone());
        courier.setCpf(request.getCpf());
        courier.setVehicleType(request.getVehicleType());
        courier.setLicensePlate(needsPlate ? request.getLicensePlate() : null);
    }

    private Courier findOrThrow(Long id) {
        return courierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entregador não encontrado com id " + id));
    }
}
