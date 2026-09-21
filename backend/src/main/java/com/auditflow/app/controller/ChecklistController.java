package com.auditflow.app.controller;

import com.auditflow.app.dto.ChecklistItemDTO;
import com.auditflow.app.service.ChecklistService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/checklist")
public class ChecklistController {
    private final ChecklistService checklistService;

    public ChecklistController(ChecklistService checklistService) {
        this.checklistService = checklistService;
    }

    @GetMapping
    public List<ChecklistItemDTO> listar() {
        return checklistService.listar();
    }
}
