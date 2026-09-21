package com.auditflow.app.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class SalvarRespostasRequest {
    @NotNull
    @Valid
    private List<RespostaRequest> respostas;

    @Size(max = 5000)
    private String observacoes;

    public SalvarRespostasRequest() {
    }

    public List<RespostaRequest> getRespostas() {
        return respostas;
    }

    public void setRespostas(List<RespostaRequest> respostas) {
        this.respostas = respostas;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
