# AuditFlow API

API REST de referência do AuditFlow, construída com Java 21, Spring Boot, Spring Data JPA e MySQL. A demonstração em `../frontend` não depende desta API.

## Configuração

Use `application.properties` com variáveis de ambiente `DB_URL`, `DB_USER` e `DB_PASSWORD`. O arquivo `.env.example` contém apenas valores ilustrativos.

## Executar

```bash
mvn spring-boot:run
```

Health check: `GET /api/health`.
