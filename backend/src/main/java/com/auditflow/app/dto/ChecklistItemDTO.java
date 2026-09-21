package com.auditflow.app.dto;

public class ChecklistItemDTO {
    private int numero;
    private String pergunta;

    public ChecklistItemDTO(int numero, String pergunta) {
        this.numero = numero;
        this.pergunta = pergunta;
    }

    public int getNumero() {
        return numero;
    }

    public String getPergunta() {
        return pergunta;
    }
}
