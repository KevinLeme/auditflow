package com.auditflow.app.dto;

public class RespostaDTO {
    private int numeroPergunta;
    private int nota;

    public RespostaDTO(int numeroPergunta, int nota) {
        this.numeroPergunta = numeroPergunta;
        this.nota = nota;
    }

    public int getNumeroPergunta() {
        return numeroPergunta;
    }

    public int getNota() {
        return nota;
    }
}
