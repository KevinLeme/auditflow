package com.auditflow.app.repository;

import com.auditflow.app.model.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, Long> {
    Optional<Area> findByNome(String nome);
}
