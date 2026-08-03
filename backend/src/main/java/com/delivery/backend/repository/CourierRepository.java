package com.delivery.backend.repository;

import com.delivery.backend.model.Courier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourierRepository extends JpaRepository<Courier, Long> {
}
