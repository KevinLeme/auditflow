package com.auditflow.app.service;

import com.auditflow.app.dto.*;
import com.auditflow.app.model.Auditoria;
import com.auditflow.app.model.Resposta;
import com.auditflow.app.model.StatusAuditoria;
import com.auditflow.app.repository.AuditoriaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final ChecklistService checklistService;

    public AuditoriaService(AuditoriaRepository auditoriaRepository, ChecklistService checklistService) {
        this.auditoriaRepository = auditoriaRepository;
        this.checklistService = checklistService;
    }

    @Transactional
    public List<AuditoriaResumoDTO> listar(Long auditorId, Integer ano, Integer mes) {
        validarMes(mes);
        return auditoriaRepository.filtrar(auditorId, ano, mes)
                .stream()
                .map(this::resumo)
                .toList();
    }

    @Transactional
    public AuditoriaDetalheDTO buscar(Long id) {
        Auditoria auditoria = buscarEntidade(id);
        return detalhe(auditoria);
    }

    @Transactional
    public AuditoriaDetalheDTO salvarRespostas(Long id, SalvarRespostasRequest request) {
        Auditoria auditoria = buscarEntidade(id);

        if (auditoria.getStatus() == StatusAuditoria.CONCLUIDA) {
            throw new IllegalStateException("Uma auditoria concluída não pode ser alterada nesta versão.");
        }

        Set<Integer> numerosRecebidos = new HashSet<>();
        for (RespostaRequest item : request.getRespostas()) {
            if (!numerosRecebidos.add(item.getNumeroPergunta())) {
                throw new IllegalArgumentException(
                        "A pergunta " + item.getNumeroPergunta() + " foi enviada mais de uma vez.");
            }
        }

        Map<Integer, Resposta> existentes = new HashMap<>();
        for (Resposta resposta : auditoria.getRespostas()) {
            existentes.put(resposta.getNumeroPergunta(), resposta);
        }

        for (RespostaRequest item : request.getRespostas()) {
            Resposta resposta = existentes.get(item.getNumeroPergunta());
            if (resposta == null) {
                auditoria.getRespostas().add(new Resposta(auditoria, item.getNumeroPergunta(), item.getNota()));
            } else {
                resposta.setNota(item.getNota());
            }
        }

        auditoria.setObservacoes(request.getObservacoes());
        auditoriaRepository.save(auditoria);
        return detalhe(auditoria);
    }

    @Transactional
    public AuditoriaDetalheDTO concluir(Long id) {
        Auditoria auditoria = buscarEntidade(id);
        int esperadas = checklistService.quantidadePerguntas();

        Map<Integer, Integer> notasPorPergunta = new HashMap<>();
        for (Resposta resposta : auditoria.getRespostas()) {
            notasPorPergunta.put(resposta.getNumeroPergunta(), resposta.getNota());
        }

        if (notasPorPergunta.size() != esperadas) {
            throw new IllegalStateException(
                    "Preencha as " + esperadas + " perguntas antes de concluir. Respondidas: " + notasPorPergunta.size()
                            + ".");
        }

        for (int numero = 1; numero <= esperadas; numero++) {
            if (!notasPorPergunta.containsKey(numero)) {
                throw new IllegalStateException("A pergunta " + numero + " ainda não foi respondida.");
            }
        }

        BigDecimal soma = auditoria.getRespostas().stream()
                .map(r -> BigDecimal.valueOf(r.getNota()))
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        BigDecimal media = soma.divide(BigDecimal.valueOf(esperadas), 2, RoundingMode.HALF_UP);

        auditoria.setNotaMedia(media);
        auditoria.setStatus(StatusAuditoria.CONCLUIDA);
        auditoria.setDataConclusao(LocalDateTime.now());
        auditoriaRepository.save(auditoria);

        return detalhe(auditoria);
    }

    private Auditoria buscarEntidade(Long id) {
        return auditoriaRepository.findById(Objects.requireNonNull(id, "ID não pode ser nulo"))
                .orElseThrow(() -> new NoSuchElementException("Auditoria não encontrada: " + id));
    }

    private AuditoriaResumoDTO resumo(Auditoria a) {
        return new AuditoriaResumoDTO(
                a.getId(),
                a.getAuditor().getId(),
                a.getAuditor().getNome(),
                a.getArea().getId(),
                a.getArea().getNome(),
                a.getAno(),
                a.getMes(),
                a.getSemanaMes(),
                a.getOcorrencia(),
                a.getStatus(),
                a.getNotaMedia(),
                a.getDataConclusao(),
                a.getRespostas().size());
    }

    private AuditoriaDetalheDTO detalhe(Auditoria a) {
        List<RespostaDTO> respostas = a.getRespostas().stream()
                .sorted(Comparator.comparingInt(r -> r.getNumeroPergunta()))
                .map(r -> new RespostaDTO(r.getNumeroPergunta(), r.getNota()))
                .toList();
        return new AuditoriaDetalheDTO(resumo(a), respostas, a.getObservacoes());
    }

    private void validarMes(Integer mes) {
        if (mes != null && (mes < 1 || mes > 12)) {
            throw new IllegalArgumentException("Mês deve estar entre 1 e 12.");
        }
    }
}
