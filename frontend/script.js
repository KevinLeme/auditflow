let AUDITORES = ["Ana", "Bruno", "Carlos"];
let SETORES = [];
let PERGUNTAS_5S = [];

const DEMO_MODE = window.AUDITORIAS_CONFIG?.demoMode !== false;
const API_BASE = DEMO_MODE
  ? "Armazenamento local do navegador"
  : (window.AUDITORIAS_CONFIG?.apiBaseUrl || "http://localhost:8080/api").replace(/\/$/, "");
const DEMO_STORAGE_KEY = "auditflow_demo_data_v1";
const AUDITOR_KEY = "auditflow_auditor_ativo_v1";
let installPromptEvent = null;
let autosaveTimer = null;
let autosaveEmAndamento = Promise.resolve();
let apiOnline = false;
let estado = { cronograma: [] };
let auditorAtivo = localStorage.getItem(AUDITOR_KEY) || "Ana";
let auditoriaAbertaId = null;
let viewAtual = "minhas";
const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function monthKey(ano, mesZeroBased) {
  return `${ano}-${String(mesZeroBased + 1).padStart(2, "0")}`;
}

function monthLabel(ano, mesZeroBased) {
  return `${MESES_PT[mesZeroBased]}/${ano}`;
}

function gerarMesesDoCronograma() {
  const meses = [];
  const hoje = new Date();
  const cursor = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  for (let i = 0; i < 12; i++) {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    meses.push({
      key: monthKey(ano, mes),
      label: monthLabel(ano, mes),
      ano,
      mes,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}

const MESES_CRONOGRAMA = gerarMesesDoCronograma();

const DEMO_AREAS = [
  "Produção A", "Produção B", "Produção C", "Envase", "Almoxarifado", "Expedição",
  "Manutenção", "Laboratório", "Controle de Qualidade", "Administrativo", "Utilidades", "Recebimento de Materiais"
];

const DEMO_CHECKLIST = [
  "Existem vazamentos de ar, água, óleo ou algum produto no chão, paredes, teto ou equipamento?",
  "Existem materiais pelo chão (papéis, plásticos, lacres ou ferramentas)?",
  "O aspecto visual da área é aceitável, sem materiais amontoados ou espalhados?",
  "Os materiais estão dentro dos locais identificados?",
  "Há identificação no piso, bancadas e prateleiras para os materiais da área?",
  "As placas de identificação estão legíveis e os pontos necessários estão identificados?",
  "O interior dos armários e bancadas se encontra organizado?",
  "Há materiais sob bancadas ou armários de forma desorganizada?",
  "Extensões elétricas, mangueiras e tubulações estão organizadas e nos suportes?",
  "O piso está limpo?", "As paredes e o teto estão limpos?", "Os equipamentos e materiais estão limpos?",
  "Os materiais de limpeza estão adequados, em bom estado e organizados?",
  "O ambiente em geral aparenta estar limpo?", "Os uniformes dos colaboradores estão em boas condições?",
  "As lâmpadas e suportes no teto estão limpos?", "As lâmpadas funcionam e o ambiente está bem iluminado?",
  "Os equipamentos de combate a incêndio estão em boas condições e sem obstrução?",
  "Os colaboradores estão utilizando os EPIs aplicáveis corretamente?", "Armários e bancadas estão fechados quando aplicável?",
  "Os documentos e procedimentos estão organizados?", "Os registros estão preenchidos e legíveis?",
  "No geral, a área demonstra evolução nos conceitos de 5S?", "Os colaboradores conhecem os conceitos de 5S e os praticam?"
];

function criarBaseDemo() {
  const auditorias = [];
  let id = 1;
  MESES_CRONOGRAMA.forEach((comp, mesIndice) => {
    DEMO_AREAS.forEach((area, areaIndice) => {
      [1, 2].forEach((ocorrencia) => {
        const auditorIndice = (areaIndice + ocorrencia - 1 + mesIndice) % AUDITORES.length;
        auditorias.push({
          id: id++, auditorId: auditorIndice + 1, auditor: AUDITORES[auditorIndice],
          areaId: areaIndice + 1, area, ano: comp.ano, mes: comp.mes + 1,
          semanaMes: ocorrencia === 1 ? 2 : 4, ocorrencia, status: "PENDENTE",
          notaMedia: null, dataConclusao: null, respostasPreenchidas: 0, respostas: [], observacoes: ""
        });
      });
    });
  });
  // Alguns registros fictícios concluídos deixam dashboards e resultados demonstráveis logo no primeiro acesso.
  auditorias.filter(a => a.ano === MESES_CRONOGRAMA[0].ano && a.mes === MESES_CRONOGRAMA[0].mes + 1).slice(0, 6).forEach((a, i) => {
    a.respostas = DEMO_CHECKLIST.map((_, q) => ({ numeroPergunta: q + 1, nota: ((q + i) % 5 === 0 ? 2 : 3) }));
    a.respostasPreenchidas = a.respostas.length;
    a.notaMedia = Number((a.respostas.reduce((t, r) => t + r.nota, 0) / a.respostas.length).toFixed(2));
    a.status = "CONCLUIDA";
    a.dataConclusao = new Date().toISOString();
    a.observacoes = i === 0 ? "Registro fictício para demonstração do portfólio." : "";
  });
  return { auditorias };
}

function lerDemo() {
  try { return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)) || criarBaseDemo(); }
  catch (_) { return criarBaseDemo(); }
}
function salvarDemo(base) { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(base)); }
function resumoDemo(a) {
  const { respostas, observacoes, ...resumo } = a;
  return { ...resumo, respostasPreenchidas: (respostas || []).length };
}
function detalheDemo(a) { return { auditoria: resumoDemo(a), respostas: a.respostas || [], observacoes: a.observacoes || "" }; }

