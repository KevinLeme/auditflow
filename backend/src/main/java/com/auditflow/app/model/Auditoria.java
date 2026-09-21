package com.auditflow.app.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "auditorias", uniqueConstraints = @UniqueConstraint(name = "uk_auditoria_area_competencia_ocorrencia", columnNames = {
        "area_id", "ano", "mes", "ocorrencia" }))
public class Auditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "auditor_id", nullable = false)
    private Auditor auditor;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(nullable = false)
    private int ano;

    @Column(nullable = false)
    private int mes;

    @Column(name = "semana_mes", nullable = false)
    private int semanaMes;

    @Column(nullable = false)
    private int ocorrencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAuditoria status = StatusAuditoria.PENDENTE;

    @Column(name = "nota_media", precision = 4, scale = 2)
    private BigDecimal notaMedia;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(columnDefinition = "TEXT")
    private String observacoes = "";

    @Column(name = "versao_checklist", nullable = false, length = 20)
    private String versaoChecklist = "5S-v1";

    @OneToMany(mappedBy = "auditoria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Resposta> respostas = new ArrayList<>();

    public Auditoria() {
    }

    public Auditoria(Auditor auditor, Area area, int ano, int mes, int semanaMes, int ocorrencia) {
        this.auditor = auditor;
        this.area = area;
        this.ano = ano;
        this.mes = mes;
        this.semanaMes = semanaMes;
        this.ocorrencia = ocorrencia;
    }

    public Long getId() {
        return id;
    }

    public Auditor getAuditor() {
        return auditor;
    }

    public void setAuditor(Auditor auditor) {
        this.auditor = auditor;
    }

    public Area getArea() {
        return area;
    }

    public void setArea(Area area) {
        this.area = area;
    }

    public int getAno() {
        return ano;
    }

    public void setAno(int ano) {
        this.ano = ano;
    }

    public int getMes() {
        return mes;
    }

    public void setMes(int mes) {
        this.mes = mes;
    }

    public int getSemanaMes() {
        return semanaMes;
    }

    public void setSemanaMes(int semanaMes) {
        this.semanaMes = semanaMes;
    }

    public int getOcorrencia() {
        return ocorrencia;
    }

    public void setOcorrencia(int ocorrencia) {
        this.ocorrencia = ocorrencia;
    }

    public StatusAuditoria getStatus() {
        return status;
    }

    public void setStatus(StatusAuditoria status) {
        this.status = status;
    }

    public BigDecimal getNotaMedia() {
        return notaMedia;
    }

    public void setNotaMedia(BigDecimal notaMedia) {
        this.notaMedia = notaMedia;
    }

    public LocalDateTime getDataConclusao() {
        return dataConclusao;
    }

    public void setDataConclusao(LocalDateTime dataConclusao) {
        this.dataConclusao = dataConclusao;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes == null ? "" : observacoes;
    }

    public String getVersaoChecklist() {
        return versaoChecklist;
    }

    public void setVersaoChecklist(String versaoChecklist) {
        this.versaoChecklist = versaoChecklist;
    }

    public List<Resposta> getRespostas() {
        return respostas;
    }
}
