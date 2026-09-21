package com.auditflow.app.model;

import jakarta.persistence.*;

@Entity
@Table(name = "respostas", uniqueConstraints = @UniqueConstraint(name = "uk_resposta_auditoria_pergunta", columnNames = {
        "auditoria_id", "numero_pergunta" }))
public class Resposta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "auditoria_id", nullable = false)
    private Auditoria auditoria;

    @Column(name = "numero_pergunta", nullable = false)
    private int numeroPergunta;

    @Column(nullable = false)
    private int nota;

    public Resposta() {
    }

    public Resposta(Auditoria auditoria, int numeroPergunta, int nota) {
        this.auditoria = auditoria;
        this.numeroPergunta = numeroPergunta;
        this.nota = nota;
    }

    public Long getId() {
        return id;
    }

    public Auditoria getAuditoria() {
        return auditoria;
    }

    public void setAuditoria(Auditoria auditoria) {
        this.auditoria = auditoria;
    }

    public int getNumeroPergunta() {
        return numeroPergunta;
    }

    public void setNumeroPergunta(int numeroPergunta) {
        this.numeroPergunta = numeroPergunta;
    }

    public int getNota() {
        return nota;
    }

    public void setNota(int nota) {
        this.nota = nota;
    }
}
