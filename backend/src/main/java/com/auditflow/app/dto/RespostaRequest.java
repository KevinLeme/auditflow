package com.auditflow.app.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class RespostaRequest {
    @Min(1)
    @Max(24)
    private int numeroPergunta;

    @Min(1)
    @Max(3)
    private int nota;

    public RespostaRequest() {
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
