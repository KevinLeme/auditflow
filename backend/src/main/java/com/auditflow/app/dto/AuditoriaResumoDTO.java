package com.auditflow.app.dto;

import com.auditflow.app.model.StatusAuditoria;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AuditoriaResumoDTO {
    private Long id;
    private Long auditorId;
    private String auditor;
    private Long areaId;
    private String area;
    private int ano;
    private int mes;
    private int semanaMes;
    private int ocorrencia;
    private StatusAuditoria status;
    private BigDecimal notaMedia;
    private LocalDateTime dataConclusao;
    private int respostasPreenchidas;

    public AuditoriaResumoDTO(Long id, Long auditorId, String auditor, Long areaId, String area,
            int ano, int mes, int semanaMes, int ocorrencia, StatusAuditoria status,
            BigDecimal notaMedia, LocalDateTime dataConclusao, int respostasPreenchidas) {
        this.id = id;
        this.auditorId = auditorId;
        this.auditor = auditor;
        this.areaId = areaId;
        this.area = area;
        this.ano = ano;
        this.mes = mes;
        this.semanaMes = semanaMes;
        this.ocorrencia = ocorrencia;
        this.status = status;
        this.notaMedia = notaMedia;
        this.dataConclusao = dataConclusao;
        this.respostasPreenchidas = respostasPreenchidas;
    }

    public Long getId() {
        return id;
    }

    public Long getAuditorId() {
        return auditorId;
    }

    public String getAuditor() {
        return auditor;
    }

    public Long getAreaId() {
        return areaId;
    }

    public String getArea() {
        return area;
    }

    public int getAno() {
        return ano;
    }

    public int getMes() {
        return mes;
    }

    public int getSemanaMes() {
        return semanaMes;
    }

    public int getOcorrencia() {
        return ocorrencia;
    }

    public StatusAuditoria getStatus() {
        return status;
    }

    public BigDecimal getNotaMedia() {
        return notaMedia;
    }

    public LocalDateTime getDataConclusao() {
        return dataConclusao;
    }

    public int getRespostasPreenchidas() {
        return respostasPreenchidas;
    }
}
