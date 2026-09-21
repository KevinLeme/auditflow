package com.auditflow.app.repository;

import com.auditflow.app.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

  @Query("""
          select a from Auditoria a
          join fetch a.auditor au
          join fetch a.area ar
          where (:auditorId is null or au.id = :auditorId)
            and (:ano is null or a.ano = :ano)
            and (:mes is null or a.mes = :mes)
          order by a.ano, a.mes, a.semanaMes, ar.nome, a.ocorrencia
      """)
  List<Auditoria> filtrar(
      @Param("auditorId") Long auditorId,
      @Param("ano") Integer ano,
      @Param("mes") Integer mes);
}