async function apiDemo(caminho, opcoes = {}) {
  await new Promise(resolve => setTimeout(resolve, 60));
  const base = lerDemo();
  if (caminho === "/health") return { status: "ok", mode: "demo" };
  if (caminho === "/auditores") return AUDITORES.map((nome, i) => ({ id: i + 1, nome, ativo: true }));
  if (caminho === "/areas") return DEMO_AREAS.map((nome, i) => ({ id: i + 1, nome, ativa: true }));
  if (caminho === "/checklist") return DEMO_CHECKLIST.map((pergunta, i) => ({ numero: i + 1, pergunta }));
  if (caminho === "/auditorias") return base.auditorias.map(resumoDemo);
  const match = caminho.match(/^\/auditorias\/(\d+)(?:\/(respostas|concluir))?$/);
  if (!match) throw new Error("Recurso de demonstração não encontrado.");
  const auditoria = base.auditorias.find(a => a.id === Number(match[1]));
  if (!auditoria) throw new Error("Auditoria não encontrada.");
  if (!match[2]) return detalheDemo(auditoria);
  if ((opcoes.method || "GET").toUpperCase() !== "PUT") throw new Error("Operação não suportada na demonstração.");
  if (match[2] === "respostas") {
    const corpo = JSON.parse(opcoes.body || "{}");
    auditoria.respostas = corpo.respostas || [];
    auditoria.observacoes = corpo.observacoes || "";
    auditoria.respostasPreenchidas = auditoria.respostas.length;
  } else {
    if ((auditoria.respostas || []).length !== DEMO_CHECKLIST.length) throw new Error("Responda todos os critérios antes de concluir.");
    auditoria.status = "CONCLUIDA";
    auditoria.notaMedia = Number((auditoria.respostas.reduce((t, r) => t + Number(r.nota), 0) / auditoria.respostas.length).toFixed(2));
    auditoria.dataConclusao = new Date().toISOString();
  }
  salvarDemo(base);
  return detalheDemo(auditoria);
}

