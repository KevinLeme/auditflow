package com.auditflow.app.repository;

import com.auditflow.app.model.Auditor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuditorRepository extends JpaRepository<Auditor, Long> {
    Optional<Auditor> findByNome(String nome);
}
