package com.auditflow.app.controller;

import com.auditflow.app.dto.AuditoriaDetalheDTO;
import com.auditflow.app.dto.AuditoriaResumoDTO;
import com.auditflow.app.dto.SalvarRespostasRequest;
import com.auditflow.app.service.AuditoriaService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditorias")
public class AuditoriaController {
    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public List<AuditoriaResumoDTO> listar(
            @RequestParam(required = false) Long auditorId,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer mes) {
        return auditoriaService.listar(auditorId, ano, mes);
    }

    @GetMapping("/{id}")
    public AuditoriaDetalheDTO buscar(@PathVariable Long id) {
        return auditoriaService.buscar(id);
    }

    @PutMapping("/{id}/respostas")
    public AuditoriaDetalheDTO salvarRespostas(
            @PathVariable Long id,
            @Valid @RequestBody SalvarRespostasRequest request) {
        return auditoriaService.salvarRespostas(id, request);
    }

    @PutMapping("/{id}/concluir")
    public AuditoriaDetalheDTO concluir(@PathVariable Long id) {
        return auditoriaService.concluir(id);
    }
}
