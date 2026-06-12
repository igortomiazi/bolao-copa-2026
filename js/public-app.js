(() => {
  const DATA_URL = "data/bolao-publico.json";
  const app = document.getElementById("app");
  const menu = document.getElementById("menu");
  const pageTitle = document.getElementById("pageTitle");
  const alertArea = document.getElementById("alertArea");
  const modalRoot = document.getElementById("modalRoot");

  let state = null;
  let currentView = "dashboard";

  const titles = {
    dashboard: "Home",
    matches: "Jogos",
    predictions: "Palpites",
    bonus: "Perguntas bônus",
    ranking: "Ranking geral",
    stats: "Estatísticas",
    rules: "Regras do bolão"
  };

  const KNOCKOUT_PHASES = [
    "16 avos",
    "Oitavas",
    "Quartas",
    "Semifinal",
    "Disputa de terceiro lugar",
    "Final"
  ];

  const TEAM_FLAGS = {
    "México": "mx",
    "África do Sul": "za",
    "Coreia do Sul": "kr",
    "Tchéquia": "cz",
    "Canadá": "ca",
    "Bósnia e Herzegovina": "ba",
    "Estados Unidos": "us",
    "Paraguai": "py",
    "Catar": "qa",
    "Suíça": "ch",
    "Brasil": "br",
    "Marrocos": "ma",
    "Haiti": "ht",
    "Escócia": "gb-sct",
    "Austrália": "au",
    "Turquia": "tr",
    "Alemanha": "de",
    "Curaçao": "cw",
    "Holanda": "nl",
    "Japão": "jp",
    "Costa do Marfim": "ci",
    "Equador": "ec",
    "Suécia": "se",
    "Tunísia": "tn",
    "Espanha": "es",
    "Cabo Verde": "cv",
    "Bélgica": "be",
    "Egito": "eg",
    "Arábia Saudita": "sa",
    "Uruguai": "uy",
    "Irã": "ir",
    "Nova Zelândia": "nz",
    "França": "fr",
    "Senegal": "sn",
    "Iraque": "iq",
    "Noruega": "no",
    "Argentina": "ar",
    "Argélia": "dz",
    "Áustria": "at",
    "Jordânia": "jo",
    "Portugal": "pt",
    "Congo DR": "cd",
    "Inglaterra": "gb-eng",
    "Croácia": "hr",
    "Gana": "gh",
    "Panamá": "pa",
    "Uzbequistão": "uz",
    "Colômbia": "co"
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeSearch(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function toNumberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  function outcome(scoreA, scoreB) {
    if (scoreA > scoreB) return "A";
    if (scoreB > scoreA) return "B";
    return "E";
  }

  function goalDifference(scoreA, scoreB) {
    return Number(scoreA) - Number(scoreB);
  }

  function isKnockoutMatch(match) {
    return KNOCKOUT_PHASES.includes(String(match?.phase || ""));
  }

  function normalizeSide(value) {
    const side = String(value || "").trim().toUpperCase();
    return side === "A" || side === "B" ? side : "";
  }

  function inferWinnerSide(scoreA, scoreB) {
    const result = outcome(scoreA, scoreB);
    return result === "A" || result === "B" ? result : "";
  }

  function sideLabel(match, side) {
    const normalized = normalizeSide(side);
    if (normalized === "A") return match?.teamA || "Seleção A";
    if (normalized === "B") return match?.teamB || "Seleção B";
    return "-";
  }

  function qualifiedTeamText(match, side) {
    const normalized = normalizeSide(side);
    return normalized ? sideLabel(match, normalized) : "-";
  }

  function isAutomaticPrediction(prediction) {
    return Boolean(prediction?.automatic || prediction?.autoDefault);
  }

  function normalizeAnswer(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function defaultScoring(data) {
    return {
      exactScore: 10,
      goalDifference: 7,
      outcome: 5,
      wrong: 0,
      knockoutQualified: 3,
      ...(data?.settings?.scoring || {})
    };
  }

  function normalizeData(data) {
    const now = new Date().toISOString();
    const normalized = {
      meta: { ...(data.meta || {}), updatedAt: data.meta?.updatedAt || now },
      settings: {
        ...(data.settings || {}),
        scoring: defaultScoring(data),
        phases: data.settings?.phases || ["Fase de grupos", "16 avos", "Oitavas", "Quartas", "Semifinal", "Disputa de terceiro lugar", "Final"]
      },
      groups: data.groups || {},
      participants: Array.isArray(data.participants) ? data.participants : [],
      matches: Array.isArray(data.matches) ? data.matches : [],
      predictions: Array.isArray(data.predictions) ? data.predictions : [],
      bonusQuestions: Array.isArray(data.bonusQuestions) ? data.bonusQuestions : [],
      logs: Array.isArray(data.logs) ? data.logs : []
    };

    normalized.participants = normalized.participants.map((participant) => ({
      id: participant.id || uid("p"),
      name: participant.name || "Participante",
      nickname: participant.nickname || participant.name || "",
      notes: participant.notes || "",
      createdAt: participant.createdAt || now,
      updatedAt: participant.updatedAt || now
    }));

    normalized.matches = normalized.matches.map((match) => ({
      id: match.id || uid("m"),
      matchNo: match.matchNo ?? "",
      phase: match.phase || "Fase de grupos",
      group: match.group || "-",
      round: match.round || "",
      date: match.date || "",
      time: match.time || "",
      teamA: match.teamA || "",
      teamB: match.teamB || "",
      venue: match.venue || "",
      scoreA: match.scoreA ?? "",
      scoreB: match.scoreB ?? "",
      qualifiedTeam: normalizeSide(match.qualifiedTeam),
      status: match.status || "agendado",
      createdAt: match.createdAt || now,
      updatedAt: match.updatedAt || now
    }));

    normalized.predictions = normalized.predictions.map((prediction) => ({
      id: prediction.id || uid("pr"),
      participantId: prediction.participantId || "",
      matchId: prediction.matchId || "",
      goalsA: prediction.goalsA ?? "",
      goalsB: prediction.goalsB ?? "",
      qualifiedTeam: normalizeSide(prediction.qualifiedTeam),
      points: Number(prediction.points || 0),
      basePoints: Number(prediction.basePoints || 0),
      exact: Boolean(prediction.exact),
      outcomeHit: Boolean(prediction.outcomeHit),
      goalDifferenceHit: Boolean(prediction.goalDifferenceHit || prediction.goalHit),
      qualifiedHit: Boolean(prediction.qualifiedHit),
      qualifiedPoints: Number(prediction.qualifiedPoints || 0),
      automatic: Boolean(prediction.automatic || prediction.autoDefault),
      autoDefault: Boolean(prediction.autoDefault || prediction.automatic),
      calculatedAt: prediction.calculatedAt || "",
      createdAt: prediction.createdAt || now,
      updatedAt: prediction.updatedAt || now
    }));

    normalized.bonusQuestions = normalized.bonusQuestions.map((question) => ({
      id: question.id || uid("b"),
      question: question.question || "Pergunta bônus",
      answerType: question.answerType || "texto",
      answerPreset: question.answerPreset || "nenhuma",
      options: Array.isArray(question.options) ? question.options : [],
      correctAnswer: question.correctAnswer ?? "",
      points: Number(question.points || 0),
      status: question.status || "aberto",
      answers: Array.isArray(question.answers) ? question.answers : [],
      createdAt: question.createdAt || now,
      updatedAt: question.updatedAt || now
    }));

    return recalculateAll(normalized);
  }

  async function loadPublicData() {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Não foi possível carregar ${DATA_URL}. Status ${response.status}.`);
    const data = await response.json();
    return normalizeData(data);
  }

  function calculatePrediction(prediction, match, scoring) {
    const realA = toNumberOrNull(match.scoreA);
    const realB = toNumberOrNull(match.scoreB);
    const predA = toNumberOrNull(prediction.goalsA);
    const predB = toNumberOrNull(prediction.goalsB);
    const rules = {
      exactScore: Number(scoring.exactScore ?? 10),
      goalDifference: Number(scoring.goalDifference ?? 7),
      outcome: Number(scoring.outcome ?? 5),
      wrong: Number(scoring.wrong ?? 0),
      knockoutQualified: Number(scoring.knockoutQualified ?? 3)
    };
    const empty = {
      points: 0,
      basePoints: 0,
      exact: false,
      outcomeHit: false,
      goalDifferenceHit: false,
      qualifiedHit: false,
      qualifiedPoints: 0,
      calculatedAt: ""
    };

    if (match.status !== "finalizado" || realA === null || realB === null || predA === null || predB === null) return empty;

    const realOutcome = outcome(realA, realB);
    const predOutcome = outcome(predA, predB);
    const exact = realA === predA && realB === predB;
    const outcomeHit = realOutcome === predOutcome;
    const goalDifferenceHit = outcomeHit && realOutcome !== "E" && goalDifference(realA, realB) === goalDifference(predA, predB);
    let basePoints = rules.wrong;

    if (exact) {
      basePoints = rules.exactScore;
    } else if (goalDifferenceHit) {
      basePoints = rules.goalDifference;
    } else if (outcomeHit) {
      basePoints = rules.outcome;
    }

    const knockout = isKnockoutMatch(match);
    const matchQualified = normalizeSide(match.qualifiedTeam || inferWinnerSide(realA, realB));
    const predictionQualified = normalizeSide(prediction.qualifiedTeam);
    const qualifiedHit = knockout && matchQualified !== "" && predictionQualified !== "" && matchQualified === predictionQualified;
    const qualifiedPoints = qualifiedHit ? rules.knockoutQualified : 0;

    return {
      points: basePoints + qualifiedPoints,
      basePoints,
      exact,
      outcomeHit,
      goalDifferenceHit,
      qualifiedHit,
      qualifiedPoints,
      calculatedAt: new Date().toISOString()
    };
  }

  function ensureAutomaticPredictions(data) {
    const predictions = [...data.predictions];
    const existing = new Set(predictions.map((prediction) => `${prediction.participantId}|${prediction.matchId}`));
    data.matches
      .filter((match) => match.status === "finalizado" && toNumberOrNull(match.scoreA) !== null && toNumberOrNull(match.scoreB) !== null)
      .forEach((match) => {
        data.participants.forEach((participant) => {
          const key = `${participant.id}|${match.id}`;
          if (existing.has(key)) return;
          predictions.push({
            id: `auto_${participant.id}_${match.id}`,
            participantId: participant.id,
            matchId: match.id,
            goalsA: 0,
            goalsB: 0,
            qualifiedTeam: "",
            points: 0,
            basePoints: 0,
            exact: false,
            outcomeHit: false,
            goalDifferenceHit: false,
            qualifiedHit: false,
            qualifiedPoints: 0,
            automatic: true,
            autoDefault: true,
            calculatedAt: "",
            createdAt: match.updatedAt || new Date().toISOString(),
            updatedAt: match.updatedAt || new Date().toISOString()
          });
          existing.add(key);
        });
      });
    return predictions;
  }

  function calculateBonusQuestion(question) {
    const correct = normalizeAnswer(question.correctAnswer);
    const canCalculate = ["fechado", "calculado"].includes(question.status) && correct !== "";
    return {
      ...question,
      answers: question.answers.map((answer) => {
        const hit = canCalculate && normalizeAnswer(answer.answer) === correct;
        return { ...answer, hit, points: hit ? Number(question.points || 0) : 0 };
      })
    };
  }

  function recalculateAll(data) {
    const scoring = defaultScoring(data);
    const matchesById = Object.fromEntries(data.matches.map((match) => [match.id, match]));
    const withAutomatic = ensureAutomaticPredictions({ ...data, predictions: data.predictions || [] });
    const predictions = withAutomatic.map((prediction) => {
      const match = matchesById[prediction.matchId];
      if (!match) return prediction;
      return { ...prediction, ...calculatePrediction(prediction, match, scoring) };
    });
    const bonusQuestions = data.bonusQuestions.map(calculateBonusQuestion);
    return { ...data, settings: { ...data.settings, scoring }, predictions, bonusQuestions };
  }

  function buildRanking(data = state) {
    const bonusMap = new Map();
    data.bonusQuestions.forEach((question) => {
      question.answers.forEach((answer) => {
        bonusMap.set(answer.participantId, (bonusMap.get(answer.participantId) || 0) + Number(answer.points || 0));
      });
    });

    const matchesById = Object.fromEntries(data.matches.map((match) => [match.id, match]));
    const scoring = defaultScoring(data);
    const predictionMap = new Map();
    data.predictions.forEach((prediction) => {
      const current = predictionMap.get(prediction.participantId) || {
        gamePoints: 0,
        exactCount: 0,
        outcomeCount: 0,
        qualifiedCount: 0,
        predictionsCount: 0,
        scoredPredictionsCount: 0,
        maxPointsPossible: 0
      };
      current.gamePoints += Number(prediction.points || 0);
      current.exactCount += prediction.exact ? 1 : 0;
      current.outcomeCount += prediction.outcomeHit ? 1 : 0;
      current.qualifiedCount += prediction.qualifiedHit ? 1 : 0;
      current.scoredPredictionsCount += 1;
      const match = matchesById[prediction.matchId];
      current.maxPointsPossible += scoring.exactScore + (isKnockoutMatch(match) ? (scoring.knockoutQualified ?? 3) : 0);
      current.predictionsCount += isAutomaticPrediction(prediction) ? 0 : 1;
      predictionMap.set(prediction.participantId, current);
    });

    return data.participants.map((participant) => {
      const games = predictionMap.get(participant.id) || { gamePoints: 0, exactCount: 0, outcomeCount: 0, qualifiedCount: 0, predictionsCount: 0, scoredPredictionsCount: 0, maxPointsPossible: 0 };
      const bonusPoints = bonusMap.get(participant.id) || 0;
      const total = games.gamePoints + bonusPoints;
      const scoredPredictionsCount = games.scoredPredictionsCount || 0;
      return {
        participantId: participant.id,
        name: participant.name,
        nickname: participant.nickname,
        createdAt: participant.createdAt,
        gamePoints: games.gamePoints,
        bonusPoints,
        total,
        exactCount: games.exactCount,
        outcomeCount: games.outcomeCount,
        qualifiedCount: games.qualifiedCount,
        predictionsCount: games.predictionsCount,
        scoredPredictionsCount,
        maxPointsPossible: games.maxPointsPossible || 0,
        efficiency: games.maxPointsPossible ? Math.round((games.gamePoints / games.maxPointsPossible) * 100) : 0
      };
    }).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      if (b.outcomeCount !== a.outcomeCount) return b.outcomeCount - a.outcomeCount;
      if (b.predictionsCount !== a.predictionsCount) return b.predictionsCount - a.predictionsCount;
      const dateCompare = String(a.createdAt || "9999").localeCompare(String(b.createdAt || "9999"));
      if (dateCompare !== 0) return dateCompare;
      return String(a.nickname || a.name).localeCompare(String(b.nickname || b.name), "pt-BR");
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return escapeHtml(value);
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function participantName(id) {
    const participant = state.participants.find((item) => item.id === id);
    return participant ? participant.nickname || participant.name : "-";
  }

  function matchById(id) {
    return state.matches.find((match) => match.id === id);
  }

  function statusBadge(status) {
    return `<span class="badge ${escapeHtml(status)}">${escapeHtml(status || "-")}</span>`;
  }

  function teamHtml(name) {
    const clean = String(name || "-");
    const code = TEAM_FLAGS[clean];
    if (!code) return `<span class="team"><span class="flag-fallback">--</span>${escapeHtml(clean)}</span>`;
    const url = `https://flagcdn.com/24x18/${code}.png`;
    const url2x = `https://flagcdn.com/48x36/${code}.png 2x`;
    return `<span class="team"><img class="flag-img" src="${url}" srcset="${url2x}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'flag-fallback',textContent:'${escapeHtml(code.toUpperCase())}'}))" />${escapeHtml(clean)}</span>`;
  }

  function matchHtml(match, showScore = true) {
    const score = showScore && match.status === "finalizado" && match.scoreA !== "" && match.scoreB !== ""
      ? `<strong class="score-inline">${escapeHtml(match.scoreA)} x ${escapeHtml(match.scoreB)}</strong>`
      : `<span class="versus">x</span>`;
    return `${teamHtml(match.teamA)} ${score} ${teamHtml(match.teamB)}`;
  }

  function resultText(match) {
    if (match.status === "finalizado" && match.scoreA !== "" && match.scoreB !== "") {
      const qualified = isKnockoutMatch(match) && normalizeSide(match.qualifiedTeam || inferWinnerSide(Number(match.scoreA), Number(match.scoreB)))
        ? ` <span class="badge success">classificado: ${escapeHtml(qualifiedTeamText(match, match.qualifiedTeam || inferWinnerSide(Number(match.scoreA), Number(match.scoreB))))}</span>`
        : "";
      return `<strong>${escapeHtml(match.scoreA)} x ${escapeHtml(match.scoreB)}</strong>${qualified}`;
    }
    return "-";
  }

  function criterionText(prediction) {
    if (!prediction) return "-";
    const parts = [];
    if (prediction.exact) parts.push("Placar exato");
    else if (prediction.goalDifferenceHit) parts.push("Vencedor + saldo");
    else if (prediction.outcomeHit) parts.push("Resultado correto");
    else if (Number(prediction.points || 0) === 0) parts.push("-");
    if (prediction.qualifiedHit) parts.push("Classificado");
    return parts.filter(Boolean).join(" + ") || "-";
  }

  function criterionMeta(prediction, match) {
    if (!match || match.status !== "finalizado") {
      return {
        className: "criterion-pending",
        shortLabel: "Aguardando resultado",
        title: "Este jogo ainda não foi finalizado, então a pontuação ainda não foi calculada."
      };
    }

    if (!prediction) {
      return {
        className: "criterion-missing",
        shortLabel: "Sem palpite",
        title: "Nenhum palpite localizado para este participante neste jogo."
      };
    }

    const basePoints = Number(prediction.basePoints || 0);
    const qualifiedPoints = Number(prediction.qualifiedPoints || 0);
    const totalPoints = Number(prediction.points || 0);

    let meta;
    if (prediction.exact) {
      meta = {
        className: "criterion-exact",
        shortLabel: "Placar exato",
        title: `Acertou o placar exato. Base: ${basePoints} ponto(s).`
      };
    } else if (prediction.goalDifferenceHit) {
      meta = {
        className: "criterion-goal-diff",
        shortLabel: "Vencedor + saldo",
        title: `Acertou o vencedor e a diferença/saldo de gols. Base: ${basePoints} ponto(s).`
      };
    } else if (prediction.outcomeHit) {
      meta = {
        className: "criterion-outcome",
        shortLabel: "Vencedor/empate",
        title: `Acertou o vencedor ou acertou que seria empate. Base: ${basePoints} ponto(s).`
      };
    } else {
      meta = {
        className: "criterion-wrong",
        shortLabel: "Errou tudo",
        title: `Não acertou nenhum critério de pontuação do placar. Base: ${basePoints} ponto(s).`
      };
    }

    if (isKnockoutMatch(match)) {
      if (qualifiedPoints > 0) {
        meta.title += ` Acertou o classificado/vencedor do mata-mata: +${qualifiedPoints} ponto(s).`;
      } else if (normalizeSide(prediction.qualifiedTeam)) {
        meta.title += " Não acertou o classificado/vencedor do mata-mata.";
      } else {
        meta.title += " Sem classificado/vencedor informado no palpite.";
      }
    }

    meta.title += ` Total: ${totalPoints} ponto(s).`;
    return meta;
  }

  function predictionPointsSummaryHtml(prediction, match) {
    const meta = criterionMeta(prediction, match);

    if (!match || match.status !== "finalizado") {
      return `<span class="muted-inline" title="${escapeHtml(meta.title)}">${escapeHtml(meta.shortLabel)}</span>`;
    }

    if (!prediction) {
      return `<span class="muted-inline" title="${escapeHtml(meta.title)}">${escapeHtml(meta.shortLabel)}</span>`;
    }

    const totalPoints = Number(prediction.points || 0);
    const extraDetails = [];
    if (isKnockoutMatch(match)) {
      if (Number(prediction.qualifiedPoints || 0) > 0) {
        extraDetails.push(`+${escapeHtml(prediction.qualifiedPoints)} classificado`);
      } else if (normalizeSide(prediction.qualifiedTeam)) {
        extraDetails.push("classificado não pontuou");
      }
    }

    return `
      <div class="prediction-points-box" title="${escapeHtml(meta.title)}">
        <span class="badge criterion-badge ${escapeHtml(meta.className)}">${escapeHtml(totalPoints)} pts</span>
        <small><strong>${escapeHtml(meta.shortLabel)}</strong></small>
        ${extraDetails.length ? `<small class="muted-inline">${escapeHtml(extraDetails.join(" · "))}</small>` : ""}
      </div>`;
  }

  function matchPredictions(matchId) {
    return state.predictions.filter((prediction) => prediction.matchId === matchId);
  }

  function matchSummaryStats(match, predictions) {
    if (!match || match.status !== "finalizado") {
      return {
        total: predictions.length,
        scored: 0,
        zero: 0,
        average: 0,
        max: 0
      };
    }
    const total = predictions.length;
    const scored = predictions.filter((prediction) => Number(prediction.points || 0) > 0).length;
    const zero = predictions.filter((prediction) => Number(prediction.points || 0) === 0).length;
    const totalPoints = predictions.reduce((sum, prediction) => sum + Number(prediction.points || 0), 0);
    const max = predictions.reduce((best, prediction) => Math.max(best, Number(prediction.points || 0)), 0);
    return {
      total,
      scored,
      zero,
      average: total ? Number((totalPoints / total).toFixed(2)) : 0,
      max
    };
  }

  function matchResultSummaryHtml(match) {
    if (!match || match.status !== "finalizado" || match.scoreA === "" || match.scoreB === "") {
      return `<div class="modal-result-box pending"><strong>Resultado:</strong> aguardando finalização do jogo.</div>`;
    }

    const qualified = isKnockoutMatch(match) && normalizeSide(match.qualifiedTeam || inferWinnerSide(Number(match.scoreA), Number(match.scoreB)))
      ? `<div><strong>Classificado/vencedor:</strong> ${escapeHtml(qualifiedTeamText(match, match.qualifiedTeam || inferWinnerSide(Number(match.scoreA), Number(match.scoreB))))}</div>`
      : "";

    return `
      <div class="modal-result-box">
        <div><strong>Resultado final:</strong> ${matchHtml(match, true)}</div>
        ${qualified}
      </div>`;
  }

  function matchStatsHtml(stats) {
    return `
      <div class="modal-match-stats">
        <div><strong>${escapeHtml(stats.total)}</strong><span>Total de palpites</span></div>
        <div><strong>${escapeHtml(stats.scored)}</strong><span>Pontuaram</span></div>
        <div><strong>${escapeHtml(stats.zero)}</strong><span>Zeraram</span></div>
        <div><strong>${escapeHtml(stats.average)}</strong><span>Média</span></div>
        <div><strong>${escapeHtml(stats.max)}</strong><span>Maior pontuação</span></div>
      </div>`;
  }

  function predictionText(prediction, match = null) {
    if (!prediction) return "-";
    const suffix = isAutomaticPrediction(prediction) ? ` <span class="badge">0x0 automático</span>` : "";
    const qualified = match && isKnockoutMatch(match) && normalizeSide(prediction.qualifiedTeam)
      ? ` <span class="badge">classificado: ${escapeHtml(qualifiedTeamText(match, prediction.qualifiedTeam))}</span>`
      : "";
    return `<strong>${escapeHtml(prediction.goalsA)} x ${escapeHtml(prediction.goalsB)}</strong>${qualified}${suffix}`;
  }

  function table(headers, rows) {
    if (!rows.length) return emptyState();
    return `<div class="table-wrap"><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function emptyState(message = "Nenhum registro encontrado.") {
    return `<div class="empty-state"><strong>${escapeHtml(message)}</strong></div>`;
  }

  function toast(message, type = "") {
    const alert = document.createElement("div");
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alertArea.appendChild(alert);
    setTimeout(() => alert.remove(), 5200);
  }

  function publicNotice() {
    return `<div class="notice"><strong>Modo consulta pública:</strong> esta versão não grava nada no GitHub e não salva alterações no navegador. O que vale é o arquivo publicado em <span class="code-path">data/bolao-publico.json</span>.</div>`;
  }

  function filtersHtml(kind) {
    const phases = [...new Set(state.matches.map((match) => match.phase).filter(Boolean))];
    const groups = [...new Set(state.matches.map((match) => match.group).filter(Boolean))];
    return `
      <div class="filters" data-filters="${kind}">
        <input type="search" id="${kind}Search" placeholder="Buscar seleção, participante, fase..." />
        <select id="${kind}Phase"><option value="">Todas as fases</option>${phases.map((phase) => `<option value="${escapeHtml(phase)}">${escapeHtml(phase)}</option>`).join("")}</select>
        <select id="${kind}Group"><option value="">Todos os grupos</option>${groups.map((group) => `<option value="${escapeHtml(group)}">Grupo ${escapeHtml(group)}</option>`).join("")}</select>
        <select id="${kind}Status"><option value="">Todos os status</option><option value="agendado">agendado</option><option value="andamento">andamento</option><option value="finalizado">finalizado</option></select>
      </div>
    `;
  }

  function filterMatches(kind) {
    const search = normalizeSearch(document.getElementById(`${kind}Search`)?.value || "");
    const phase = document.getElementById(`${kind}Phase`)?.value || "";
    const group = document.getElementById(`${kind}Group`)?.value || "";
    const status = document.getElementById(`${kind}Status`)?.value || "";
    return state.matches
      .filter((match) => !phase || match.phase === phase)
      .filter((match) => !group || match.group === group)
      .filter((match) => !status || match.status === status)
      .filter((match) => {
        if (!search) return true;
        return normalizeSearch(`${match.matchNo} ${match.teamA} ${match.teamB} ${match.phase} ${match.group} ${match.round} ${match.venue}`).includes(search);
      })
      .sort((a, b) => `${a.date} ${a.time} ${a.matchNo}`.localeCompare(`${b.date} ${b.time} ${b.matchNo}`));
  }

  function dashboardView() {
    const ranking = buildRanking();
    const finished = state.matches.filter((match) => match.status === "finalizado").length;
    const leader = ranking[0];
    const upcoming = [...state.matches]
      .filter((match) => match.status !== "finalizado")
      .sort((a, b) => `${a.date} ${a.time} ${a.matchNo}`.localeCompare(`${b.date} ${b.time} ${b.matchNo}`))
      .slice(0, 5);

    return `
      ${publicNotice()}
      <div class="grid-4">
        <div class="kpi-card"><span class="kpi-label">Participantes</span><span class="kpi-value">${state.participants.length}</span><span class="kpi-note">cadastrados</span></div>
        <div class="kpi-card"><span class="kpi-label">Jogos</span><span class="kpi-value">${state.matches.length}</span><span class="kpi-note">tabela oficial</span></div>
        <div class="kpi-card"><span class="kpi-label">Finalizados</span><span class="kpi-value">${finished}</span><span class="kpi-note">com resultado</span></div>
        <div class="kpi-card"><span class="kpi-label">Líder atual</span><span class="kpi-value">${leader ? escapeHtml(leader.nickname || leader.name) : "-"}</span><span class="kpi-note">${leader ? `${leader.total} pontos` : "sem pontos"}</span></div>
      </div>

      <section class="card">
        <div class="card-header">
          <div><h2>Regras e premiação</h2><p>Resumo oficial do bolão e critérios de desempate.</p></div>
          <button class="btn" type="button" data-open-rules>Ver regras</button>
        </div>
        <div class="grid-3">
          <div class="rule-box"><strong>70%</strong><span>Primeiro lugar</span></div>
          <div class="rule-box"><strong>20%</strong><span>Segundo lugar</span></div>
          <div class="rule-box"><strong>10%</strong><span>Terceiro lugar</span></div>
        </div>
      </section>

      <div class="grid-2">
        <section class="card">
          <div class="card-header"><div><h2>Próximos jogos</h2><p>Ordenados por data e horário.</p></div></div>
          ${table(["Data", "Fase", "Jogo", "Sede", "Status"], upcoming.map((match) => [
            `${formatDate(match.date)} ${escapeHtml(match.time)}`,
            `<span class="phase-pill">${escapeHtml(match.phase)}</span>`,
            `${match.matchNo ? `<strong>#${escapeHtml(match.matchNo)}</strong> ` : ""}${matchHtml(match, false)}`,
            escapeHtml(match.venue || "-"),
            statusBadge(match.status)
          ]))}
        </section>
        <section class="card">
          <div class="card-header"><div><h2>Ranking resumido</h2><p>Top 5 por pontuação total.</p></div></div>
          ${table(["#", "Participante", "Jogos", "Bônus", "Total"], ranking.slice(0, 5).map((row, index) => [
            `<strong>${index + 1}</strong>`,
            escapeHtml(row.nickname || row.name),
            row.gamePoints,
            row.bonusPoints,
            `<strong>${row.total}</strong>`
          ]))}
        </section>
      </div>

      <section class="card">
        <div class="card-header"><div><h2>Pontuação geral</h2><p>Gráfico simples do ranking atual.</p></div></div>
        ${barChart(ranking.map((row) => ({ label: row.nickname || row.name, value: row.total })))}
      </section>
    `;
  }

  function matchesView() {
    const rows = filterMatches("matches").map((match) => [
      match.matchNo ? `#${escapeHtml(match.matchNo)}` : "-",
      `${formatDate(match.date)} ${escapeHtml(match.time)}`,
      `<span class="phase-pill">${escapeHtml(match.phase)}</span>`,
      escapeHtml(match.group || "-"),
      matchHtml(match, false),
      escapeHtml(match.venue || "-"),
      resultText(match),
      statusBadge(match.status),
      `<button class="btn compact ghost" type="button" data-match-predictions="${escapeHtml(match.id)}">Ver palpites</button>`
    ]);
    return `
      <section class="card">
        <div class="card-header"><div><h2>Jogos</h2><p>Consulta da tabela e resultados publicados pelo administrador.</p></div></div>
        ${filtersHtml("matches")}
        <div id="matchesTable">${table(["Nº", "Data", "Fase", "Grupo", "Jogo", "Sede", "Placar", "Status", "Ações"], rows)}</div>
      </section>
    `;
  }

  function predictionsView() {
    return `
      <section class="card">
        <div class="card-header"><div><h2>Palpites</h2><p>Somente consulta. Palpites ausentes em jogos finalizados aparecem como 0x0 automático.</p></div></div>
        <div class="filters" data-filters="predictions">
          <input type="search" id="predSearch" placeholder="Buscar participante, seleção ou fase" />
          <select id="predParticipant"><option value="">Todos os participantes</option>${state.participants.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nickname || p.name)}</option>`).join("")}</select>
          <select id="predStatus"><option value="">Todos os status</option><option value="agendado">agendado</option><option value="andamento">andamento</option><option value="finalizado">finalizado</option></select>
          <select id="predOnly"><option value="all">Todos</option><option value="manual">Só cadastrados manualmente</option><option value="auto">Só 0x0 automático</option></select>
        </div>
        <div id="predictionsTable">${predictionsTableHtml()}</div>
      </section>
    `;
  }

  function predictionsTableHtml() {
    const search = normalizeSearch(document.getElementById("predSearch")?.value || "");
    const participantId = document.getElementById("predParticipant")?.value || "";
    const status = document.getElementById("predStatus")?.value || "";
    const only = document.getElementById("predOnly")?.value || "all";
    const rows = state.predictions
      .filter((prediction) => !participantId || prediction.participantId === participantId)
      .filter((prediction) => only === "all" || (only === "manual" && !isAutomaticPrediction(prediction)) || (only === "auto" && isAutomaticPrediction(prediction)))
      .filter((prediction) => {
        const match = matchById(prediction.matchId);
        return !status || match?.status === status;
      })
      .filter((prediction) => {
        if (!search) return true;
        const match = matchById(prediction.matchId);
        return normalizeSearch(`${participantName(prediction.participantId)} ${match?.teamA || ""} ${match?.teamB || ""} ${match?.phase || ""} ${match?.group || ""} ${match?.matchNo || ""}`).includes(search);
      })
      .sort((a, b) => participantName(a.participantId).localeCompare(participantName(b.participantId), "pt-BR") || String(matchById(a.matchId)?.matchNo || "").localeCompare(String(matchById(b.matchId)?.matchNo || ""), "pt-BR"))
      .map((prediction) => {
        const match = matchById(prediction.matchId);
        return [
          escapeHtml(participantName(prediction.participantId)),
          match ? matchHtml(match, false) : "-",
          predictionText(prediction, match),
          match ? statusBadge(match.status) : "-",
          `<strong>${prediction.points || 0}</strong>`,
          criterionText(prediction)
        ];
      });
    return table(["Participante", "Jogo", "Palpite", "Status", "Pontos", "Critério"], rows);
  }

  function bonusView() {
    const rows = state.bonusQuestions.map((question) => [
      escapeHtml(question.question),
      escapeHtml(question.answerType),
      question.points,
      escapeHtml(question.correctAnswer || "-"),
      statusBadge(question.status),
      `<button class="btn small ghost" data-bonus-modal="${escapeHtml(question.id)}">Ver respostas</button>`
    ]);
    return `
      <section class="card">
        <div class="card-header"><div><h2>Perguntas bônus</h2><p>Consulta das respostas e pontuação bônus publicadas.</p></div></div>
        ${table(["Pergunta", "Tipo", "Pontos", "Resposta correta", "Status", "Respostas"], rows)}
      </section>
    `;
  }

  function rankingView() {
    const ranking = buildRanking();
    return `
      <section class="card">
        <div class="card-header"><div><h2>Pódio</h2><p>Premiação: 70% / 20% / 10%.</p></div></div>
        ${podiumHtml(ranking)}
      </section>
      <section class="card">
        <div class="card-header"><div><h2>Ranking geral</h2><p>Desempate: placares exatos, resultados corretos, palpites cadastrados e cadastro mais antigo.</p></div></div>
        ${table(["Posição", "Participante", "Jogos", "Bônus", "Total", "Placares exatos", "Resultados corretos", "Classificados", "Palpites registrados"], ranking.map((row, index) => [
          `<strong>${index + 1}</strong>`,
          escapeHtml(row.nickname || row.name),
          row.gamePoints,
          row.bonusPoints,
          `<strong>${row.total}</strong>`,
          row.exactCount,
          row.outcomeCount,
          row.qualifiedCount,
          row.predictionsCount
        ]))}
      </section>
      <section class="card"><div class="card-header"><div><h2>Total por participante</h2><p>Ranking em gráfico.</p></div></div>${barChart(ranking.map((row) => ({ label: row.nickname || row.name, value: row.total })))}</section>
    `;
  }

  function statsView() {
    const ranking = buildRanking();
    const finalized = state.matches.filter((match) => match.status === "finalizado");
    const hardest = finalized.map((match) => {
      const predictions = state.predictions.filter((prediction) => prediction.matchId === match.id);
      const avg = predictions.length ? predictions.reduce((sum, prediction) => sum + Number(prediction.points || 0), 0) / predictions.length : 0;
      const wrong = predictions.filter((prediction) => Number(prediction.points || 0) === 0).length;
      return { match, avg: Number(avg.toFixed(2)), wrong, wrongPercent: predictions.length ? Math.round((wrong / predictions.length) * 100) : 0, total: predictions.length };
    }).sort((a, b) => a.avg - b.avg || b.wrongPercent - a.wrongPercent).slice(0, 8);

    const phaseRows = [];
    state.participants.forEach((participant) => {
      state.settings.phases.forEach((phase) => {
        const points = state.predictions
          .filter((prediction) => prediction.participantId === participant.id && matchById(prediction.matchId)?.phase === phase)
          .reduce((sum, prediction) => sum + Number(prediction.points || 0), 0);
        if (points > 0 || state.matches.some((match) => match.phase === phase)) phaseRows.push([escapeHtml(participant.nickname || participant.name), escapeHtml(phase), points]);
      });
    });

    return `
      <div class="grid-2">
        <section class="card"><div class="card-header"><div><h2>Resumo</h2><p>Principais estatísticas.</p></div></div>
          <div class="stat-list">
            ${statItem("Mais placares exatos", ranking[0] ? `${mostBy(ranking, "exactCount").nickname || mostBy(ranking, "exactCount").name} · ${mostBy(ranking, "exactCount").exactCount}` : "-")}
            ${statItem("Mais resultados corretos", ranking[0] ? `${mostBy(ranking, "outcomeCount").nickname || mostBy(ranking, "outcomeCount").name} · ${mostBy(ranking, "outcomeCount").outcomeCount}` : "-")}
            ${statItem("Mais classificados no mata-mata", ranking[0] ? `${mostBy(ranking, "qualifiedCount").nickname || mostBy(ranking, "qualifiedCount").name} · ${mostBy(ranking, "qualifiedCount").qualifiedCount}` : "-")}
            ${statItem("Jogos finalizados", String(finalized.length))}
            ${statItem("Última atualização", formatDateTime(state.meta.updatedAt || state.meta.publicPublishedAt))}
          </div>
        </section>
        <section class="card"><div class="card-header"><div><h2>Aproveitamento</h2><p>Pontos de jogos sobre o máximo possível dos palpites manuais.</p></div></div>${barChart(ranking.map((row) => ({ label: row.nickname || row.name, value: row.efficiency, suffix: "%" })))}</section>
      </div>
      <section class="card"><div class="card-header"><div><h2>Evolução por rodada</h2><p>Pontuação acumulada por rodada finalizada.</p></div></div>${lineChartEvolution(rankingEvolutionByRound())}</section>
      <div class="grid-2">
        <section class="card"><div class="card-header"><div><h2>Jogos mais difíceis</h2><p>Menor média de pontos por palpite.</p></div></div>${table(["Jogo", "Fase", "Média", "Erraram"], hardest.map((row) => [matchHtml(row.match, true), escapeHtml(row.match.phase), row.avg, `${row.wrongPercent}%`]))}</section>
        <section class="card"><div class="card-header"><div><h2>Pontuação por fase</h2><p>Total por participante e fase.</p></div></div>${table(["Participante", "Fase", "Pontos"], phaseRows)}</section>
      </div>
    `;
  }

  function rulesView() {
    return `
      <section class="card">
        <div class="card-header"><div><h2>Regras de pontuação</h2><p>Regras oficiais usadas no cálculo automático.</p></div></div>
        ${rulesHtml()}
      </section>
    `;
  }

  function rulesHtml() {
    const scoring = defaultScoring(state);
    return `
      <div class="rules-grid">
        <div class="rule-box"><strong>${scoring.exactScore} pts</strong><span>Placar exato</span><p>Acertou exatamente o placar, seja vitória ou empate. Ex.: palpite 2x1 e resultado 2x1; ou palpite 0x0 e resultado 0x0.</p></div>
        <div class="rule-box"><strong>${scoring.goalDifference} pts</strong><span>Vencedor + saldo de gols</span><p>Acertou o vencedor e a diferença de gols. Ex.: palpite 4x2 e resultado 2x0.</p></div>
        <div class="rule-box"><strong>${scoring.outcome} pts</strong><span>Resultado correto</span><p>Acertou apenas o vencedor ou o empate. Ex.: palpite 3x0 e resultado 1x0; ou 2x2 e resultado 0x0.</p></div>
        <div class="rule-box"><strong>${scoring.wrong || 0} pts</strong><span>Errou tudo</span><p>Não acertou o placar, nem o vencedor/empate, nem o saldo quando aplicável.</p></div>
        <div class="rule-box"><strong>+${scoring.knockoutQualified ?? 3} pts</strong><span>Classificado no mata-mata</span><p>Nos jogos eliminatórios, soma bônus se acertar quem se classifica/vence. O placar usado é o do jogo até o fim da prorrogação.</p></div>
        <div class="rule-box"><strong>Pênaltis</strong><span>Não entram no placar</span><p>Se o jogo terminar empatado e for decidido nos pênaltis, o placar do bolão continua empatado; o classificado é informado separadamente.</p></div>
        <div class="rule-box"><strong>0x0</strong><span>Palpite ausente</span><p>Se não houver palpite cadastrado até o horário do jogo, ele é considerado 0x0 automaticamente. No mata-mata, não recebe bônus de classificado.</p></div>
        <div class="rule-box"><strong>70/20/10</strong><span>Premiação</span><p>70% para o primeiro lugar, 20% para o segundo lugar e 10% para o terceiro lugar.</p></div>
      </div>
      <section class="card" style="box-shadow:none;margin:18px 0 0;padding:16px;background:var(--surface-2)">
        <h2>Exemplos do mata-mata</h2>
        <ul>
          <li>Palpite 1x1 + Brasil classificado; resultado 1x1 + Brasil nos pênaltis = ${scoring.exactScore + (scoring.knockoutQualified ?? 3)} pontos.</li>
          <li>Palpite 2x2 + Brasil classificado; resultado 0x0 + Brasil nos pênaltis = ${scoring.outcome + (scoring.knockoutQualified ?? 3)} pontos.</li>
          <li>Palpite Brasil 2x0 + Brasil classificado; resultado 1x1 + Brasil nos pênaltis = ${scoring.knockoutQualified ?? 3} pontos.</li>
        </ul>
      </section>
      <section class="card" style="box-shadow:none;margin:18px 0 0;padding:16px;background:var(--surface-2)">
        <h2>Critérios de desempate</h2>
        <p>Em caso de empate na pontuação, serão aplicados nesta ordem:</p>
        <ol>
          <li>Maior número de placares exatos acertados;</li>
          <li>Maior número de resultados corretos;</li>
          <li>Participante que registrou palpites em maior número de partidas;</li>
          <li>Data e hora do cadastro mais antigo na plataforma.</li>
        </ol>
      </section>
    `;
  }

  function podiumHtml(ranking) {
    if (!ranking.length) return emptyState();
    const medals = ["🥇", "🥈", "🥉"];
    return `<div class="podium-grid">${ranking.slice(0, 3).map((row, index) => `<div class="podium-card"><div class="podium-medal">${medals[index]}</div><strong>${escapeHtml(row.nickname || row.name)}</strong><span>${row.total} pontos</span><small>${row.exactCount} exatos · ${row.outcomeCount} resultados corretos · ${row.qualifiedCount} classificados</small></div>`).join("")}</div>`;
  }

  function barChart(items) {
    if (!items.length) return emptyState();
    const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);
    return `<div class="chart-list">${items.map((item) => {
      const percent = Math.max(4, Math.round((Number(item.value || 0) / max) * 100));
      return `<div class="bar-row"><strong>${escapeHtml(item.label)}</strong><div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div><span>${escapeHtml(item.value)}${item.suffix || ""}</span></div>`;
    }).join("")}</div>`;
  }

  function statItem(label, value) {
    return `<div class="stat-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function mostBy(rows, key) {
    return [...rows].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0];
  }

  function rankingEvolutionByRound() {
    const sortedMatches = [...state.matches]
      .filter((match) => match.status === "finalizado")
      .sort((a, b) => `${a.date} ${a.time} ${a.matchNo || ""}`.localeCompare(`${b.date} ${b.time} ${b.matchNo || ""}`));
    const roundOrder = [];
    const roundMatches = new Map();
    sortedMatches.forEach((match) => {
      const key = match.round || match.phase || "Sem rodada";
      if (!roundMatches.has(key)) { roundMatches.set(key, []); roundOrder.push(key); }
      roundMatches.get(key).push(match.id);
    });
    const totals = new Map(state.participants.map((participant) => [participant.id, 0]));
    return roundOrder.map((round) => {
      const ids = new Set(roundMatches.get(round));
      state.predictions.forEach((prediction) => {
        if (!ids.has(prediction.matchId)) return;
        totals.set(prediction.participantId, (totals.get(prediction.participantId) || 0) + Number(prediction.points || 0));
      });
      return { round, participants: state.participants.map((participant) => ({ participantId: participant.id, name: participant.nickname || participant.name, points: totals.get(participant.id) || 0 })) };
    });
  }

  function lineChartEvolution(roundEvolution) {
    if (!roundEvolution.length) return emptyState("Sem rodadas finalizadas para exibir evolução.");
    const participants = state.participants.slice(0, 10);
    const width = 940;
    const height = 320;
    const pad = 42;
    const maxPoints = Math.max(1, ...roundEvolution.flatMap((round) => round.participants.map((item) => Number(item.points || 0))));
    const xStep = roundEvolution.length > 1 ? (width - pad * 2) / (roundEvolution.length - 1) : 0;
    const pointX = (roundIndex) => roundEvolution.length > 1 ? pad + roundIndex * xStep : width / 2;
    const pointY = (participantId, round) => {
      const item = round.participants.find((row) => row.participantId === participantId);
      return height - pad - ((Number(item?.points || 0) / maxPoints) * (height - pad * 2));
    };
    const colors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2", "#be123c", "#4f46e5", "#65a30d", "#c026d3"];
    const lines = participants.map((participant, index) => {
      const color = colors[index % colors.length];
      const coords = roundEvolution.map((round, roundIndex) => ({
        x: pointX(roundIndex),
        y: pointY(participant.id, round)
      }));
      const points = coords.map((point) => `${point.x},${point.y}`).join(" ");
      const line = coords.length > 1
        ? `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`
        : "";
      const markers = coords.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${color}" stroke="var(--surface)" stroke-width="2"><title>${escapeHtml(participant.nickname || participant.name)}: ${Math.round(((height - pad - point.y) / (height - pad * 2)) * maxPoints)} pontos</title></circle>`).join("");
      return line + markers;
    }).join("");
    const labels = roundEvolution.map((round, index) => {
      const x = pointX(index);
      const label = round.round.length > 12 ? `${round.round.slice(0, 10)}…` : round.round;
      return `<text x="${x}" y="${height - 10}" text-anchor="middle" class="svg-label">${escapeHtml(label)}</text>`;
    }).join("");
    const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = height - pad - ratio * (height - pad * 2);
      const value = Math.round(maxPoints * ratio);
      return `<line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" class="svg-grid" /><text x="8" y="${y + 4}" class="svg-label">${value}</text>`;
    }).join("");
    const legend = participants.map((participant, index) => `<span style="display:inline-flex;align-items:center;gap:6px;margin:6px 12px 0 0"><i style="display:inline-block;width:14px;height:4px;background:${colors[index % colors.length]};border-radius:99px"></i>${escapeHtml(participant.nickname || participant.name)}</span>`).join("");
    return `<div class="table-wrap"><svg class="svg-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução de pontuação por rodada">${grid}${lines}${labels}</svg></div><div style="margin-top:8px;color:var(--muted)">${legend}</div>`;
  }

  function openModal(title, bodyHtml) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal-card" role="dialog" aria-modal="true"><div class="modal-header"><h2>${escapeHtml(title)}</h2><button class="modal-close" type="button" data-close-modal>×</button></div><div class="modal-body">${bodyHtml}</div><div class="modal-footer"><button class="btn ghost" type="button" data-close-modal>Fechar</button></div></div></div>`;
    modalRoot.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modalRoot.innerHTML = ""));
    modalRoot.querySelector(".modal-backdrop").addEventListener("click", (event) => { if (event.target.classList.contains("modal-backdrop")) modalRoot.innerHTML = ""; });
  }

  function matchPredictionsModal(matchId) {
    const match = matchById(matchId);
    if (!match) return;

    const predictions = matchPredictions(match.id);
    const stats = matchSummaryStats(match, predictions);
    const maxPoints = match.status === "finalizado" ? stats.max : -1;

    const ordered = predictions
      .map((prediction, index) => ({ prediction, index }))
      .sort((left, right) => {
        if (match.status !== "finalizado") return left.index - right.index;
        return Number(right.prediction.points || 0) - Number(left.prediction.points || 0) || left.index - right.index;
      });

    const rows = ordered.map(({ prediction }) => {
      const points = Number(prediction.points || 0);
      const bestBadge = match.status === "finalizado" && maxPoints > 0 && points === maxPoints
        ? ` <span class="badge criterion-best">🏆 Melhor do jogo</span>`
        : "";
      return [
        `<strong>${escapeHtml(participantName(prediction.participantId))}</strong>`,
        predictionText(prediction, match),
        predictionPointsSummaryHtml(prediction, match) + bestBadge
      ];
    });

    const body = `
      ${matchResultSummaryHtml(match)}
      ${match.status === "finalizado" ? matchStatsHtml(stats) : `<p class="modal-helper-text">A pontuação aparecerá automaticamente depois que o resultado for publicado.</p>`}
      <p class="modal-helper-text">${match.status === "finalizado" ? "Ordenado por maior pontuação no jogo. Passe o mouse sobre a pontuação para ver a explicação do critério." : "Ordem de participantes mantida enquanto o jogo não estiver finalizado."}</p>
      ${table(["Participante", "Palpite", "Pontuação / regra"], rows)}
    `;

    openModal(`${match.matchNo ? `#${escapeHtml(match.matchNo)} · ` : ""}${match.teamA} x ${match.teamB}`, body);
  }

  function bonusResponsesModal(questionId) {
    const question = state.bonusQuestions.find((item) => item.id === questionId);
    if (!question) return;
    const rows = state.participants.map((participant) => {
      const answer = question.answers.find((item) => item.participantId === participant.id) || { answer: "", hit: false, points: 0 };
      return [
        escapeHtml(participant.nickname || participant.name),
        escapeHtml(answer.answer || "-"),
        answer.hit ? `<span class="badge success">acertou</span>` : "-",
        `<strong>${answer.points || 0}</strong>`
      ];
    });
    openModal(question.question, `<p style="margin-top:0;color:var(--muted)">Resposta correta: <strong>${escapeHtml(question.correctAnswer || "não definida")}</strong> · Status: ${escapeHtml(question.status)} · Pontos: ${question.points}</p>${table(["Participante", "Resposta", "Resultado", "Pontos"], rows)}`);
  }

  function render(view = currentView) {
    currentView = view;
    pageTitle.textContent = titles[view] || "Bolão";
    menu.querySelectorAll("button[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    const views = { dashboard: dashboardView, matches: matchesView, predictions: predictionsView, bonus: bonusView, ranking: rankingView, stats: statsView, rules: rulesView };
    app.innerHTML = (views[view] || dashboardView)();
    bindViewEvents(view);
  }

  function bindMatchPredictionButtons() {
    app.querySelectorAll("[data-match-predictions]").forEach((button) => {
      button.addEventListener("click", () => matchPredictionsModal(button.dataset.matchPredictions));
    });
  }

  function bindViewEvents(view) {
    if (view === "matches") {
      app.querySelectorAll("[data-filters='matches'] input, [data-filters='matches'] select").forEach((element) => element.addEventListener("input", () => {
        const rows = filterMatches("matches").map((match) => [match.matchNo ? `#${escapeHtml(match.matchNo)}` : "-", `${formatDate(match.date)} ${escapeHtml(match.time)}`, `<span class="phase-pill">${escapeHtml(match.phase)}</span>`, escapeHtml(match.group || "-"), matchHtml(match, false), escapeHtml(match.venue || "-"), resultText(match), statusBadge(match.status), `<button class="btn compact ghost" type="button" data-match-predictions="${escapeHtml(match.id)}">Ver palpites</button>`]);
        document.getElementById("matchesTable").innerHTML = table(["Nº", "Data", "Fase", "Grupo", "Jogo", "Sede", "Placar", "Status", "Ações"], rows);
        bindMatchPredictionButtons();
      }));
      bindMatchPredictionButtons();
    }
    if (view === "predictions") {
      app.querySelectorAll("#predSearch, #predParticipant, #predStatus, #predOnly").forEach((element) => element.addEventListener("input", () => {
        document.getElementById("predictionsTable").innerHTML = predictionsTableHtml();
      }));
    }
    app.querySelectorAll("[data-open-rules]").forEach((button) => button.addEventListener("click", () => openModal("Regras do bolão", rulesHtml())));
    app.querySelectorAll("[data-bonus-modal]").forEach((button) => button.addEventListener("click", () => bonusResponsesModal(button.dataset.bonusModal)));
  }

  function bindGlobalEvents() {
    menu.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-view]");
      if (!button) return;
      render(button.dataset.view);
    });
    document.getElementById("btnReload").addEventListener("click", () => window.location.reload());
    const themeButton = document.getElementById("btnTheme");
    const storedTheme = localStorage.getItem("bolaoPublicTheme") || "light";
    document.documentElement.dataset.theme = storedTheme;
    themeButton.textContent = storedTheme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro";
    themeButton.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("bolaoPublicTheme", next);
      themeButton.textContent = next === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro";
    });
  }

  async function init() {
    bindGlobalEvents();
    try {
      state = await loadPublicData();
      render("dashboard");
    } catch (error) {
      console.error(error);
      app.innerHTML = `<section class="card"><h2>Erro ao carregar dados</h2><p>${escapeHtml(error.message || "Não foi possível carregar o JSON público.")}</p><p>Confira se o arquivo <span class="code-path">data/bolao-publico.json</span> foi publicado junto com o site.</p></section>`;
      toast("Erro ao carregar o JSON público.", "error");
    }
  }

  init();
})();
