package com.auditflow.app.config;

import com.auditflow.app.model.Area;
import com.auditflow.app.model.Auditor;
import com.auditflow.app.model.Auditoria;
import com.auditflow.app.repository.AreaRepository;
import com.auditflow.app.repository.AuditorRepository;
import com.auditflow.app.repository.AuditoriaRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Configuration
public class DataInitializer {

        private static final List<String> NOMES_AUDITORES = List.of(
                        "Ana",
                        "Bruno",
                        "Carlos");

        private static final List<String> NOMES_AREAS = List.of(
                        "Produção A",
                        "Produção B",
                        "Produção C",
                        "Envase",
                        "Almoxarifado",
                        "Expedição",
                        "Manutenção",
                        "Laboratório",
                        "Controle de Qualidade",
                        "Administrativo",
                        "Utilidades",
                        "Recebimento de Materiais");

        @Bean
        CommandLineRunner carregarDadosIniciais(
                        AuditorRepository auditorRepository,
                        AreaRepository areaRepository,
                        AuditoriaRepository auditoriaRepository) {

                return args -> {

                        // Cria os auditores caso ainda não existam
                        for (String nome : NOMES_AUDITORES) {

                                auditorRepository.findByNome(nome)
                                                .orElseGet(() -> auditorRepository.save(
                                                                new Auditor(nome)));
                        }

                        // Cria as áreas caso ainda não existam
                        for (String nome : NOMES_AREAS) {

                                areaRepository.findByNome(nome)
                                                .orElseGet(() -> areaRepository.save(
                                                                new Area(nome)));
                        }

                        // Gera o cronograma somente se ainda não houver auditorias
                        if (auditoriaRepository.count() == 0) {

                                gerarCronograma(
                                                auditorRepository.findAll(),
                                                areaRepository.findAll(),
                                                auditoriaRepository);
                        }

                };
        }

        private void gerarCronograma(
                        List<Auditor> auditores,
                        List<Area> areas,
                        AuditoriaRepository repository) {

                // Ordena auditores pelo nome
                auditores.sort(
                                (a, b) -> a.getNome()
                                                .compareToIgnoreCase(b.getNome()));

                // Ordena áreas pelo nome
                areas.sort(
                                (a, b) -> a.getNome()
                                                .compareToIgnoreCase(b.getNome()));

                YearMonth competencia = YearMonth.now();
                YearMonth fim = competencia.plusMonths(11);

                int indiceMes = 0;

                while (!competencia.isAfter(fim)) {

                        List<Area> areasSorteadas = new ArrayList<>(areas);

                        // Mantém um sorteio previsível
                        Collections.shuffle(
                                        areasSorteadas,
                                        new Random(competencia.getYear() * 100L + competencia.getMonthValue()));

                        int semanasNoMes = calcularSemanasNoMes(competencia);

                        int metade = Math.max(
                                        1,
                                        (int) Math.ceil(
                                                        semanasNoMes / 2.0));

                        int quantidadeSegundaMetade = Math.max(
                                        1,
                                        semanasNoMes - metade);

                        for (int i = 0; i < areasSorteadas.size(); i++) {

                                Area area = areasSorteadas.get(i);

                                int auditorPrimeira = (i + indiceMes)
                                                % auditores.size();

                                int auditorSegunda = (auditorPrimeira + 1)
                                                % auditores.size();

                                int semanaPrimeira = 1 + (i % metade);

                                int semanaSegunda = metade
                                                + 1
                                                + (i % quantidadeSegundaMetade);

                                if (semanaSegunda > semanasNoMes) {
                                        semanaSegunda = semanasNoMes;
                                }

                                // Primeira auditoria do mês
                                repository.save(
                                                new Auditoria(
                                                                auditores.get(auditorPrimeira),
                                                                area,
                                                                competencia.getYear(),
                                                                competencia.getMonthValue(),
                                                                semanaPrimeira,
                                                                1));

                                // Segunda auditoria do mês
                                repository.save(
                                                new Auditoria(
                                                                auditores.get(auditorSegunda),
                                                                area,
                                                                competencia.getYear(),
                                                                competencia.getMonthValue(),
                                                                semanaSegunda,
                                                                2));
                        }

                        competencia = competencia.plusMonths(1);

                        indiceMes++;
                }
        }

        private int calcularSemanasNoMes(
                        YearMonth ym) {

                int primeiroDia = ym.atDay(1)
                                .getDayOfWeek()
                                .getValue();

                return (int) Math.ceil(
                                (ym.lengthOfMonth()
                                                + primeiroDia
                                                - 1) / 7.0);
        }

}