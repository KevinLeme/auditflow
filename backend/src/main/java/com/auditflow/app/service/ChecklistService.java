package com.auditflow.app.service;

import com.auditflow.app.dto.ChecklistItemDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.IntStream;

@Service
public class ChecklistService {

    private static final List<String> PERGUNTAS = List.of(
            "Existem vazamentos de ar, agua, oleo ou algum produto no chao, paredes, teto ou equipamento?",
            "Existem materiais pelo chão (papeis, plásticos, lacres, ferramentas)?",
            "O aspecto visual do setor é aceitável (sem material amontoados ou espalhados)?",
            "Os materiais estão em dentro dos locais identificados?",
            "Há identificação no piso, bancadas e prateleiras para os materiais do setor?",
            "As placas de identificação estão legíveis e todos os pontos identificados?",
            "O interior dos armários e bancadas se encontram organizados?",
            "Há materiais sob as bancadas e armários desorganizados?",
            "Extensões elétricas, mangueiras e tubulações estão organizadas e nos suportes?",
            "O piso está limpo?",
            "As parades e teto estão limpos?",
            "Os equipamentos e materiais estão limpos?",
            "Os materiais de limpeza estão de acordo, em bom estado e organizados?",
            "O ambiente em geral aparenta estar limpo?",
            "Os uniformes dos colaboradores se encontram em boas condições?",
            "As lâmpadas e suportes no teto estão limpos?",
            "As lâmpadas estão em funcionamento e o ambiente está bem iluminado?",
            "Os equipamentos de combate a incêndio estão em boas condições e sem obstrução?",
            "Todos os colaboradores estão utilizando EPI's corretamente?",
            "Armários e bancadas estão fechados e trancados?",
            "Os documentos e procedimentos estão organizados?",
            "Os documentos estão sendo preenchidos e legíveis?",
            "No geral o setor aparenta seguir e evoluir nos conceitos de 5S?",
            "Os colaboradores conhecem os conceitos de 5S e estão praticando?");

    public List<ChecklistItemDTO> listar() {
        return IntStream.range(0, PERGUNTAS.size())
                .mapToObj(i -> new ChecklistItemDTO(i + 1, PERGUNTAS.get(i)))
                .toList();
    }

    public int quantidadePerguntas() {
        return PERGUNTAS.size();
    }
}
