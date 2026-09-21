package com.auditflow.app.dto;

import java.util.List;

public class AuditoriaDetalheDTO {
    private AuditoriaResumoDTO auditoria;
    private List<RespostaDTO> respostas;
    private String observacoes;

    public AuditoriaDetalheDTO(AuditoriaResumoDTO auditoria, List<RespostaDTO> respostas, String observacoes) {
        this.auditoria = auditoria;
        this.respostas = respostas;
        this.observacoes = observacoes;
    }

    public AuditoriaResumoDTO getAuditoria() {
        return auditoria;
    }

    public List<RespostaDTO> getRespostas() {
        return respostas;
    }

    public String getObservacoes() {
        return observacoes;
    }
}
