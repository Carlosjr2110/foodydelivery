package com.delivery.backend.repository;

import com.delivery.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    boolean existsByCourierId(Long courierId);
}
