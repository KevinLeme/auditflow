package com.auditflow.app.controller;

import com.auditflow.app.model.Auditor;
import com.auditflow.app.repository.AuditorRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auditores")
public class AuditorController {
    private final AuditorRepository auditorRepository;

    public AuditorController(AuditorRepository auditorRepository) {
        this.auditorRepository = auditorRepository;
    }

    @GetMapping
    public List<Auditor> listar() {
        return auditorRepository.findAll();
    }
}
