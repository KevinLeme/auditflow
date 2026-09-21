# AuditFlow

> Sistema web responsivo para planejamento, execução e acompanhamento de auditorias 5S.

## 🌐 Demo online

Acesse a versão pública do projeto:

**[Abrir AuditFlow](https://auditflow-5s.netlify.app)**

> A demonstração utiliza exclusivamente dados fictícios e armazena as informações localmente no navegador.git add README.md

O **AuditFlow** é um projeto full stack de portfólio criado para explorar uma rotina de auditorias recorrentes: distribuição de responsáveis, checklist, salvamento de progresso, conclusão, acompanhamento mensal e consolidação de resultados.

> **Privacidade:** esta versão pública utiliza exclusivamente nomes, áreas e registros fictícios. Ela não contém dados operacionais, credenciais ou informações de nenhuma empresa real.

## ✨ Demonstração

A pasta `frontend/` está preparada para funcionar **sem banco de dados e sem backend**. Os dados de demonstração são gerados no primeiro acesso e persistidos apenas no `localStorage` do navegador. Isso permite avaliar a interface e o fluxo completo sem configurar infraestrutura.

Para testar localmente, abra `frontend/` com uma extensão de servidor local (como Live Server) ou execute um servidor HTTP simples.

```bash
cd frontend
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

## 🚀 Funcionalidades

- cronograma recorrente com duas ocorrências mensais por área;
- distribuição de auditorias entre responsáveis fictícios;
- checklist 5S com 24 critérios e escala de 1 a 3;
- salvamento automático de respostas e observações;
- retomada de auditorias pendentes;
- validação antes da conclusão;
- cálculo automático da nota média;
- painel de acompanhamento mensal;
- visão de cronograma, áreas e resultados consolidados;
- interface responsiva para desktop e mobile;
- suporte a instalação como PWA;
- persistência local na demo pública.

## 🧰 Tecnologias

**Frontend:** HTML5, CSS3, JavaScript (Vanilla), LocalStorage e Service Worker/PWA.

**Backend de referência:** Java 21, Spring Boot, Spring Web, Spring Data JPA, Bean Validation e MySQL.

## 🏗️ Arquitetura

A demonstração pública roda de forma independente:

```text
Navegador
   │
   ├── HTML / CSS / JavaScript
   │
   └── localStorage (dados fictícios)
```

O repositório também preserva a implementação de uma arquitetura full stack de referência:

```text
Frontend ── REST / JSON ──> Spring Boot API ── JPA ──> MySQL
```

A demo não envia informações para essa API. O backend está incluído para demonstrar a implementação das camadas `controller`, `service`, `repository`, DTOs e entidades JPA.

## 📁 Estrutura

```text
auditflow/
├── frontend/          # demonstração pública independente
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── config.js
│   └── manifest.webmanifest
├── backend/           # API REST de referência
│   ├── src/
│   ├── pom.xml
│   └── .env.example
├── docs/              # espaço para screenshots do projeto
├── .gitignore
└── README.md
```

## ▶️ Executando o frontend

Não é necessário instalar dependências. Sirva a pasta `frontend` por HTTP e abra no navegador. A demo cria automaticamente um conjunto fictício de auditores, áreas, cronograma e resultados iniciais.

Para voltar ao estado inicial, limpe os dados do site no navegador (localStorage).

## ☕ Executando o backend (opcional)

O backend é independente da demo e requer Java 21, Maven e uma instância MySQL. Configure as variáveis com base em `backend/.env.example` e execute:

```bash
cd backend
mvn spring-boot:run
```

Principais endpoints de referência:

```text
GET  /api/health
GET  /api/auditores
GET  /api/areas
GET  /api/checklist
GET  /api/auditorias
GET  /api/auditorias/{id}
PUT  /api/auditorias/{id}/respostas
PUT  /api/auditorias/{id}/concluir
```

## 💡 Decisões do projeto

A versão pública foi desacoplada do banco para tornar a avaliação simples e segura. O mesmo fluxo de interface é mantido por uma camada local que simula o contrato da API. Dessa forma, o projeto demonstra tanto a experiência do usuário quanto a arquitetura full stack, sem depender de serviços externos ou expor dados reais.

## 🔒 Segurança e dados

- nenhum segredo deve ser versionado;
- credenciais do backend são recebidas por variáveis de ambiente;
- `.env` e artefatos de build são ignorados pelo Git;
- todos os dados incluídos na demonstração são fictícios;
- a demo pública persiste informações somente no navegador do visitante.

## 🗺️ Próximas evoluções

- autenticação e autorização por perfis;
- evidências por imagem;
- exportação de relatórios;
- notificações de auditorias pendentes;
- testes automatizados de frontend e backend;
- pipeline de CI/CD.

## 👨‍💻 Autor

Desenvolvido por **Kevin Augusto Leme de Moura** como projeto de estudo e portfólio em desenvolvimento web full stack.
