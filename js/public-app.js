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
    cupTable: "Tabela da Copa",
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
      knockoutDrawOutcome: 6,
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

    normalized.predictions = normalized.predictions
      .filter((prediction) => !isAutomaticPrediction(prediction))
      .map((prediction) => ({
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
        automatic: false,
        autoDefault: false,
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
      knockoutDrawOutcome: Number(scoring.knockoutDrawOutcome ?? scoring.knockoutDrawPoints ?? 6),
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

    if (isAutomaticPrediction(prediction) || match.status !== "finalizado" || realA === null || realB === null || predA === null || predB === null) return empty;

    const realOutcome = outcome(realA, realB);
    const predOutcome = outcome(predA, predB);
    const exact = realA === predA && realB === predB;
    const outcomeHit = realOutcome === predOutcome;
    const knockout = isKnockoutMatch(match);
    const knockoutDrawOutcomeHit = knockout && !exact && realOutcome === "E" && predOutcome === "E";
    const goalDifferenceHit = outcomeHit && realOutcome !== "E" && goalDifference(realA, realB) === goalDifference(predA, predB);
    let basePoints = rules.wrong;

    if (exact) {
      basePoints = rules.exactScore;
    } else if (goalDifferenceHit) {
      basePoints = rules.goalDifference;
    } else if (outcomeHit) {
      basePoints = knockoutDrawOutcomeHit ? rules.knockoutDrawOutcome : rules.outcome;
    }

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
    const predictions = (data.predictions || [])
      .filter((prediction) => !isAutomaticPrediction(prediction))
      .map((prediction) => {
        const match = matchesById[prediction.matchId];
        if (!match) return prediction;
        return { ...prediction, automatic: false, autoDefault: false, ...calculatePrediction(prediction, match, scoring) };
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
      const match = matchesById[prediction.matchId];
      current.predictionsCount += 1;

      const hasFinalResult = match
        && match.status === "finalizado"
        && toNumberOrNull(match.scoreA) !== null
        && toNumberOrNull(match.scoreB) !== null;

      if (hasFinalResult) {
        current.gamePoints += Number(prediction.points || 0);
        current.exactCount += prediction.exact ? 1 : 0;
        current.outcomeCount += prediction.outcomeHit ? 1 : 0;
        current.qualifiedCount += prediction.qualifiedHit ? 1 : 0;
        current.scoredPredictionsCount += 1;
        current.maxPointsPossible += scoring.exactScore + (isKnockoutMatch(match) ? (scoring.knockoutQualified ?? 3) : 0);
      }

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

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function prizeConfig() {
    const distribution = state?.settings?.prizeDistribution || {};
    return {
      entryFee: Number(state?.settings?.entryFee || 0),
      first: Number(distribution.first ?? 70),
      second: Number(distribution.second ?? 20),
      third: Number(distribution.third ?? 10)
    };
  }

  function prizeAmount(position) {
    const config = prizeConfig();
    const total = config.entryFee * (state?.participants?.length || 0);
    const percent = position === 0 ? config.first : position === 1 ? config.second : position === 2 ? config.third : 0;
    return Math.round((total * percent) / 100 * 100) / 100;
  }

  function prizeSummaryHtml() {
    const config = prizeConfig();
    const total = config.entryFee * state.participants.length;
    return `
      <section class="card">
        <div class="card-header"><div><h2>Premiação</h2><p>Entrada de ${formatMoney(config.entryFee)} por participante.</p></div></div>
        <div class="grid-4">
          <div class="kpi-card"><span class="kpi-label">Total arrecadado</span><span class="kpi-value">${formatMoney(total)}</span><span class="kpi-note">${state.participants.length} participantes</span></div>
          <div class="kpi-card"><span class="kpi-label">1º lugar · ${config.first}%</span><span class="kpi-value">${formatMoney(prizeAmount(0))}</span><span class="kpi-note">campeão do bolão</span></div>
          <div class="kpi-card"><span class="kpi-label">2º lugar · ${config.second}%</span><span class="kpi-value">${formatMoney(prizeAmount(1))}</span><span class="kpi-note">vice-líder</span></div>
          <div class="kpi-card"><span class="kpi-label">3º lugar · ${config.third}%</span><span class="kpi-value">${formatMoney(prizeAmount(2))}</span><span class="kpi-note">terceiro colocado</span></div>
        </div>
      </section>`;
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
    return `<span class="matchup-inline">${teamHtml(match.teamA)}${score}${teamHtml(match.teamB)}</span>`;
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

  function criterionText(prediction, match = null) {
    const meta = criterionMeta(prediction, match);
    return meta?.shortLabel || "-";
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
      const realOutcome = outcome(toNumberOrNull(match.scoreA), toNumberOrNull(match.scoreB));
      const outcomeLabel = realOutcome === "E" ? "Empate correto" : "Vencedor correto";
      meta = {
        className: "criterion-outcome",
        shortLabel: outcomeLabel,
        title: `${outcomeLabel}. Base: ${basePoints} ponto(s).`
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
        <div><strong>${escapeHtml(stats.total)}</strong><span>Palpites cadastrados</span></div>
        <div><strong>${escapeHtml(stats.scored)}</strong><span>Pontuaram</span></div>
        <div><strong>${escapeHtml(stats.zero)}</strong><span>Zeraram</span></div>
        <div><strong>${escapeHtml(stats.average)}</strong><span>Média</span></div>
        <div><strong>${escapeHtml(stats.max)}</strong><span>Maior pontuação</span></div>
      </div>`;
  }

  function predictionText(prediction, match = null) {
    if (!prediction) return `<span class="muted-inline">Sem palpite</span>`;
    const qualified = match && isKnockoutMatch(match) && normalizeSide(prediction.qualifiedTeam)
      ? `<span class="prediction-qualified-badge">classificado: ${escapeHtml(qualifiedTeamText(match, prediction.qualifiedTeam))}</span>`
      : "";
    return `<span class="prediction-pick"><strong class="prediction-score">${escapeHtml(prediction.goalsA)} x ${escapeHtml(prediction.goalsB)}</strong>${qualified}</span>`;
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

  function matchOrderValue(match) {
    const numericNo = Number(match?.matchNo);
    if (Number.isFinite(numericNo) && numericNo > 0) return String(numericNo).padStart(4, "0");
    return `9999-${match?.date || "9999-99-99"}-${match?.time || "99:99"}`;
  }

  function sortByOfficialMatchOrder(a, b) {
    return matchOrderValue(a).localeCompare(matchOrderValue(b), "pt-BR")
      || `${a?.date || ""} ${a?.time || ""}`.localeCompare(`${b?.date || ""} ${b?.time || ""}`, "pt-BR");
  }

  function currentLocalDateISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDaysISO(dateISO, days) {
    const [year, month, day] = String(dateISO || currentLocalDateISO()).split("-").map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    date.setDate(date.getDate() + Number(days || 0));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function dayFilterOptions() {
    const dates = [...new Set(state.matches.map((match) => match.date).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return `
      <option value="">Todos os dias</option>
      <option value="__today__">Hoje</option>
      <option value="__tomorrow__">Amanhã</option>
      <option value="__next2__">Próximos 2 dias</option>
      ${dates.map((date) => `<option value="${escapeHtml(date)}">${formatDate(date)}</option>`).join("")}
    `;
  }

  function dateMatchesDayFilter(matchDate, filterValue) {
    if (!filterValue) return true;
    const today = currentLocalDateISO();
    if (filterValue === "__today__") return matchDate === today;
    if (filterValue === "__tomorrow__") return matchDate === addDaysISO(today, 1);
    if (filterValue === "__next2__") return matchDate >= today && matchDate <= addDaysISO(today, 2);
    return matchDate === filterValue;
  }

  function statusMatchesFilter(matchStatus, filterValue) {
    if (!filterValue) return true;
    if (filterValue === "aberto") return matchStatus !== "finalizado";
    return matchStatus === filterValue;
  }

  function quickFiltersHtml(kind) {
    return `
      <div class="quick-filters" data-quick-filters="${kind}" aria-label="Filtros rápidos">
        <button class="btn small ghost" type="button" data-quick-filter="today">Hoje</button>
        <button class="btn small ghost" type="button" data-quick-filter="tomorrow">Amanhã</button>
        <button class="btn small ghost" type="button" data-quick-filter="next2">Próximos 2 dias</button>
        <button class="btn small ghost" type="button" data-quick-filter="open">Em aberto</button>
        <button class="btn small ghost" type="button" data-quick-filter="finished">Finalizados</button>
        <button class="btn small ghost" type="button" data-quick-filter="all">Todos</button>
      </div>
    `;
  }

  function filtersHtml(kind) {
    const phases = [...new Set(state.matches.map((match) => match.phase).filter(Boolean))];
    const groups = [...new Set(state.matches.map((match) => match.group).filter(Boolean))];
    return `
      <div class="filters" data-filters="${kind}">
        <input type="search" id="${kind}Search" placeholder="Buscar seleção, participante, fase..." />
        <select id="${kind}Phase"><option value="">Todas as fases</option>${phases.map((phase) => `<option value="${escapeHtml(phase)}">${escapeHtml(phase)}</option>`).join("")}</select>
        <select id="${kind}Day">${dayFilterOptions()}</select>
        <select id="${kind}Group"><option value="">Todos os grupos</option>${groups.map((group) => `<option value="${escapeHtml(group)}">Grupo ${escapeHtml(group)}</option>`).join("")}</select>
        <select id="${kind}Status"><option value="">Todos os status</option><option value="aberto">em aberto</option><option value="agendado">agendado</option><option value="andamento">andamento</option><option value="finalizado">finalizado</option></select>
      </div>
    `;
  }

  function filterMatches(kind) {
    const search = normalizeSearch(document.getElementById(`${kind}Search`)?.value || "");
    const phase = document.getElementById(`${kind}Phase`)?.value || "";
    const day = document.getElementById(`${kind}Day`)?.value || "";
    const group = document.getElementById(`${kind}Group`)?.value || "";
    const status = document.getElementById(`${kind}Status`)?.value || "";
    return state.matches
      .filter((match) => !phase || match.phase === phase)
      .filter((match) => dateMatchesDayFilter(match.date, day))
      .filter((match) => !group || match.group === group)
      .filter((match) => statusMatchesFilter(match.status, status))
      .filter((match) => {
        if (!search) return true;
        return normalizeSearch(`${match.matchNo} ${match.teamA} ${match.teamB} ${match.phase} ${match.group} ${match.round} ${match.venue} ${match.date}`).includes(search);
      })
      .sort(sortByOfficialMatchOrder);
  }

  function homeUpcomingCardsHtml(matches) {
    if (!matches.length) return emptyState("Nenhum próximo jogo encontrado.");
    return `
      <div class="home-match-list">
        ${matches.map((match) => `
          <article class="home-match-card">
            <div class="home-match-main">
              <span class="home-match-number">${match.matchNo ? `#${escapeHtml(match.matchNo)}` : "Jogo"}</span>
              <strong>${matchHtml(match, false)}</strong>
            </div>
            <div class="home-match-meta">
              <span>${formatDate(match.date)} ${escapeHtml(match.time)}</span>
              <span>${escapeHtml(match.phase)}${match.group && match.group !== "-" ? ` · Grupo ${escapeHtml(match.group)}` : ""}</span>
              <span>${escapeHtml(match.venue || "-")}</span>
            </div>
            <div class="home-match-status">${statusBadge(match.status)}</div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function homeRankingSummaryHtml(ranking) {
    if (!ranking.length) return emptyState("Ranking ainda sem pontuação.");
    return `
      <div class="home-ranking-list">
        ${ranking.slice(0, 5).map((row, index) => `
          <div class="home-ranking-row">
            <div class="home-ranking-position">${index + 1}</div>
            <div>
              <strong>${escapeHtml(row.nickname || row.name)}</strong>
              <span>${escapeHtml(row.gamePoints)} jogos · ${escapeHtml(row.bonusPoints)} bônus</span>
            </div>
            <strong>${escapeHtml(row.total)}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }


  function homeLatestResultsHtml(matches) {
    if (!matches.length) return emptyState("Nenhum resultado publicado ainda.");
    return `
      <div class="home-match-list latest-results-list">
        ${matches.map((match) => `
          <article class="home-match-card latest-result-card">
            <div class="home-match-main">
              <span class="home-match-number">${match.matchNo ? `#${escapeHtml(match.matchNo)}` : "Jogo"}</span>
              <strong>${matchHtml(match, true)}</strong>
            </div>
            <div class="home-match-meta">
              <span>${formatDate(match.date)} ${escapeHtml(match.time)}</span>
              <span>${escapeHtml(match.phase)}</span>
            </div>
            <div class="home-match-status"><button class="btn small ghost" type="button" data-match-predictions="${escapeHtml(match.id)}">Ver palpites</button></div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function dashboardView() {
    const ranking = buildRanking();
    const finished = state.matches.filter((match) => match.status === "finalizado").length;
    const leader = ranking[0];
    const upcoming = [...state.matches]
      .filter((match) => match.status !== "finalizado")
      .sort((a, b) => `${a.date} ${a.time} ${matchOrderValue(a)}`.localeCompare(`${b.date} ${b.time} ${matchOrderValue(b)}`, "pt-BR"))
      .slice(0, 6);
    const latestResults = [...state.matches]
      .filter((match) => match.status === "finalizado")
      .sort((a, b) => `${b.date} ${b.time} ${matchOrderValue(b)}`.localeCompare(`${a.date} ${a.time} ${matchOrderValue(a)}`, "pt-BR"))
      .slice(0, 6);

    return `
      <div class="grid-4">
        <div class="kpi-card"><span class="kpi-label">Líder atual</span><span class="kpi-value">${leader ? escapeHtml(leader.nickname || leader.name) : "-"}</span><span class="kpi-note">${leader ? `${leader.total} pontos` : "sem pontos"}</span></div>
        <div class="kpi-card"><span class="kpi-label">Participantes</span><span class="kpi-value">${state.participants.length}</span><span class="kpi-note">no bolão</span></div>
        <div class="kpi-card"><span class="kpi-label">Jogos finalizados</span><span class="kpi-value">${finished}</span><span class="kpi-note">de ${state.matches.length}</span></div>
        <div class="kpi-card"><span class="kpi-label">Prêmio total</span><span class="kpi-value">${formatMoney(prizeConfig().entryFee * state.participants.length)}</span><span class="kpi-note">entrada de ${formatMoney(prizeConfig().entryFee)}</span></div>
      </div>

      <section class="card public-home-hero">
        <div class="card-header">
          <div><h2>Resumo do bolão</h2><p>Consulta pública do ranking, palpites, tabela da Copa e regras de pontuação.</p></div>
          <button class="btn" type="button" data-open-rules>Ver regras</button>
        </div>
        <div class="grid-3">
          <div class="rule-box"><strong>${formatMoney(prizeAmount(0))}</strong><span>1º lugar · ${prizeConfig().first}%</span></div>
          <div class="rule-box"><strong>${formatMoney(prizeAmount(1))}</strong><span>2º lugar · ${prizeConfig().second}%</span></div>
          <div class="rule-box"><strong>${formatMoney(prizeAmount(2))}</strong><span>3º lugar · ${prizeConfig().third}%</span></div>
        </div>
      </section>

      <div class="grid-2 home-summary-grid">
        <section class="card home-summary-card upcoming-table-card">
          <div class="card-header"><div><h2>Próximos jogos</h2><p>Os próximos confrontos publicados.</p></div></div>
          ${homeUpcomingCardsHtml(upcoming)}
        </section>
        <section class="card home-summary-card latest-results-card">
          <div class="card-header"><div><h2>Últimos resultados</h2><p>Jogos finalizados mais recentes.</p></div></div>
          ${homeLatestResultsHtml(latestResults)}
        </section>
      </div>
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
        <div class="filter-panel">
          ${quickFiltersHtml("matches")}
          ${filtersHtml("matches")}
        </div>
        <div id="matchesTable">${table(["Nº", "Data", "Fase", "Grupo", "Jogo", "Sede", "Placar", "Status", "Ações"], rows)}</div>
      </section>
    `;
  }

  function predictionsView() {
    return `
      <section class="card">
        <div class="card-header"><div><h2>Palpites</h2><p>Somente consulta. Palpites ausentes não pontuam; 0x0 só vale quando foi cadastrado manualmente.</p></div></div>
        <div class="filter-panel">
          ${quickFiltersHtml("predictions")}
          <div class="filters predictions-filters" data-filters="predictions">
            <input type="search" id="predSearch" placeholder="Buscar participante, seleção ou fase" />
            <select id="predParticipant"><option value="">Todos os participantes</option>${state.participants.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nickname || p.name)}</option>`).join("")}</select>
            <select id="predPhase"><option value="">Todas as fases</option>${[...new Set(state.matches.map((match) => match.phase).filter(Boolean))].map((phase) => `<option value="${escapeHtml(phase)}">${escapeHtml(phase)}</option>`).join("")}</select>
            <select id="predDay">${dayFilterOptions()}</select>
            <select id="predStatus"><option value="">Todos os status</option><option value="aberto">em aberto</option><option value="agendado">agendado</option><option value="andamento">andamento</option><option value="finalizado">finalizado</option></select>
            <select id="predView"><option value="grouped">Visualização por jogo</option><option value="table">Visualização em tabela</option></select>
          </div>
        </div>
        <div id="predictionsTable">${predictionsTableHtml()}</div>
      </section>
    `;
  }

  function predictionMatchSortValue(match) {
    return matchOrderValue(match);
  }

  function filteredPredictions() {
    const search = normalizeSearch(document.getElementById("predSearch")?.value || "");
    const participantId = document.getElementById("predParticipant")?.value || "";
    const phase = document.getElementById("predPhase")?.value || "";
    const day = document.getElementById("predDay")?.value || "";
    const status = document.getElementById("predStatus")?.value || "";
    return state.predictions
      .filter((prediction) => !participantId || prediction.participantId === participantId)
      .filter((prediction) => {
        const match = matchById(prediction.matchId);
        if (!match) return false;
        return (!phase || match.phase === phase)
          && dateMatchesDayFilter(match.date, day)
          && statusMatchesFilter(match.status, status);
      })
      .filter((prediction) => {
        if (!search) return true;
        const match = matchById(prediction.matchId);
        return normalizeSearch(`${participantName(prediction.participantId)} ${match?.teamA || ""} ${match?.teamB || ""} ${match?.phase || ""} ${match?.group || ""} ${match?.round || ""} ${match?.matchNo || ""} ${match?.date || ""}`).includes(search);
      })
      .sort((a, b) => {
        const matchA = matchById(a.matchId);
        const matchB = matchById(b.matchId);
        return predictionMatchSortValue(matchA).localeCompare(predictionMatchSortValue(matchB), "pt-BR") || participantName(a.participantId).localeCompare(participantName(b.participantId), "pt-BR");
      });
  }

  function predictionPointsCell(prediction, match = null) {
    if (!match || match.status !== "finalizado") return `<span class="muted-inline">-</span>`;
    return `<strong>${escapeHtml(prediction?.points || 0)}</strong>`;
  }

  function predictionCriterionCell(prediction, match = null) {
    const meta = criterionMeta(prediction, match);
    return `<span class="criterion-inline ${escapeHtml(meta.className || "")}" title="${escapeHtml(meta.title || "")}">${escapeHtml(meta.shortLabel || "-")}</span>`;
  }

  function groupedPredictionsHtml() {
    const predictions = filteredPredictions();
    if (!predictions.length) return emptyState();

    const grouped = new Map();
    predictions.forEach((prediction) => {
      if (!grouped.has(prediction.matchId)) grouped.set(prediction.matchId, []);
      grouped.get(prediction.matchId).push(prediction);
    });

    const orderedGroups = Array.from(grouped.entries())
      .map(([matchId, list]) => ({ match: matchById(matchId), list }))
      .filter((entry) => entry.match)
      .sort((a, b) => predictionMatchSortValue(a.match).localeCompare(predictionMatchSortValue(b.match), "pt-BR"));

    return `
      <div class="prediction-groups">
        ${orderedGroups.map(({ match, list }) => {
          const orderedPredictions = [...list].sort((a, b) => {
            if (match.status === "finalizado") {
              return Number(b.points || 0) - Number(a.points || 0) || participantName(a.participantId).localeCompare(participantName(b.participantId), "pt-BR");
            }
            return participantName(a.participantId).localeCompare(participantName(b.participantId), "pt-BR");
          });

          const resultLine = match.status === "finalizado"
            ? `<div class="prediction-group-result"><strong>Resultado:</strong> ${matchHtml(match, true)}</div>`
            : `<div class="prediction-group-result pending"><strong>Resultado:</strong> aguardando finalização do jogo.</div>`;

          return `
            <details class="prediction-group-card">
              <summary>
                <div class="prediction-group-title">
                  <strong>${match.matchNo ? `#${escapeHtml(match.matchNo)} • ` : ''}${matchHtml(match, false)}</strong>
                  <span>${formatDate(match.date)} ${escapeHtml(match.time)} • ${escapeHtml(match.phase)}${match.group && match.group !== "-" ? ` • Grupo ${escapeHtml(match.group)}` : ""}</span>
                </div>
                <div class="prediction-group-meta">
                  ${statusBadge(match.status)}
                  <span class="badge">${escapeHtml(orderedPredictions.length)} palpites</span>
                </div>
              </summary>
              ${resultLine}
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Participante</th>
                      <th>Palpite</th>
                      <th>Pontos</th>
                      <th>Critério</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderedPredictions.map((prediction) => `
                      <tr>
                        <td>${escapeHtml(participantName(prediction.participantId))}</td>
                        <td>${predictionText(prediction, match)}</td>
                        <td>${predictionPointsCell(prediction, match)}</td>
                        <td>${predictionCriterionCell(prediction, match)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </details>
          `;
        }).join("")}
      </div>
    `;
  }

  function flatPredictionsTableHtml() {
    const rows = filteredPredictions().map((prediction) => {
      const match = matchById(prediction.matchId);
      return [
        match ? `${formatDate(match.date)} ${escapeHtml(match.time)}` : "-",
        escapeHtml(participantName(prediction.participantId)),
        match ? matchHtml(match, false) : "-",
        predictionText(prediction, match),
        match ? statusBadge(match.status) : "-",
        predictionPointsCell(prediction, match),
        predictionCriterionCell(prediction, match)
      ];
    });

    return table(["Data", "Participante", "Jogo", "Palpite", "Status", "Pontos", "Critério"], rows);
  }

  function predictionsTableHtml() {
    const view = document.getElementById("predView")?.value || "grouped";
    return view === "table" ? flatPredictionsTableHtml() : groupedPredictionsHtml();
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
      <div class="notice public-soft-notice"><strong>Perguntas bônus em consulta:</strong> respostas travadas desde o início da Copa; a pontuação aparece conforme os resultados oficiais são publicados.</div>
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
        <div class="card-header"><div><h2>Pódio</h2><p>Premiação calculada automaticamente pela entrada e distribuição oficial.</p></div></div>
        ${podiumHtml(ranking)}
      </section>
      ${prizeSummaryHtml()}
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
    `;
  }

  const STATS_STAGE_COLUMNS = [
    { key: "groupR1", header: "Fase de grupos", label: "1ª rodada", short: "R1" },
    { key: "groupR2", header: "Fase de grupos", label: "2ª rodada", short: "R2" },
    { key: "groupR3", header: "Fase de grupos", label: "3ª rodada", short: "R3" },
    { key: "groupTotal", header: "Fase de grupos", label: "Total grupos", short: "Grupos" },
    { key: "round32", header: "Mata-mata", label: "16 avos", short: "16 avos" },
    { key: "round16", header: "Mata-mata", label: "Oitavas", short: "Oitavas" },
    { key: "quarter", header: "Mata-mata", label: "Quartas", short: "Quartas" },
    { key: "semi", header: "Mata-mata", label: "Semi", short: "Semi" },
    { key: "third", header: "Mata-mata", label: "3º lugar", short: "3º" },
    { key: "final", header: "Mata-mata", label: "Final", short: "Final" },
    { key: "bonus", header: "Extras", label: "Bônus", short: "Bônus" },
    { key: "total", header: "Total", label: "Total", short: "Total" }
  ];

  function buildStats(data = state) {
    const ranking = buildRanking(data);
    return {
      ranking,
      mostExact: mostBy(ranking, "exactCount"),
      mostOutcome: mostBy(ranking, "outcomeCount"),
      mostQualified: mostBy(ranking, "qualifiedCount")
    };
  }

  function getPrediction(participantId, matchId) {
    return (state.predictions || []).find((prediction) =>
      prediction.participantId === participantId &&
      prediction.matchId === matchId &&
      !isAutomaticPrediction(prediction)
    );
  }

  function normalizedPhaseName(value) {
    return normalizeSearch(value).replace(/\s+/g, " ").trim();
  }

  function groupRoundKey(match) {
    const round = normalizedPhaseName(match?.round || "");
    if (round.includes("1")) return "groupR1";
    if (round.includes("2")) return "groupR2";
    if (round.includes("3")) return "groupR3";
    const matchNo = Number(match?.matchNo || 0);
    if (matchNo > 0 && matchNo <= 24) return "groupR1";
    if (matchNo > 24 && matchNo <= 48) return "groupR2";
    if (matchNo > 48 && matchNo <= 72) return "groupR3";
    return "groupR1";
  }

  function stageKeyForMatch(match) {
    const phase = normalizedPhaseName(match?.phase || "");
    if (phase.includes("fase de grupos")) return groupRoundKey(match);
    if (phase.includes("16 avos")) return "round32";
    if (phase.includes("oitavas")) return "round16";
    if (phase.includes("quartas")) return "quarter";
    if (phase.includes("semifinal")) return "semi";
    if (phase.includes("terceiro")) return "third";
    if (phase.includes("final")) return "final";
    return "other";
  }

  function stageLabelForKey(key) {
    return STATS_STAGE_COLUMNS.find((item) => item.key === key)?.label || key;
  }

  function stageOrderKeys() {
    return ["groupR1", "groupR2", "groupR3", "round32", "round16", "quarter", "semi", "third", "final"];
  }

  function hasFinalScore(match) {
    return match && match.status === "finalizado" && toNumberOrNull(match.scoreA) !== null && toNumberOrNull(match.scoreB) !== null;
  }

  function finalizedScoringMatches() {
    return (state.matches || []).filter(hasFinalScore);
  }

  function matchSortValue(match) {
    return `${match?.date || "9999-99-99"} ${match?.time || "99:99"} ${String(match?.matchNo || "").padStart(3, "0")}`;
  }

  function lostPredictionCounts() {
    const counts = new Map((state.participants || []).map((participant) => [participant.id, 0]));
    finalizedScoringMatches().forEach((match) => {
      (state.participants || []).forEach((participant) => {
        if (!getPrediction(participant.id, match.id)) {
          counts.set(participant.id, (counts.get(participant.id) || 0) + 1);
        }
      });
    });
    return counts;
  }

  function stagePointRows(ranking) {
    const matchesById = Object.fromEntries((state.matches || []).map((match) => [match.id, match]));
    const rankingByParticipant = new Map(ranking.map((row) => [row.participantId, row]));
    const rows = (state.participants || []).map((participant) => {
      const rankingRow = rankingByParticipant.get(participant.id) || {};
      const row = {
        participantId: participant.id,
        name: participant.nickname || participant.name,
        fullName: participant.name,
        groupR1: 0,
        groupR2: 0,
        groupR3: 0,
        groupTotal: 0,
        round32: 0,
        round16: 0,
        quarter: 0,
        semi: 0,
        third: 0,
        final: 0,
        bonus: Number(rankingRow.bonusPoints || 0),
        total: Number(rankingRow.total || 0)
      };

      (state.predictions || []).forEach((prediction) => {
        if (isAutomaticPrediction(prediction) || prediction.participantId !== participant.id) return;
        const match = matchesById[prediction.matchId];
        if (!hasFinalScore(match)) return;
        const key = stageKeyForMatch(match);
        if (!Object.prototype.hasOwnProperty.call(row, key)) return;
        row[key] += Number(prediction.points || 0);
      });

      row.groupTotal = row.groupR1 + row.groupR2 + row.groupR3;
      return row;
    });

    return rows.sort((a, b) => Number(b.total || 0) - Number(a.total || 0) || a.name.localeCompare(b.name, "pt-BR"));
  }

  function bestCellClass(rows, key, value) {
    const max = Math.max(0, ...rows.map((row) => Number(row[key] || 0)));
    return max > 0 && Number(value || 0) === max ? " class=\"stage-cell-best\"" : "";
  }

  function phasePointsTableHtml(stats) {
    const ranking = stats.ranking || buildRanking(state);
    const rows = stagePointRows(ranking);
    if (!rows.length) return emptyState();

    return `
      <div class="stage-points-table-wrap">
        <table class="stage-points-table">
          <thead>
            <tr>
              <th rowspan="2">Participante</th>
              <th colspan="4">Fase de grupos</th>
              <th colspan="6">Mata-mata</th>
              <th>Bônus</th>
              <th>Total</th>
            </tr>
            <tr>
              <th>1ª rodada</th>
              <th>2ª rodada</th>
              <th>3ª rodada</th>
              <th>Total grupos</th>
              <th>16 avos</th>
              <th>Oitavas</th>
              <th>Quartas</th>
              <th>Semi</th>
              <th>3º lugar</th>
              <th>Final</th>
              <th>Bônus</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.fullName)}</small></td>
                ${["groupR1", "groupR2", "groupR3", "groupTotal", "round32", "round16", "quarter", "semi", "third", "final", "bonus", "total"].map((key) => `<td${bestCellClass(rows, key, row[key])}>${escapeHtml(row[key] || 0)}</td>`).join("")}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <p class="help-text">Os pontos de jogos entram somente após o resultado ser lançado. Sem palpite conta como 0 ponto e não vira 0x0 automático.</p>`;
  }

  function statsHeroCardsHtml(stats) {
    const ranking = stats.ranking || [];
    const leader = ranking[0];
    const bestEfficiency = [...ranking]
      .filter((row) => Number(row.scoredPredictionsCount || 0) > 0)
      .sort((a, b) => Number(b.efficiency || 0) - Number(a.efficiency || 0) || Number(b.total || 0) - Number(a.total || 0))[0];

    return `
      <div class="stats-hero-grid">
        <article class="stats-hero-card"><span>🏆</span><small>Líder atual</small><strong>${leader ? escapeHtml(leader.nickname || leader.name) : "-"}</strong><em>${leader ? `${escapeHtml(leader.total)} pts` : "sem ranking"}</em></article>
        <article class="stats-hero-card"><span>🎯</span><small>Mais placares exatos</small><strong>${stats.mostExact ? escapeHtml(stats.mostExact.nickname || stats.mostExact.name) : "-"}</strong><em>${stats.mostExact ? `${escapeHtml(stats.mostExact.exactCount)} exato(s)` : "-"}</em></article>
        <article class="stats-hero-card"><span>✅</span><small>Mais vencedores/empates</small><strong>${stats.mostOutcome ? escapeHtml(stats.mostOutcome.nickname || stats.mostOutcome.name) : "-"}</strong><em>${stats.mostOutcome ? `${escapeHtml(stats.mostOutcome.outcomeCount)} acerto(s)` : "-"}</em></article>
        <article class="stats-hero-card"><span>🔥</span><small>Melhor aproveitamento</small><strong>${bestEfficiency ? escapeHtml(bestEfficiency.nickname || bestEfficiency.name) : "-"}</strong><em>${bestEfficiency ? `${escapeHtml(bestEfficiency.efficiency)}% em ${escapeHtml(bestEfficiency.scoredPredictionsCount)} jogo(s)` : "sem jogos"}</em></article>
      </div>`;
  }

  function podiumRaceHtml(ranking) {
    if (!ranking.length) return emptyState();
    const third = ranking[2];
    const thirdTotal = Number(third?.total || 0);
    const medals = ["🥇", "🥈", "🥉", "4º", "5º"];
    return `
      <div class="podium-race-list">
        ${ranking.slice(0, 5).map((row, index) => {
          const prize = index < 3 ? formatMoney(prizeAmount(index)) : "fora do prêmio";
          const distance = index < 3
            ? `premiação atual: ${prize}`
            : third
              ? (thirdTotal - Number(row.total || 0) <= 0 ? "empatado no corte do prêmio" : `a ${escapeHtml(thirdTotal - Number(row.total || 0))} pts do prêmio`)
              : "sem corte definido";
          return `<article class="podium-race-item ${index < 3 ? "in-prize" : ""}"><span>${medals[index]}</span><strong>${escapeHtml(row.nickname || row.name)}</strong><em>${escapeHtml(row.total)} pts</em><small>${escapeHtml(distance)}</small></article>`;
        }).join("")}
      </div>`;
  }

  function matchPointRows() {
    return finalizedScoringMatches().map((match) => {
      const predictions = (state.predictions || []).filter((prediction) => !isAutomaticPrediction(prediction) && prediction.matchId === match.id);
      const totalPoints = predictions.reduce((sum, prediction) => sum + Number(prediction.points || 0), 0);
      const exact = predictions.filter((prediction) => prediction.exact).length;
      const scored = predictions.filter((prediction) => Number(prediction.points || 0) > 0).length;
      const total = predictions.length;
      return { match, predictions, totalPoints, exact, scored, total, avg: total ? totalPoints / total : 0 };
    });
  }

  function matchPointHighlightsHtml() {
    const rows = matchPointRows();
    const mostPoints = [...rows].sort((a, b) => b.totalPoints - a.totalPoints || b.exact - a.exact).slice(0, 15);
    const hardest = [...rows].sort((a, b) => a.avg - b.avg || a.totalPoints - b.totalPoints).slice(0, 15);
    return `
      <div class="grid-2">
        <section class="card compact-table-card stats-match-card">
          <div class="card-header"><div><h2>Jogos que mais deram pontos</h2><p>Partidas que mais distribuíram pontos entre palpites reais.</p></div></div>
          ${mostPoints.length ? table(["Jogo", "Total", "Exatos", "Pontuaram"], mostPoints.map((row) => [matchHtml(row.match, true), `<strong>${escapeHtml(row.totalPoints)}</strong>`, row.exact, `${row.scored}/${row.total}`])) : emptyState()}
        </section>
        <section class="card compact-table-card stats-match-card">
          <div class="card-header"><div><h2>Jogos mais difíceis</h2><p>Menor média de pontos por palpite real.</p></div></div>
          ${hardest.length ? table(["Jogo", "Média", "Zeraram", "Palpites"], hardest.map((row) => [matchHtml(row.match, true), row.avg.toFixed(2), `${Math.max(0, row.total - row.scored)}`, row.total])) : emptyState()}
        </section>
      </div>`;
  }

  function milestoneRows() {
    const orderedKeys = stageOrderKeys();
    const matches = finalizedScoringMatches().sort((a, b) => matchSortValue(a).localeCompare(matchSortValue(b), "pt-BR"));
    const keysWithMatches = orderedKeys.filter((key) => matches.some((match) => stageKeyForMatch(match) === key));
    const matchesById = Object.fromEntries((state.matches || []).map((match) => [match.id, match]));

    return keysWithMatches.map((key) => {
      const allowed = new Set(orderedKeys.slice(0, orderedKeys.indexOf(key) + 1));
      const allowedMatchIds = new Set(matches.filter((match) => allowed.has(stageKeyForMatch(match))).map((match) => match.id));
      const partialData = {
        ...state,
        predictions: (state.predictions || []).filter((prediction) => {
          if (isAutomaticPrediction(prediction)) return false;
          const match = matchesById[prediction.matchId];
          return match && allowedMatchIds.has(match.id);
        })
      };
      return {
        key,
        label: stageLabelForKey(key),
        ranking: buildRanking(partialData).slice(0, 3)
      };
    });
  }

  function milestoneEvolutionHtml() {
    const rows = milestoneRows();
    if (!rows.length) return emptyState();
    return `
      <div class="milestone-grid">
        ${rows.map((item) => `
          <article class="milestone-card">
            <small>Após</small>
            <strong>${escapeHtml(item.label)}</strong>
            <ol>
              ${item.ranking.map((row, index) => `<li><span>${index + 1}º</span><b>${escapeHtml(row.nickname || row.name)}</b><em>${escapeHtml(row.total)} pts</em></li>`).join("")}
            </ol>
          </article>`).join("")}
      </div>`;
  }

  function statsView() {
    const stats = buildStats(state);
    const ranking = stats.ranking || buildRanking(state);

    return `
      ${statsHeroCardsHtml(stats)}

      <section class="card stats-podium-race-card">
        <div class="card-header"><div><h2>Disputa pelo pódio</h2><p>Top 5, premiação atual e distância até a zona de prêmio.</p></div></div>
        ${podiumRaceHtml(ranking)}
      </section>

      <section class="card compact-table-card">
        <div class="card-header"><div><h2>Pontuação por fase/rodada</h2><p>Fase de grupos dividida em 1ª, 2ª e 3ª rodadas, seguida pelas fases do mata-mata, bônus e total.</p></div></div>
        ${phasePointsTableHtml(stats)}
      </section>

      <section class="card stats-milestone-card">
        <div class="card-header"><div><h2>Evolução por marco da Copa</h2><p>Ranking acumulado após cada rodada/fase finalizada. Substitui o antigo gráfico de linhas.</p></div></div>
        ${milestoneEvolutionHtml()}
      </section>

      ${matchPointHighlightsHtml()}
    `;
  }


  const CUP_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const CUP_BRACKET_PUBLIC = {
    left: {
      round32: [74, 77, 73, 75, 83, 84, 81, 82],
      round16: [89, 90, 93, 94],
      quarter: [97, 98],
      semi: [101]
    },
    right: {
      semi: [102],
      quarter: [99, 100],
      round16: [91, 92, 95, 96],
      round32: [76, 78, 80, 79, 86, 88, 85, 87]
    }
  };

  function isGroupStageMatch(match) {
    return normalizeSearch(match?.phase || "").includes("fase de grupos") && CUP_GROUPS.includes(String(match?.group || "").toUpperCase());
  }

  function isFinalizedWithScore(match) {
    return match?.status === "finalizado" && toNumberOrNull(match.scoreA) !== null && toNumberOrNull(match.scoreB) !== null;
  }

  function cupInitialTeam(team, group) {
    return { team, group, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, position: 0 };
  }

  function cupApplyResult(row, gf, ga) {
    row.played += 1;
    row.gf += gf;
    row.ga += ga;
    row.gd = row.gf - row.ga;
    if (gf > ga) { row.wins += 1; row.points += 3; }
    else if (gf === ga) { row.draws += 1; row.points += 1; }
    else row.losses += 1;
  }

  function cupGroupMatches(group) {
    return state.matches
      .filter((match) => isGroupStageMatch(match) && String(match.group).toUpperCase() === group)
      .sort(sortByOfficialMatchOrder);
  }

  function cupSortRows(rows) {
    return [...rows]
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team, "pt-BR"))
      .map((row, index) => ({ ...row, position: index + 1 }));
  }

  function calculateCupStandings() {
    const groups = CUP_GROUPS.map((group) => {
      const matches = cupGroupMatches(group);
      const teamNames = [...new Set(matches.flatMap((match) => [match.teamA, match.teamB]).filter(Boolean))];
      const rowsMap = new Map(teamNames.map((team) => [team, cupInitialTeam(team, group)]));
      matches.filter(isFinalizedWithScore).forEach((match) => {
        const a = rowsMap.get(match.teamA);
        const b = rowsMap.get(match.teamB);
        if (!a || !b) return;
        const scoreA = Number(match.scoreA);
        const scoreB = Number(match.scoreB);
        cupApplyResult(a, scoreA, scoreB);
        cupApplyResult(b, scoreB, scoreA);
      });
      const finalized = matches.filter(isFinalizedWithScore).length;
      return { group, matches, rows: cupSortRows([...rowsMap.values()]), finalized, total: matches.length, complete: matches.length > 0 && finalized === matches.length };
    });
    const thirds = groups
      .map((group) => group.rows[2] ? { ...group.rows[2], sourceGroup: group.group } : null)
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team, "pt-BR"))
      .map((row, index) => ({ ...row, thirdRank: index + 1, qualifiesAsThird: index < 8 }));
    return { groups, thirds };
  }

  function cupTeamNameCompact(name) {
    const clean = String(name || "-");
    const text = normalizeSearch(clean);
    const winner = text.match(/vencedor\s+#?(\d+)/) || text.match(/vencedor\s+jogo\s+(\d+)/);
    if (winner) return `Venc. #${winner[1]}`;
    const loser = text.match(/perdedor\s+#?(\d+)/) || text.match(/perdedor\s+jogo\s+(\d+)/);
    if (loser) return `Perd. #${loser[1]}`;
    return clean;
  }

  function cupIsPlaceholderTeam(name) {
    return /grupo|melhor 3|vencedor|perdedor|a definir|^\s*[-–]?\s*$/i.test(normalizeSearch(name || ""));
  }

  function cupTeamHtml(name) {
    if (cupIsPlaceholderTeam(name)) return `<span class="team cup-placeholder-team">${escapeHtml(cupTeamNameCompact(name))}</span>`;
    return teamHtml(name);
  }

  function cupMatchByNo(matchNo) {
    return state.matches.find((match) => Number(match.matchNo) === Number(matchNo));
  }

  function cupDisplayScore(match) {
    if (!isFinalizedWithScore(match)) return "";
    return `<span class="cup-public-score">${escapeHtml(match.scoreA)} x ${escapeHtml(match.scoreB)}</span>`;
  }

  function cupBracketMatchCard(match) {
    if (!match) return "";
    return `
      <article class="cup-public-match ${cupIsPlaceholderTeam(match.teamA) || cupIsPlaceholderTeam(match.teamB) ? "is-pending" : ""}">
        <div class="cup-public-match-head"><strong>#${escapeHtml(match.matchNo || "")}</strong></div>
        <div class="cup-public-teams">
          <div class="cup-public-teamline">${cupTeamHtml(match.teamA)}</div>
          <div class="cup-public-teamline">${cupTeamHtml(match.teamB)}</div>
        </div>
        ${cupDisplayScore(match)}
      </article>`;
  }

  function cupSplitStageHtml(title, matchNos, side, level) {
    const matches = matchNos.map(cupMatchByNo).filter(Boolean);
    return `
      <section class="cup-public-stage cup-public-stage-${escapeHtml(level)} cup-public-stage-${escapeHtml(side)}">
        <div class="cup-public-stage-title">${escapeHtml(title)}</div>
        <div class="cup-public-stage-list">
          ${matches.map(cupBracketMatchCard).join("")}
        </div>
      </section>`;
  }

  function cupCenterHtml() {
    const finalMatch = cupMatchByNo(104);
    const thirdMatch = cupMatchByNo(103);
    return `
      <section class="cup-public-center">
        <div class="cup-public-stage-title">Final</div>
        <div class="cup-public-trophy" aria-hidden="true">🏆</div>
        ${finalMatch ? cupBracketMatchCard(finalMatch) : ""}
        <div class="cup-public-third-title">3º lugar</div>
        ${thirdMatch ? cupBracketMatchCard(thirdMatch) : ""}
      </section>`;
  }

  function cupMobileKnockoutListHtml() {
    const phaseOrder = ["16 avos", "Oitavas", "Quartas", "Semifinal", "Disputa de terceiro lugar", "Final"];
    const knockoutMatches = state.matches
      .filter((match) => phaseOrder.some((phase) => normalizeSearch(match.phase || "").includes(normalizeSearch(phase))))
      .sort(sortByOfficialMatchOrder);
    const groups = phaseOrder.map((phase) => ({
      phase,
      matches: knockoutMatches.filter((match) => normalizeSearch(match.phase || "").includes(normalizeSearch(phase)))
    })).filter((group) => group.matches.length);

    return `
      <div class="cup-public-mobile-list" aria-label="Lista do mata-mata">
        ${groups.map((group) => `
          <section class="cup-mobile-phase">
            <h3>${escapeHtml(group.phase)}</h3>
            <div class="cup-mobile-match-grid">
              ${group.matches.map((match) => `
                <article class="cup-mobile-match">
                  <div class="cup-mobile-match-head"><strong>#${escapeHtml(match.matchNo || "")}</strong><span>${formatDate(match.date)} ${escapeHtml(match.time || "")}</span></div>
                  <div class="cup-mobile-teams">${matchHtml(match, match.status === "finalizado")}</div>
                  <small>${escapeHtml(match.status || "agendado")}</small>
                </article>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

  function cupBracketHtml() {
    return `
      <section class="card cup-public-bracket-card">
        <div class="card-header"><div><h2>Chave oficial</h2><p>Confrontos do mata-mata conforme publicado pelo administrador.</p></div></div>
        <div class="cup-public-bracket-scroll">
          <div class="cup-public-bracket">
            ${cupSplitStageHtml("1/16", CUP_BRACKET_PUBLIC.left.round32, "left", "r32")}
            ${cupSplitStageHtml("Oitavas", CUP_BRACKET_PUBLIC.left.round16, "left", "r16")}
            ${cupSplitStageHtml("Quartas", CUP_BRACKET_PUBLIC.left.quarter, "left", "qf")}
            ${cupSplitStageHtml("Semifinal", CUP_BRACKET_PUBLIC.left.semi, "left", "sf")}
            ${cupCenterHtml()}
            ${cupSplitStageHtml("Semifinal", CUP_BRACKET_PUBLIC.right.semi, "right", "sf")}
            ${cupSplitStageHtml("Quartas", CUP_BRACKET_PUBLIC.right.quarter, "right", "qf")}
            ${cupSplitStageHtml("Oitavas", CUP_BRACKET_PUBLIC.right.round16, "right", "r16")}
            ${cupSplitStageHtml("1/16", CUP_BRACKET_PUBLIC.right.round32, "right", "r32")}
          </div>
        </div>
        ${cupMobileKnockoutListHtml()}
      </section>`;
  }

  function cupGroupTablesHtml(standings) {
    return `
      <section class="card cup-public-groups-card">
        <div class="card-header"><div><h2>Classificação por grupo</h2><p>Pontos, saldo e gols calculados a partir dos resultados publicados.</p></div></div>
        <div class="cup-public-groups-grid">
          ${standings.groups.map((group) => `
            <article class="cup-public-group">
              <div class="cup-public-group-head"><strong>Grupo ${escapeHtml(group.group)}</strong><span>${escapeHtml(group.finalized)}/${escapeHtml(group.total)} jogos</span></div>
              <div class="table-wrap mini-table-wrap">
                <table class="cup-public-table">
                  <thead><tr><th>Pos</th><th>Seleção</th><th>Pts</th><th>SG</th><th>GP</th></tr></thead>
                  <tbody>
                    ${group.rows.map((row) => `<tr class="${row.position <= 2 ? "qualified-row" : row.position === 3 ? "third-row" : ""}"><td>${row.position}º</td><td>${teamHtml(row.team)}</td><td><strong>${row.points}</strong></td><td>${row.gd >= 0 ? "+" : ""}${row.gd}</td><td>${row.gf}</td></tr>`).join("")}
                  </tbody>
                </table>
              </div>
            </article>`).join("")}
        </div>
      </section>`;
  }

  function cupThirdsHtml(standings) {
    const qualified = standings.thirds.filter((row) => row.qualifiesAsThird);
    const eliminated = standings.thirds.filter((row) => !row.qualifiesAsThird);
    const thirdRows = (rows, label, className) => table(["Rank", "Grupo", "Seleção", "Pts", "SG", "GP", "Status"], rows.map((row) => [
      `${row.thirdRank}º`,
      `Grupo ${row.sourceGroup}`,
      teamHtml(row.team),
      row.points,
      `${row.gd >= 0 ? "+" : ""}${row.gd}`,
      row.gf,
      `<span class="badge ${className}">${label}</span>`
    ]));
    return `
      <section class="card cup-public-thirds-card">
        <div class="card-header"><div><h2>Melhores terceiros</h2><p>Os 8 primeiros avançam aos 16 avos.</p></div></div>
        <div class="grid-2 cup-public-thirds-grid">
          <div class="cup-public-panel"><h3>Classificados ${qualified.length}/8</h3>${thirdRows(qualified, "classificado", "success")}</div>
          <div class="cup-public-panel"><h3>Eliminados ${eliminated.length}/4</h3>${thirdRows(eliminated, "eliminado", "agendado")}</div>
        </div>
      </section>`;
  }

  function cupTableView() {
    const standings = calculateCupStandings();
    return `
      <section class="card cup-public-hero">
        <div class="card-header"><div><h2>Tabela da Copa</h2><p>Classificação da fase de grupos, melhores terceiros e chave oficial do mata-mata.</p></div></div>
        <div class="grid-4">
          <div class="kpi-card"><span class="kpi-label">Grupos fechados</span><span class="kpi-value">${standings.groups.filter((g) => g.complete).length}/12</span><span class="kpi-note">fase de grupos</span></div>
          <div class="kpi-card"><span class="kpi-label">Melhores terceiros</span><span class="kpi-value">${standings.thirds.filter((row) => row.qualifiesAsThird).length}/8</span><span class="kpi-note">classificados</span></div>
          <div class="kpi-card"><span class="kpi-label">16 avos</span><span class="kpi-value">${state.matches.filter((m) => Number(m.matchNo) >= 73 && Number(m.matchNo) <= 88).length}</span><span class="kpi-note">confrontos</span></div>
          <div class="kpi-card"><span class="kpi-label">Mata-mata</span><span class="kpi-value">32</span><span class="kpi-note">seleções na chave</span></div>
        </div>
      </section>
      ${cupBracketHtml()}
      ${cupThirdsHtml(standings)}
      ${cupGroupTablesHtml(standings)}
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
        <div class="rule-box"><strong>${scoring.outcome} pts</strong><span>Resultado correto</span><p>Acertou apenas o vencedor ou o empate. Ex.: palpite 3x0 e resultado 1x0; na fase de grupos, 2x2 e resultado 0x0.</p></div>
        <div class="rule-box"><strong>${scoring.knockoutDrawOutcome ?? 6} pts</strong><span>Empate no mata-mata</span><p>Nos jogos eliminatórios, empate correto sem placar exato vale 6 pontos. Ex.: palpite 2x2 e resultado 0x0.</p></div>
        <div class="rule-box"><strong>${scoring.wrong || 0} pts</strong><span>Errou tudo</span><p>Não acertou o placar, nem o vencedor/empate, nem o saldo quando aplicável.</p></div>
        <div class="rule-box"><strong>+${scoring.knockoutQualified ?? 3} pts</strong><span>Classificado no mata-mata</span><p>Nos jogos eliminatórios, soma bônus se acertar quem se classifica/vence. O placar usado é o do jogo até o fim da prorrogação.</p></div>
        <div class="rule-box"><strong>Pênaltis</strong><span>Não entram no placar</span><p>Se o jogo terminar empatado e for decidido nos pênaltis, o placar do bolão continua empatado; o classificado é informado separadamente.</p></div>
        <div class="rule-box"><strong>0 pts</strong><span>Sem palpite</span><p>Se não houver palpite cadastrado, o participante não pontua neste jogo. Palpite 0x0 continua válido somente quando foi enviado/cadastrado manualmente.</p></div>
        <div class="rule-box"><strong>${formatMoney(state.settings.entryFee || 50)}</strong><span>Entrada por participante</span><p>Premiação: ${prizeConfig().first}% para o primeiro lugar, ${prizeConfig().second}% para o segundo e ${prizeConfig().third}% para o terceiro.</p></div>
      </div>
      <section class="card" style="box-shadow:none;margin:18px 0 0;padding:16px;background:var(--surface-2)">
        <h2>Exemplos do mata-mata</h2>
        <ul>
          <li>Palpite 1x1 + Brasil classificado; resultado 1x1 + Brasil nos pênaltis = ${scoring.exactScore + (scoring.knockoutQualified ?? 3)} pontos.</li>
          <li>Palpite 2x2 + Brasil classificado; resultado 0x0 + Brasil nos pênaltis = ${(scoring.knockoutDrawOutcome ?? 6) + (scoring.knockoutQualified ?? 3)} pontos.</li>
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
    return `<div class="podium-grid">${ranking.slice(0, 3).map((row, index) => `<div class="podium-card"><div class="podium-medal">${medals[index]}</div><strong>${escapeHtml(row.nickname || row.name)}</strong><span>${row.total} pontos</span><small>${row.exactCount} exatos · ${row.outcomeCount} resultados corretos · ${row.qualifiedCount} classificados · ${formatMoney(prizeAmount(index))}</small></div>`).join("")}</div>`;
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

    const predictions = matchPredictions(match.id).filter((prediction) => !isAutomaticPrediction(prediction));
    const stats = matchSummaryStats(match, predictions);
    const maxPoints = match.status === "finalizado" ? stats.max : -1;
    const predictionByParticipant = new Map(predictions.map((prediction) => [prediction.participantId, prediction]));

    const ordered = state.participants
      .map((participant, index) => ({ participant, prediction: predictionByParticipant.get(participant.id) || null, index }))
      .sort((left, right) => {
        if (match.status !== "finalizado") return left.index - right.index;
        const leftHasPrediction = left.prediction ? 1 : 0;
        const rightHasPrediction = right.prediction ? 1 : 0;
        if (rightHasPrediction !== leftHasPrediction) return rightHasPrediction - leftHasPrediction;
        return Number(right.prediction?.points || 0) - Number(left.prediction?.points || 0) || left.index - right.index;
      });

    const rows = ordered.map(({ participant, prediction }) => {
      const points = Number(prediction?.points || 0);
      const bestBadge = prediction && match.status === "finalizado" && maxPoints > 0 && points === maxPoints
        ? ` <span class="badge criterion-best">🏆 Melhor do jogo</span>`
        : "";
      return [
        `<strong>${escapeHtml(participant.nickname || participant.name)}</strong>`,
        predictionText(prediction, match),
        predictionPointsSummaryHtml(prediction, match) + bestBadge
      ];
    });

    const body = `
      ${matchResultSummaryHtml(match)}
      ${match.status === "finalizado" ? matchStatsHtml(stats) : `<p class="modal-helper-text">A pontuação aparecerá automaticamente depois que o resultado for publicado.</p>`}
      <p class="modal-helper-text">${match.status === "finalizado" ? "Ordenado por maior pontuação no jogo. Quem não palpitou aparece como sem palpite e não pontua." : "Ordem de participantes mantida enquanto o jogo não estiver finalizado."}</p>
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
    const views = { dashboard: dashboardView, matches: matchesView, predictions: predictionsView, cupTable: cupTableView, bonus: bonusView, ranking: rankingView, stats: statsView, rules: rulesView };
    app.innerHTML = (views[view] || dashboardView)();
    bindViewEvents(view);
  }

  function bindMatchPredictionButtons() {
    app.querySelectorAll("[data-match-predictions]").forEach((button) => {
      button.addEventListener("click", () => matchPredictionsModal(button.dataset.matchPredictions));
    });
  }

  function filterPrefix(kind) {
    return kind === "predictions" ? "pred" : kind;
  }

  function filterControlIds(kind) {
    const prefix = filterPrefix(kind);
    const ids = [`${prefix}Search`, `${prefix}Phase`, `${prefix}Day`, `${prefix}Status`];
    if (kind === "matches") ids.push(`${prefix}Group`);
    if (kind === "predictions") ids.push(`${prefix}Participant`, `${prefix}View`);
    return ids;
  }

  function setFilterValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
  }

  function dispatchFilterChange(kind) {
    const prefix = filterPrefix(kind);
    const element = document.getElementById(`${prefix}Search`) || document.getElementById(`${prefix}Day`) || document.getElementById(`${prefix}Status`);
    if (element) element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function applyQuickFilter(kind, quickFilter) {
    const prefix = filterPrefix(kind);
    if (quickFilter === "all") {
      filterControlIds(kind).forEach((id) => {
        if (id.endsWith("View")) return;
        setFilterValue(id, "");
      });
    }
    if (quickFilter === "today") setFilterValue(`${prefix}Day`, "__today__");
    if (quickFilter === "tomorrow") setFilterValue(`${prefix}Day`, "__tomorrow__");
    if (quickFilter === "next2") setFilterValue(`${prefix}Day`, "__next2__");
    if (quickFilter === "open") setFilterValue(`${prefix}Status`, "aberto");
    if (quickFilter === "finished") setFilterValue(`${prefix}Status`, "finalizado");
    dispatchFilterChange(kind);
  }

  function syncQuickFilterButtons(kind) {
    const prefix = filterPrefix(kind);
    const day = document.getElementById(`${prefix}Day`)?.value || "";
    const status = document.getElementById(`${prefix}Status`)?.value || "";
    const hasAnyFilter = filterControlIds(kind).some((id) => {
      if (id.endsWith("View")) return false;
      return Boolean(document.getElementById(id)?.value || "");
    });
    app.querySelectorAll(`[data-quick-filters='${kind}'] [data-quick-filter]`).forEach((button) => {
      const key = button.dataset.quickFilter;
      const active = (key === "today" && day === "__today__")
        || (key === "tomorrow" && day === "__tomorrow__")
        || (key === "next2" && day === "__next2__")
        || (key === "open" && status === "aberto")
        || (key === "finished" && status === "finalizado")
        || (key === "all" && !hasAnyFilter);
      button.classList.toggle("active", active);
    });
  }

  function bindQuickFilters(kind) {
    app.querySelectorAll(`[data-quick-filters='${kind}'] [data-quick-filter]`).forEach((button) => {
      button.addEventListener("click", () => applyQuickFilter(kind, button.dataset.quickFilter));
    });
    syncQuickFilterButtons(kind);
  }

  function bindViewEvents(view) {
    if (view === "matches") {
      const redrawMatches = () => {
        const rows = filterMatches("matches").map((match) => [match.matchNo ? `#${escapeHtml(match.matchNo)}` : "-", `${formatDate(match.date)} ${escapeHtml(match.time)}`, `<span class="phase-pill">${escapeHtml(match.phase)}</span>`, escapeHtml(match.group || "-"), matchHtml(match, false), escapeHtml(match.venue || "-"), resultText(match), statusBadge(match.status), `<button class="btn compact ghost" type="button" data-match-predictions="${escapeHtml(match.id)}">Ver palpites</button>`]);
        document.getElementById("matchesTable").innerHTML = table(["Nº", "Data", "Fase", "Grupo", "Jogo", "Sede", "Placar", "Status", "Ações"], rows);
        bindMatchPredictionButtons();
        syncQuickFilterButtons("matches");
      };
      app.querySelectorAll("[data-filters='matches'] input, [data-filters='matches'] select").forEach((element) => {
        element.addEventListener("input", redrawMatches);
        element.addEventListener("change", redrawMatches);
      });
      bindQuickFilters("matches");
      bindMatchPredictionButtons();
    }
    if (view === "predictions") {
      const redrawPredictions = () => {
        document.getElementById("predictionsTable").innerHTML = predictionsTableHtml();
        syncQuickFilterButtons("predictions");
      };
      app.querySelectorAll("[data-filters='predictions'] input, [data-filters='predictions'] select").forEach((element) => {
        element.addEventListener("input", redrawPredictions);
        element.addEventListener("change", redrawPredictions);
      });
      bindQuickFilters("predictions");
    }
    bindMatchPredictionButtons();
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