async function api(caminho, opcoes = {}) {
  if (DEMO_MODE) { apiOnline = true; atualizarIndicadorApi(); return apiDemo(caminho, opcoes); }
  const headers = { Accept: "application/json", ...(opcoes.headers || {}) };
  if (opcoes.body && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";

  let resposta;
  try {
    resposta = await fetch(`${API_BASE}${caminho}`, { ...opcoes, headers });
  } catch (erro) {
    apiOnline = false;
    atualizarIndicadorApi();
    throw new Error(
      "Não foi possível conectar ao backend. Confirme se o Spring Boot está rodando na porta 8080.",
    );
  }

  let dados = null;
  const texto = await resposta.text();
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch (_) {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    const mensagem =
      dados?.erro || dados?.message || `Erro HTTP ${resposta.status}`;
    throw new Error(mensagem);
  }

  apiOnline = true;
  atualizarIndicadorApi();
  return dados;
}

function normalizarStatus(status) {
  return status === "CONCLUIDA" ? "Concluída" : "Pendente";
}

function normalizarAuditoria(dto) {
  const mesZero = Number(dto.mes) - 1;
  const nota =
    dto.notaMedia === null || dto.notaMedia === undefined
      ? null
      : Number(dto.notaMedia);
  return {
    id: Number(dto.id),
    auditorId: Number(dto.auditorId),
    areaId: Number(dto.areaId),
    competencia: monthKey(Number(dto.ano), mesZero),
    competenciaLabel: monthLabel(Number(dto.ano), mesZero),
    ano: Number(dto.ano),
    mes: mesZero,
    semanaNumero: Number(dto.semanaMes),
    semanaLabel: `${Number(dto.semanaMes)}ª semana de ${monthLabel(Number(dto.ano), mesZero).toLowerCase()}`,
    ordem:
      Number(dto.ano) * 100000 +
      Number(dto.mes) * 1000 +
      Number(dto.semanaMes) * 100 +
      Number(dto.ocorrencia) * 10 +
      Number(dto.id) / 100000,
    setor: dto.area,
    auditor: dto.auditor,
    instancia: Number(dto.ocorrencia),
    status: normalizarStatus(dto.status),
    notaMedia: Number.isFinite(nota) ? nota : null,
    concluidaEm: dto.dataConclusao || null,
    respostasPreenchidas: Number(dto.respostasPreenchidas || 0),
    respostas: {},
    observacoes: "",
  };
}

function aplicarDetalhe(detalhe) {
  const resumo = normalizarAuditoria(detalhe.auditoria);
  resumo.respostas = {};
  (detalhe.respostas || []).forEach((item) => {
    resumo.respostas[Number(item.numeroPergunta)] = Number(item.nota);
  });
  resumo.respostasPreenchidas = Object.keys(resumo.respostas).length;
  resumo.observacoes = detalhe.observacoes || "";

  const indice = estado.cronograma.findIndex((r) => r.id === resumo.id);
  if (indice >= 0)
    estado.cronograma[indice] = { ...estado.cronograma[indice], ...resumo };
  else estado.cronograma.push(resumo);
  return estado.cronograma.find((r) => r.id === resumo.id);
}

async function carregarDadosDaApi() {
  const [auditores, areas, checklist, auditorias] = await Promise.all([
    api("/auditores"),
    api("/areas"),
    api("/checklist"),
    api("/auditorias"),
  ]);

  AUDITORES = auditores.filter((a) => a.ativo !== false).map((a) => a.nome);
  SETORES = areas
    .filter((a) => a.ativa !== false)
    .map((a) => a.nome)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  PERGUNTAS_5S = [...checklist]
    .sort((a, b) => a.numero - b.numero)
    .map((item) => item.pergunta);
  estado = { cronograma: auditorias.map(normalizarAuditoria) };

  if (!AUDITORES.includes(auditorAtivo)) auditorAtivo = AUDITORES[0] || "Ana";
  localStorage.setItem(AUDITOR_KEY, auditorAtivo);
}

function formatarDataHora(valor) {
  if (!valor) return "–";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "–";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function atualizarIndicadorApi() {
  const chip = document.getElementById("api-status-chip");
  const texto = document.getElementById("api-status-text");
  if (chip) chip.classList.toggle("api-offline", !apiOnline);
  if (texto)
    texto.textContent = apiOnline ? "Demo local ativa" : "Demo indisponível";
  const modalStatus = document.getElementById("api-modal-status");
  if (modalStatus)
    modalStatus.textContent = apiOnline ? "LocalStorage ativo" : "Indisponível";
  const modalUrl = document.getElementById("api-modal-url");
  if (modalUrl) modalUrl.textContent = API_BASE;
}

function renderCarregando() {
  document.getElementById("view-minhas").innerHTML =
    `<section class="panel"><div class="empty-state"><strong>Preparando demonstração…</strong>Carregando dados fictícios no navegador.</div></section>`;
}

function renderErroInicial(mensagem) {
  document.getElementById("view-minhas").innerHTML =
    `<section class="panel"><div class="empty-state"><strong>Não foi possível carregar a demonstração.</strong>${mensagem}</div></section>`;
}

function competenciaPadrao() {
  const hoje = new Date();
  const chaveHoje = monthKey(hoje.getFullYear(), hoje.getMonth());
  if (MESES_CRONOGRAMA.some((m) => m.key === chaveHoje)) return chaveHoje;
  return MESES_CRONOGRAMA[0].key;
}

function rotuloCompetencia(chave) {
  return MESES_CRONOGRAMA.find((m) => m.key === chave)?.label || chave;
}

function registrosDoMes(chave) {
  return estado.cronograma.filter((r) => r.competencia === chave);
}

function registrosDoAuditor(nome, chave = null) {
  return estado.cronograma.filter(
    (r) => r.auditor === nome && (!chave || r.competencia === chave),
  );
}

function statusClass(status) {
  if (status === "Concluída") return "status--done";
  return "status--pending";
}

function statusBadge(status) {
  return `<span class="status ${statusClass(status)}">${status}</span>`;
}

function icon(nome, classe = "") {
  return `<svg class="ui-icon ${classe}" aria-hidden="true"><use href="#icon-${nome}"></use></svg>`;
}

function metricCard(icone, valor, rotulo, hint = "", classe = "") {
  return `
    <article class="metric-card ${classe}">
      <div class="metric-card__icon" aria-hidden="true">${icon(icone)}</div>
      <div>
        <span class="metric-card__value">${valor}</span>
        <span class="metric-card__label">${rotulo}</span>
        ${hint ? `<span class="metric-card__hint">${hint}</span>` : ""}
      </div>
    </article>`;
}

function selectCompetencias(id, valorAtual) {
  return `
    <div class="field">
      <label for="${id}">Competência</label>
      <select id="${id}">
        ${MESES_CRONOGRAMA.map((m) => `<option value="${m.key}" ${m.key === valorAtual ? "selected" : ""}>${m.label}</option>`).join("")}
      </select>
    </div>`;
}

function renderHeader() {
  document.getElementById("auditor-ativo").value = auditorAtivo;
  document.getElementById("avatar-inicial").textContent =
    auditorAtivo.charAt(0);
  const mobileNome = document.getElementById("mobile-auditor-name");
  if (mobileNome) mobileNome.textContent = auditorAtivo;
  document.querySelectorAll("[data-select-auditor]").forEach((botao) => {
    botao.classList.toggle(
      "active",
      botao.dataset.selectAuditor === auditorAtivo,
    );
  });
}

function renderMinhas() {
  const container = document.getElementById("view-minhas");
  const competencia = container.dataset.comp || competenciaPadrao();
  container.dataset.comp = competencia;

  const registros = registrosDoAuditor(auditorAtivo, competencia).sort(
    (a, b) => a.ordem - b.ordem,
  );
  const concluidas = registros.filter((r) => r.status === "Concluída");
  const pendentes = registros.filter((r) => r.status === "Pendente");
  const taxa = registros.length
    ? Math.round((concluidas.length / registros.length) * 100)
    : 0;
  const proximas = registros
    .filter((r) => r.status !== "Concluída")
    .slice(0, 10);
  const historico = registrosDoAuditor(auditorAtivo)
    .filter((r) => r.status === "Concluída" && Number.isFinite(r.notaMedia))
    .sort((a, b) => new Date(b.concluidaEm || 0) - new Date(a.concluidaEm || 0))
    .slice(0, 8);

  const porSetor = {};
  registros.forEach((r) => {
    porSetor[r.setor] = (porSetor[r.setor] || 0) + 1;
  });
  const setoresAtribuidos = Object.entries(porSetor).sort((a, b) =>
    a[0].localeCompare(b[0], "pt-BR"),
  );

  container.innerHTML = `
    <div class="toolbar">
      ${selectCompetencias("minhas-competencia", competencia)}
      <div class="toolbar__spacer"></div>
      <span class="pill pill--soft">${auditorAtivo} · ${rotuloCompetencia(competencia)}</span>
    </div>

    <div class="metrics">
      ${metricCard("calendar", registros.length, "Programadas", "Suas auditorias neste mês")}
      ${metricCard("check-circle", concluidas.length, "Concluídas", `${taxa}% de conclusão`, "metric-card--success")}
      ${metricCard("clock", pendentes.length, "Pendentes", "Aguardando conclusão", "metric-card--warning")}
      ${metricCard("layers", setoresAtribuidos.length, "Áreas no mês", "Áreas diferentes atribuídas", "metric-card--blue")}
    </div>

    <div class="layout-2">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h2>Próximas auditorias</h2>
            <p>O cronograma usa semanas, sem inventar um dia específico.</p>
          </div>
          <span class="pill">${proximas.length} a executar</span>
        </div>
        ${
          proximas.length
            ? `
          <div class="audit-list">
            ${proximas
              .map(
                (r) => `
              <article class="audit-row">
                <div class="audit-row__week">
                  <strong>${r.semanaNumero}ª semana</strong>
                  <span>${r.competenciaLabel}</span>
                </div>
                <div class="audit-row__area">
                  <strong>${r.setor}</strong>
                  <span>${r.instancia}ª ocorrência do mês</span>
                </div>
                <div class="audit-row__status">${statusBadge(r.status)}</div>
                <div class="audit-row__actions">
                  <button class="button button--primary button--small" data-open-audit="${r.id}">${icon("clipboard-check")}<span>${r.respostasPreenchidas > 0 ? "Continuar auditoria" : "Iniciar auditoria"}</span></button>
                </div>
              </article>`,
              )
              .join("")}
          </div>`
            : `
          <div class="empty-state"><strong>Tudo concluído neste mês.</strong>Não há auditorias pendentes para ${auditorAtivo} em ${rotuloCompetencia(competencia)}.</div>`
        }
      </section>

      <div class="stack">
        <section class="panel">
          <div class="panel__header">
            <div><h2>Suas áreas neste mês</h2><p>Quantidade de ocorrências atribuídas a você.</p></div>
          </div>
          <div class="panel__body kpi-list">
            ${setoresAtribuidos
              .map(
                ([setor, quantidade]) => `
              <div class="kpi-line"><span>${setor}</span><strong>${quantidade} ${quantidade === 1 ? "auditoria" : "auditorias"}</strong></div>`,
              )
              .join("")}
          </div>
        </section>

        <section class="panel">
          <div class="panel__header"><div><h2>Regra do cronograma</h2><p>Gerada automaticamente pelo backend.</p></div></div>
          <div class="panel__body">
            <div class="kpi-list">
              <div class="kpi-line"><span>Áreas cadastradas</span><strong>${SETORES.length}</strong></div>
              <div class="kpi-line"><span>Ocorrências por área/mês</span><strong>2</strong></div>
              <div class="kpi-line"><span>Auditorias da equipe/mês</span><strong>${SETORES.length * 2}</strong></div>
              <div class="kpi-line"><span>Auditores</span><strong>${AUDITORES.length}</strong></div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section class="panel history-panel">
      <div class="panel__header">
        <div><h2>Histórico recente</h2><p>Últimas auditorias concluídas por ${auditorAtivo}, em todas as competências.</p></div>
        <span class="pill pill--soft">${historico.length} exibidas</span>
      </div>
      ${
        historico.length
          ? `<div class="history-list">${historico
              .map(
                (r) => `
        <article class="history-row">
          <div class="history-row__area"><strong>${r.setor}</strong><span>${r.instancia}ª ocorrência · ${r.competenciaLabel}</span></div>
          <div class="history-row__meta"><strong>${r.semanaNumero}ª semana</strong><span>Concluída em ${formatarDataHora(r.concluidaEm)}</span></div>
          <div class="history-row__score"><strong>${r.notaMedia.toFixed(2)}</strong><span> / 3</span></div>
        </article>`,
              )
              .join("")}</div>`
          : `<div class="empty-state"><strong>Nenhuma auditoria concluída ainda.</strong>Quando você concluir uma auditoria, ela aparecerá aqui.</div>`
      }
    </section>`;

  document
    .getElementById("minhas-competencia")
    .addEventListener("change", (evento) => {
      container.dataset.comp = evento.target.value;
      renderMinhas();
    });
}

function renderAcompanhamento() {
  const container = document.getElementById("view-acompanhamento");
  const competencia = container.dataset.comp || competenciaPadrao();
  container.dataset.comp = competencia;

  const registros = registrosDoMes(competencia);
  const concluidas = registros.filter((r) => r.status === "Concluída").length;
  const pendentes = registros.filter((r) => r.status === "Pendente").length;
  const taxa = registros.length
    ? Math.round((concluidas / registros.length) * 100)
    : 0;

  container.innerHTML = `
    <div class="toolbar">
      ${selectCompetencias("acomp-competencia", competencia)}
      <div class="toolbar__spacer"></div>
      <span class="pill pill--soft">Dados fictícios · salvos neste navegador</span>
    </div>

    <div class="metrics">
      ${metricCard("calendar", registros.length, "Programadas", `${SETORES.length} áreas × 2 ocorrências`)}
      ${metricCard("check-circle", concluidas, "Concluídas", `${taxa}% de conclusão`, "metric-card--success")}
      ${metricCard("clock", pendentes, "Pendentes", "Aguardando conclusão", "metric-card--warning")}
      ${metricCard("percent", `${taxa}%`, "Taxa de conclusão", rotuloCompetencia(competencia), "metric-card--blue")}
    </div>

    <div class="layout-2">
      <section class="panel">
        <div class="panel__header"><div><h2>Execução por auditor</h2><p>Programadas e concluídas no mês selecionado.</p></div></div>
        <div class="panel__body">
          ${AUDITORES.map((auditor) => {
            const doAuditor = registros.filter((r) => r.auditor === auditor);
            const feitas = doAuditor.filter(
              (r) => r.status === "Concluída",
            ).length;
            const percentual = doAuditor.length
              ? Math.round((feitas / doAuditor.length) * 100)
              : 0;
            return `
              <div class="progress-item">
                <div class="progress-item__top"><strong>${auditor}</strong><span>${feitas} / ${doAuditor.length} · ${percentual}%</span></div>
                <div class="progress-track"><span style="width:${percentual}%"></span></div>
              </div>`;
          }).join("")}
        </div>
      </section>

      <div class="stack">
        <section class="panel">
          <div class="panel__header"><div><h2>Status do mês</h2><p>Retrato atual do cronograma.</p></div></div>
          <div class="panel__body kpi-list">
            <div class="kpi-line"><span>Pendentes</span><strong>${pendentes}</strong></div>
            <div class="kpi-line"><span>Concluídas</span><strong>${concluidas}</strong></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel__header"><div><h2>Distribuição das ocorrências</h2><p>Duas passagens de cada área por mês.</p></div></div>
          <div class="panel__body kpi-list">
            <div class="kpi-line"><span>1ª ocorrência</span><strong>${registros.filter((r) => r.instancia === 1).length}</strong></div>
            <div class="kpi-line"><span>2ª ocorrência</span><strong>${registros.filter((r) => r.instancia === 2).length}</strong></div>
          </div>
        </section>
      </div>
    </div>`;

  document
    .getElementById("acomp-competencia")
    .addEventListener("change", (evento) => {
      container.dataset.comp = evento.target.value;
      renderAcompanhamento();
    });
}

function renderCronograma() {
  const container = document.getElementById("view-cronograma");
  const competencia = container.dataset.comp || competenciaPadrao();
  const auditorFiltro = container.dataset.auditor || "Todos";
  const semanaFiltro = container.dataset.semana || "Todas";
  const statusFiltro = container.dataset.status || "Todos";
  container.dataset.comp = competencia;

  const semanas = [
    ...new Set(registrosDoMes(competencia).map((r) => r.semanaNumero)),
  ].sort((a, b) => a - b);
  let registros = registrosDoMes(competencia);
  if (auditorFiltro !== "Todos")
    registros = registros.filter((r) => r.auditor === auditorFiltro);
  if (semanaFiltro !== "Todas")
    registros = registros.filter(
      (r) => String(r.semanaNumero) === semanaFiltro,
    );
  if (statusFiltro !== "Todos")
    registros = registros.filter((r) => r.status === statusFiltro);
  registros.sort((a, b) => a.ordem - b.ordem);

  container.innerHTML = `
    <div class="toolbar">
      ${selectCompetencias("crono-competencia", competencia)}
      <div class="field">
        <label for="crono-auditor">Auditor</label>
        <select id="crono-auditor"><option>Todos</option>${AUDITORES.map((a) => `<option ${a === auditorFiltro ? "selected" : ""}>${a}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="crono-semana">Semana</label>
        <select id="crono-semana"><option>Todas</option>${semanas.map((s) => `<option value="${s}" ${String(s) === semanaFiltro ? "selected" : ""}>${s}ª semana</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="crono-status">Status</label>
        <select id="crono-status"><option>Todos</option>${["Pendente", "Concluída"].map((s) => `<option ${s === statusFiltro ? "selected" : ""}>${s}</option>`).join("")}</select>
      </div>
    </div>

    <section class="panel">
      <div class="panel__header">
        <div><h2>Cronograma mensal</h2><p>${registros.length} registros encontrados · leitura do planejamento geral.</p></div>
        <span class="pill">${rotuloCompetencia(competencia)}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Semana</th><th>Área / Setor</th><th>Auditor</th><th>Ocorrência</th><th>Status</th></tr></thead>
          <tbody>
            ${
              registros
                .map(
                  (r) => `
              <tr>
                <td data-label="Semana"><span class="cell-title">${r.semanaNumero}ª semana</span><span class="cell-subtitle">${r.competenciaLabel}</span></td>
                <td data-label="Área / Setor"><span class="cell-title">${r.setor}</span></td>
                <td data-label="Auditor">${r.auditor}</td>
                <td data-label="Ocorrência"><span class="pill pill--soft">${r.instancia}ª ocorrência</span></td>
                <td data-label="Status">${statusBadge(r.status)}</td>
              </tr>`,
                )
                .join("") ||
              `<tr><td colspan="5"><div class="empty-state">Nenhum registro com estes filtros.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>`;

  document
    .getElementById("crono-competencia")
    .addEventListener("change", (evento) => {
      container.dataset.comp = evento.target.value;
      container.dataset.semana = "Todas";
      renderCronograma();
    });
  document
    .getElementById("crono-auditor")
    .addEventListener("change", (evento) => {
      container.dataset.auditor = evento.target.value;
      renderCronograma();
    });
  document
    .getElementById("crono-semana")
    .addEventListener("change", (evento) => {
      container.dataset.semana = evento.target.value;
      renderCronograma();
    });
  document
    .getElementById("crono-status")
    .addEventListener("change", (evento) => {
      container.dataset.status = evento.target.value;
      renderCronograma();
    });
}

function renderAreas() {
  const container = document.getElementById("view-areas");
  const concluidas = estado.cronograma.filter(
    (r) => r.status === "Concluída" && Number.isFinite(r.notaMedia),
  );

  container.innerHTML = `
    <div class="toolbar"><span class="pill">${SETORES.length} áreas cadastradas</span><span class="pill pill--soft">2 ocorrências por área / mês</span></div>
    <section class="panel">
      <div class="panel__header"><div><h2>Áreas do programa 5S</h2><p>Cadastro usado para gerar o cronograma recorrente.</p></div></div>
      <div class="panel__body">
        <div class="area-grid">
          ${SETORES.map((setor) => {
            const notas = concluidas
              .filter((r) => r.setor === setor)
              .map((r) => r.notaMedia);
            const media = notas.length
              ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)
              : "–";
            return `
              <article class="area-card">
                <strong>${setor}</strong>
                <div class="area-card__bottom"><span>2x por mês</span><span>Média: <strong>${media}</strong></span></div>
              </article>`;
          }).join("")}
        </div>
      </div>
    </section>`;
}

function renderResultados() {
  const container = document.getElementById("view-resultados");
  const competencia = container.dataset.comp || competenciaPadrao();
  container.dataset.comp = competencia;

  const registrosMes = registrosDoMes(competencia);
  const concluidas = registrosMes.filter(
    (r) => r.status === "Concluída" && Number.isFinite(r.notaMedia),
  );
  const mediaGeral = concluidas.length
    ? concluidas.reduce((s, r) => s + r.notaMedia, 0) / concluidas.length
    : null;
  const percentual =
    mediaGeral === null ? 0 : Math.round((mediaGeral / 3) * 100);
  const setoresAvaliados = new Set(concluidas.map((r) => r.setor));

  const setoresComResultado = [...setoresAvaliados]
    .map((setor) => {
      const registrosSetor = registrosMes
        .filter((r) => r.setor === setor)
        .sort((a, b) => a.instancia - b.instancia);
      const concluidasSetor = registrosSetor.filter(
        (r) => r.status === "Concluída" && Number.isFinite(r.notaMedia),
      );
      const media =
        concluidasSetor.reduce((s, r) => s + r.notaMedia, 0) /
        concluidasSetor.length;
      return {
        setor,
        media,
        qtd: concluidasSetor.length,
        registros: registrosSetor,
      };
    })
    .sort((a, b) => b.media - a.media);

  container.innerHTML = `
    <div class="toolbar">
      ${selectCompetencias("resultado-competencia", competencia)}
      <div class="toolbar__spacer"></div>
      <span class="pill pill--soft">Escala: 1 a 3</span>
    </div>

    <div class="metrics">
      ${metricCard("star", mediaGeral === null ? "–" : mediaGeral.toFixed(2), "Nota média", "Média das auditorias concluídas")}
      ${metricCard("check-circle", concluidas.length, "Com resultado", "Auditorias concluídas", "metric-card--success")}
      ${metricCard("grid", setoresAvaliados.size, "Áreas avaliadas", `de ${SETORES.length} áreas`, "metric-card--blue")}
      ${metricCard("percent", concluidas.length ? `${percentual}%` : "–", "Índice médio", "Nota média convertida em percentual", "metric-card--warning")}
    </div>

    <div class="layout-2">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h2>Resultados por área</h2>
            <p>Abra uma área para comparar a 1ª e a 2ª instância e ver a média do mês.</p>
          </div>
        </div>
        <div class="panel__body">
          ${
            setoresComResultado.length
              ? `
            <div class="result-sector-list">
              ${setoresComResultado
                .map((item, indice) => {
                  const concluida1 = item.registros.find(
                    (r) =>
                      r.instancia === 1 &&
                      r.status === "Concluída" &&
                      Number.isFinite(r.notaMedia),
                  );
                  const concluida2 = item.registros.find(
                    (r) =>
                      r.instancia === 2 &&
                      r.status === "Concluída" &&
                      Number.isFinite(r.notaMedia),
                  );
                  const reg1 = item.registros.find((r) => r.instancia === 1);
                  const reg2 = item.registros.find((r) => r.instancia === 2);
                  const mediaRotulo =
                    item.qtd === 2 ? "Média do mês" : "Média parcial";

                  const renderInstancia = (numero, registro, concluida) => `
                  <div class="instance-result">
                    <div class="instance-result__top">
                      <span class="instance-result__label">${numero}ª instância</span>
                      <div class="instance-result__note">
                        <strong>${concluida ? concluida.notaMedia.toFixed(2) : "–"}</strong><span>/ 3</span>
                      </div>
                    </div>
                    <div class="instance-result__meta">
                      <div class="instance-result__meta-row">${icon("user")}<span>${registro ? registro.auditor : "Sem auditor"}</span></div>
                      <div class="instance-result__meta-row">${icon("calendar")}<span>${registro ? `${registro.semanaNumero}ª semana de ${registro.competenciaLabel}` : "Sem programação"}</span></div>
                    </div>
                    <div class="instance-result__status">${registro ? statusBadge(concluida ? "Concluída" : "Pendente") : statusBadge("Pendente")}</div>
                  </div>`;

                  return `
                  <details class="result-sector" ${indice === 0 ? "open" : ""}>
                    <summary class="result-sector__summary">
                      <div class="result-sector__identity">
                        <span class="result-sector__rank">${indice + 1}</span>
                        <div>
                          <strong>${item.setor}</strong>
                          <span>${item.qtd}/2 instâncias concluídas</span>
                        </div>
                      </div>
                      <div class="result-sector__score"><strong>${item.media.toFixed(2)}</strong><span>/ 3</span></div>
                    </summary>
                    <div class="result-sector__details">
                      <div class="instance-grid">
                        ${renderInstancia(1, reg1, concluida1)}
                        ${renderInstancia(2, reg2, concluida2)}
                      </div>
                      <div class="result-monthly">
                        <span>${mediaRotulo}${item.qtd === 1 ? " · falta concluir a outra instância" : " · duas instâncias concluídas"}</span>
                        <strong>${item.media.toFixed(2)} / 3</strong>
                      </div>
                    </div>
                  </details>`;
                })
                .join("")}
            </div>`
              : `<div class="empty-state"><strong>Ainda não há resultados neste mês.</strong>Conclua uma auditoria para o resultado aparecer aqui.</div>`
          }
        </div>
      </section>

      <section class="panel">
        <div class="panel__header"><div><h2>Resultado por auditor</h2><p>Média individual no mês selecionado.</p></div></div>
        <div class="panel__body">
          ${AUDITORES.map((auditor) => {
            const regs = concluidas.filter((r) => r.auditor === auditor);
            const media = regs.length
              ? regs.reduce((s, r) => s + r.notaMedia, 0) / regs.length
              : null;
            return `<div class="kpi-line"><span>${auditor}</span><strong>${media === null ? "–" : media.toFixed(2)} ${regs.length ? `· ${regs.length} concluída(s)` : ""}</strong></div>`;
          }).join("")}
        </div>
      </section>
    </div>`;

  document
    .getElementById("resultado-competencia")
    .addEventListener("change", (evento) => {
      container.dataset.comp = evento.target.value;
      renderResultados();
    });
}

function mostrarToast(mensagem, tipo = "success") {
  const regiao = document.getElementById("toast-region");
  if (!regiao) return;
  const toast = document.createElement("div");
  toast.className = `toast ${tipo === "info" ? "toast--info" : ""}`;
  toast.textContent = mensagem;
  regiao.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 220);
  }, 3000);
}

function atualizarProgressoChecklist() {
  const respondidas = document.querySelectorAll(
    '#question-list input[type="radio"]:checked',
  ).length;
  const total = PERGUNTAS_5S.length;
  const percentual = total ? Math.round((respondidas / total) * 100) : 0;
  document.getElementById("audit-progress-label").textContent =
    `${respondidas} de ${total} critérios respondidos`;
  document.getElementById("audit-progress-percent").textContent =
    `${percentual}%`;
  document.getElementById("audit-progress-bar").style.width = `${percentual}%`;
  const concluir = document.getElementById("complete-audit");
  concluir.disabled = respondidas !== total;
  concluir.title =
    respondidas === total
      ? "Concluir auditoria"
      : `Faltam ${total - respondidas} resposta(s)`;
}

async function abrirAuditoria(id) {
  const resumo = estado.cronograma.find((r) => r.id === id);
  if (
    !resumo ||
    resumo.auditor !== auditorAtivo ||
    resumo.status === "Concluída"
  )
    return;

  try {
    atualizarEstadoAutosave("Carregando auditoria…", true);
    const detalhe = await api(`/auditorias/${id}`);
    const registro = aplicarDetalhe(detalhe);
    auditoriaAbertaId = id;

    document.getElementById("audit-title").textContent = registro.setor;
    document.getElementById("audit-meta").textContent =
      `${registro.auditor} · ${registro.instancia}ª ocorrência · ${registro.semanaLabel}`;
    document.getElementById("audit-notes").value = registro.observacoes || "";
    document.getElementById("question-list").innerHTML = PERGUNTAS_5S.map(
      (pergunta, indice) => {
        const numero = indice + 1;
        const atual = registro.respostas?.[numero];
        return `
        <article class="question-card">
          <span class="question-card__number">Critério ${String(numero).padStart(2, "0")}</span>
          <p>${pergunta}</p>
          <div class="score-options">
            ${[
              [1, "Ruim"],
              [2, "Regular"],
              [3, "Bom"],
            ]
              .map(
                ([nota, nome]) => `
              <div class="score-option score-option--${nota}">
                <input type="radio" id="q${numero}-${nota}" name="q${numero}" value="${nota}" ${String(atual) === String(nota) ? "checked" : ""}>
                <label for="q${numero}-${nota}"><strong>${nota}</strong> ${nome}</label>
              </div>`,
              )
              .join("")}
          </div>
        </article>`;
      },
    ).join("");

    document.getElementById("audit-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
    atualizarProgressoChecklist();
    atualizarEstadoAutosave(
      registro.respostasPreenchidas
        ? `${registro.respostasPreenchidas} resposta(s) salvas nesta demonstração`
        : "Salvamento automático local ativo",
    );
  } catch (erro) {
    console.error(erro);
    alert(erro.message);
  }
}

function coletarRespostas() {
  const respostas = {};
  PERGUNTAS_5S.forEach((_, indice) => {
    const numero = indice + 1;
    const selecionada = document.querySelector(
      `input[name="q${numero}"]:checked`,
    );
    if (selecionada) respostas[numero] = Number(selecionada.value);
  });
  return respostas;
}

function respostasParaApi(respostas) {
  return Object.entries(respostas).map(([numeroPergunta, nota]) => ({
    numeroPergunta: Number(numeroPergunta),
    nota: Number(nota),
  }));
}

function atualizarEstadoAutosave(texto, salvando = false) {
  const el = document.getElementById("autosave-state");
  if (!el) return;
  el.textContent = texto;
  el.classList.toggle("is-saving", salvando);
}

async function persistirAuditoriaAberta() {
  const registro = estado.cronograma.find((r) => r.id === auditoriaAbertaId);
  if (!registro || registro.status === "Concluída") return registro;

  const respostas = coletarRespostas();
  const observacoes = document.getElementById("audit-notes").value.trim();
  registro.respostas = respostas;
  registro.respostasPreenchidas = Object.keys(respostas).length;
  registro.observacoes = observacoes;

  atualizarEstadoAutosave("Salvando no navegador…", true);
  try {
    const detalhe = await api(`/auditorias/${registro.id}/respostas`, {
      method: "PUT",
      body: JSON.stringify({
        respostas: respostasParaApi(respostas),
        observacoes,
      }),
    });
    const atualizado = aplicarDetalhe(detalhe);
    const agora = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    atualizarEstadoAutosave(`Salvo localmente às ${agora}`);
    return atualizado;
  } catch (erro) {
    atualizarEstadoAutosave("Falha ao salvar localmente.");
    throw erro;
  }
}

function agendarAutosave() {
  atualizarEstadoAutosave("Aguardando salvamento…", true);
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    autosaveEmAndamento = autosaveEmAndamento
      .then(() => persistirAuditoriaAberta())
      .catch((erro) => {
        console.error(erro);
        mostrarToast(erro.message, "info");
      });
  }, 550);
}

async function salvarProgresso() {
  try {
    window.clearTimeout(autosaveTimer);
    await autosaveEmAndamento;
    await persistirAuditoriaAberta();
    fecharAuditoria(false);
    mostrarToast(
      "Progresso salvo neste navegador. Você pode continuar depois.",
      "info",
    );
    renderAll();
  } catch (erro) {
    alert(erro.message);
  }
}

async function concluirAuditoria() {
  const registro = estado.cronograma.find((r) => r.id === auditoriaAbertaId);
  if (!registro) return;
  const respostas = coletarRespostas();
  if (Object.keys(respostas).length !== PERGUNTAS_5S.length) {
    alert(
      `Responda todos os ${PERGUNTAS_5S.length} critérios antes de concluir a auditoria.`,
    );
    return;
  }
  if (
    !confirm(
      `Concluir a auditoria fictícia de ${registro.setor}? O resultado ficará salvo neste navegador.`,
    )
  )
    return;

  const botao = document.getElementById("complete-audit");
  botao.disabled = true;
  botao.textContent = "Concluindo…";
  try {
    window.clearTimeout(autosaveTimer);
    await autosaveEmAndamento;
    await persistirAuditoriaAberta();
    const detalhe = await api(`/auditorias/${registro.id}/concluir`, {
      method: "PUT",
    });
    const atualizado = aplicarDetalhe(detalhe);
    auditoriaAbertaId = null;
    document.getElementById("audit-modal").classList.add("hidden");
    document.body.classList.remove("modal-open");
    mostrarToast(
      `Auditoria de ${atualizado.setor} concluída com nota ${atualizado.notaMedia.toFixed(2)}.`,
    );
    renderAll();
  } catch (erro) {
    alert(erro.message);
    atualizarProgressoChecklist();
  } finally {
    botao.textContent = "Concluir auditoria";
  }
}

const VIEW_META = {
  minhas: [
    "Área do auditor",
    "Minhas Auditorias",
    "Veja o que está programado para você e execute o checklist 5S.",
  ],
  acompanhamento: [
    "Gestão do mês",
    "Acompanhamento",
    "Acompanhe execução, pendências e distribuição entre os três auditores.",
  ],
  cronograma: [
    "Planejamento",
    "Cronograma",
    "Consulte as duas ocorrências mensais de cada área organizadas por semana.",
  ],
  areas: [
    "Cadastro-base",
    "Áreas",
    "Visualize as áreas que alimentam o programa recorrente de auditorias.",
  ],
  resultados: [
    "Indicadores 5S",
    "Resultados",
    "Acompanhe as notas calculadas a partir dos checklists concluídos.",
  ],
};

function alterarView(view) {
  if (!VIEW_META[view]) return;
  viewAtual = view;
  document
    .querySelectorAll(".view")
    .forEach((secao) =>
      secao.classList.toggle("active", secao.id === `view-${view}`),
    );
  document
    .querySelectorAll("[data-view]")
    .forEach((botao) =>
      botao.classList.toggle("active", botao.dataset.view === view),
    );
  document.getElementById("page-eyebrow").textContent = VIEW_META[view][0];
  document.getElementById("page-title").textContent = VIEW_META[view][1];
  document.getElementById("page-subtitle").textContent = VIEW_META[view][2];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderHeader();
  renderMinhas();
  renderAcompanhamento();
  renderCronograma();
  renderAreas();
  renderResultados();
  atualizarIndicadorApi();
}

document
  .querySelectorAll("[data-view]")
  .forEach((botao) =>
    botao.addEventListener("click", () => alterarView(botao.dataset.view)),
  );
document
  .querySelectorAll("[data-view-link]")
  .forEach((botao) =>
    botao.addEventListener("click", () => alterarView(botao.dataset.viewLink)),
  );

function selecionarAuditor(nome) {
  if (!AUDITORES.includes(nome)) return;
  auditorAtivo = nome;
  localStorage.setItem(AUDITOR_KEY, auditorAtivo);
  renderAll();
}

document
  .getElementById("auditor-ativo")
  .addEventListener("change", (evento) =>
    selecionarAuditor(evento.target.value),
  );

function abrirSeletorAuditor() {
  renderHeader();
  document.getElementById("auditor-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}
function fecharSeletorAuditor() {
  document.getElementById("auditor-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}
const mobileAuditorSwitch = document.getElementById("mobile-auditor-switch");
if (mobileAuditorSwitch)
  mobileAuditorSwitch.addEventListener("click", abrirSeletorAuditor);
document
  .getElementById("close-auditor-modal")
  .addEventListener("click", fecharSeletorAuditor);
document
  .getElementById("auditor-options")
  .addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-select-auditor]");
    if (!botao) return;
    selecionarAuditor(botao.dataset.selectAuditor);
    fecharSeletorAuditor();
    mostrarToast(`Auditor alterado para ${auditorAtivo}.`, "info");
  });
document.getElementById("auditor-modal").addEventListener("click", (evento) => {
  if (evento.target.id === "auditor-modal") fecharSeletorAuditor();
});

document.body.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-open-audit]");
  if (botao) abrirAuditoria(Number(botao.dataset.openAudit));
});

document.getElementById("question-list").addEventListener("change", () => {
  atualizarProgressoChecklist();
  agendarAutosave();
});
document
  .getElementById("audit-notes")
  .addEventListener("input", agendarAutosave);

async function fecharAuditoria(salvarAntes = true) {
  window.clearTimeout(autosaveTimer);
  if (salvarAntes && auditoriaAbertaId !== null) {
    try {
      await autosaveEmAndamento;
      await persistirAuditoriaAberta();
    } catch (erro) {
      console.error(erro);
      mostrarToast(
        "Não foi possível salvar antes de fechar.",
        "info",
      );
      return;
    }
  }
  document.getElementById("audit-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  auditoriaAbertaId = null;
  renderAll();
}

document
  .getElementById("close-modal")
  .addEventListener("click", () => fecharAuditoria(true));
document
  .getElementById("save-progress")
  .addEventListener("click", salvarProgresso);
document.getElementById("audit-form").addEventListener("submit", (evento) => {
  evento.preventDefault();
  concluirAuditoria();
});
document.getElementById("audit-modal").addEventListener("click", (evento) => {
  if (evento.target.id === "audit-modal") fecharAuditoria(true);
});

function abrirGerenciadorDados() {
  atualizarIndicadorApi();
  document.getElementById("data-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}
function fecharGerenciadorDados() {
  document.getElementById("data-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

document
  .getElementById("open-data-manager")
  .addEventListener("click", abrirGerenciadorDados);
const mobileDataManager = document.getElementById("mobile-data-manager");
if (mobileDataManager)
  mobileDataManager.addEventListener("click", abrirGerenciadorDados);
document
  .getElementById("close-data-manager")
  .addEventListener("click", fecharGerenciadorDados);
document
  .getElementById("data-done")
  .addEventListener("click", fecharGerenciadorDados);
document.getElementById("test-api").addEventListener("click", async () => {
  try {
    await api("/health");
    mostrarToast("Demonstração local funcionando corretamente.");
  } catch (erro) {
    mostrarToast(erro.message, "info");
  }
});
document.getElementById("data-modal").addEventListener("click", (evento) => {
  if (evento.target.id === "data-modal") fecharGerenciadorDados();
});

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  installPromptEvent = evento;
  const botao = document.getElementById("install-app");
  botao.disabled = false;
  botao.textContent = "Instalar no dispositivo";
  document.getElementById("install-help").textContent =
    "Instale a demonstração no dispositivo. Os dados permanecem somente neste navegador.";
});

document.getElementById("install-app").addEventListener("click", async () => {
  if (!installPromptEvent) return;
  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = null;
});

window.addEventListener("appinstalled", () => {
  const botao = document.getElementById("install-app");
  botao.disabled = true;
  botao.textContent = "Aplicativo instalado";
  document.getElementById("install-help").textContent =
    "Aplicativo instalado neste dispositivo.";
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharAuditoria(true);
    document.getElementById("data-modal").classList.add("hidden");
    document.getElementById("auditor-modal").classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
});

if (
  "serviceWorker" in navigator &&
  (location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1")
) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js?v=7.3").catch(() => {}),
  );
}

async function inicializar() {
  renderCarregando();
  alterarView(viewAtual);
  try {
    await api("/health");
    await carregarDadosDaApi();
    renderAll();
    mostrarToast("AuditFlow carregado com dados fictícios de demonstração.");
  } catch (erro) {
    console.error(erro);
    renderErroInicial(erro.message);
    atualizarIndicadorApi();
  }
}

inicializar();
