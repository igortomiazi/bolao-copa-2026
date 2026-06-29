const assert = require('assert');

const KNOCKOUT_PHASES = ["16 avos", "Oitavas", "Quartas", "Semifinal", "Disputa de terceiro lugar", "Final"];
const scoring = { exactScore: 10, goalDifference: 7, outcome: 5, knockoutDrawOutcome: 6, wrong: 0, knockoutQualified: 3 };

function outcome(a, b) {
  if (a > b) return 'A';
  if (b > a) return 'B';
  return 'E';
}
function normalizeSide(value) {
  const side = String(value || '').trim().toUpperCase();
  return side === 'A' || side === 'B' ? side : '';
}
function inferWinnerSide(a, b) {
  const result = outcome(a, b);
  return result === 'A' || result === 'B' ? result : '';
}
function isKnockoutMatch(match) {
  return KNOCKOUT_PHASES.includes(String(match.phase || ''));
}
function calc(predA, predB, realA, realB, phase = 'Fase de grupos', predictionQualified = '', matchQualified = '') {
  const realOutcome = outcome(realA, realB);
  const predOutcome = outcome(predA, predB);
  const exact = predA === realA && predB === realB;
  const outcomeHit = predOutcome === realOutcome;
  const goalDifferenceHit = outcomeHit && realOutcome !== 'E' && (predA - predB) === (realA - realB);
  let basePoints = scoring.wrong;
  if (exact) basePoints = scoring.exactScore;
  else if (goalDifferenceHit) basePoints = scoring.goalDifference;
  else if (outcomeHit) basePoints = isKnockoutMatch({ phase }) && realOutcome === 'E' ? scoring.knockoutDrawOutcome : scoring.outcome;

  const match = { phase };
  const realQualified = normalizeSide(matchQualified || inferWinnerSide(realA, realB));
  const predQualified = normalizeSide(predictionQualified);
  const qualifiedHit = isKnockoutMatch(match) && realQualified && predQualified && realQualified === predQualified;
  return basePoints + (qualifiedHit ? scoring.knockoutQualified : 0);
}

assert.strictEqual(calc(2, 1, 2, 1), 10, 'placar exato vitória deve valer 10');
assert.strictEqual(calc(0, 0, 0, 0), 10, 'placar exato empate deve valer 10');
assert.strictEqual(calc(4, 2, 2, 0), 7, 'vencedor + saldo deve valer 7');
assert.strictEqual(calc(3, 0, 1, 0), 5, 'vencedor simples deve valer 5');
assert.strictEqual(calc(2, 2, 0, 0), 5, 'empate simples na fase de grupos deve valer 5');
assert.strictEqual(calc(2, 2, 0, 0, '16 avos'), 6, 'empate simples no mata-mata deve valer 6');
assert.strictEqual(calc(1, 0, 0, 1), 0, 'erro total deve valer 0');
assert.strictEqual(calc(1, 1, 1, 1, 'Oitavas', 'A', 'A'), 13, 'mata-mata empate exato + classificado deve valer 13');
assert.strictEqual(calc(2, 2, 0, 0, 'Oitavas', 'A', 'B'), 6, 'mata-mata empate simples com classificado errado deve valer 6');
assert.strictEqual(calc(2, 2, 0, 0, 'Oitavas', 'A', 'A'), 9, 'mata-mata empate simples + classificado deve valer 9');
assert.strictEqual(calc(2, 0, 1, 1, 'Oitavas', 'A', 'A'), 3, 'mata-mata só classificado deve valer 3');
assert.strictEqual(calc(2, 1, 2, 1, 'Final', 'B', 'A'), 10, 'placar exato com classificado errado mantém só 10 pontos');
assert.strictEqual(calc(2, 0, 2, 0, 'Fase de grupos', 'A', 'A'), 10, 'bônus de classificado não existe na fase de grupos');

const rows = [
  { name: 'A', total: 20, exactCount: 1, outcomeCount: 3, predictionsCount: 10, createdAt: '2026-01-02T00:00:00Z' },
  { name: 'B', total: 20, exactCount: 2, outcomeCount: 2, predictionsCount: 10, createdAt: '2026-01-03T00:00:00Z' },
  { name: 'C', total: 20, exactCount: 2, outcomeCount: 2, predictionsCount: 11, createdAt: '2026-01-04T00:00:00Z' },
  { name: 'D', total: 20, exactCount: 2, outcomeCount: 2, predictionsCount: 11, createdAt: '2026-01-01T00:00:00Z' },
].sort((a, b) => {
  if (b.total !== a.total) return b.total - a.total;
  if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
  if (b.outcomeCount !== a.outcomeCount) return b.outcomeCount - a.outcomeCount;
  if (b.predictionsCount !== a.predictionsCount) return b.predictionsCount - a.predictionsCount;
  return String(a.createdAt).localeCompare(String(b.createdAt));
});
assert.deepStrictEqual(rows.map(r => r.name), ['D', 'C', 'B', 'A'], 'desempate deve seguir exatos, resultados, palpites e cadastro antigo');

console.log('TESTES PUBLICOS OK');

function recalculatePublicPredictionsWithoutAutomatic(data) {
  const matchesById = Object.fromEntries(data.matches.map(match => [match.id, match]));
  return data.predictions
    .filter(prediction => !(prediction.automatic || prediction.autoDefault))
    .map(prediction => {
      const match = matchesById[prediction.matchId];
      if (!match) return prediction;
      return {
        ...prediction,
        automatic: false,
        autoDefault: false,
        points: calc(prediction.goalsA, prediction.goalsB, match.scoreA, match.scoreB, match.phase, prediction.qualifiedTeam, match.qualifiedTeam)
      };
    });
}

const noAutoData = {
  participants: [{ id: 'p1' }, { id: 'p2' }],
  matches: [{ id: 'm1', scoreA: 0, scoreB: 0, phase: 'Fase de grupos', status: 'finalizado' }],
  predictions: [{ participantId: 'p1', matchId: 'm1', goalsA: 0, goalsB: 0 }]
};
const noAutoResult = recalculatePublicPredictionsWithoutAutomatic(noAutoData);
assert.strictEqual(noAutoResult.length, 1, 'publico nao deve criar palpite automatico para ausente');
assert.strictEqual(noAutoResult[0].participantId, 'p1', 'mantem apenas palpite cadastrado manualmente');
assert.strictEqual(noAutoResult[0].points, 10, '0x0 manual continua valendo placar exato');

function publicEfficiencyFromPredictions(predictions, matchesById, scoring) {
  let gamePoints = 0;
  let maxPointsPossible = 0;
  let predictionsCount = 0;
  let scoredPredictionsCount = 0;
  predictions.forEach((prediction) => {
    const match = matchesById[prediction.matchId];
    predictionsCount += 1;
    const hasFinalResult = match && match.status === 'finalizado' && match.scoreA !== '' && match.scoreB !== '';
    if (hasFinalResult) {
      gamePoints += Number(prediction.points || 0);
      scoredPredictionsCount += 1;
      maxPointsPossible += scoring.exactScore + (isKnockoutMatch(match) ? scoring.knockoutQualified : 0);
    }
  });
  return {
    predictionsCount,
    scoredPredictionsCount,
    efficiency: maxPointsPossible ? Math.round((gamePoints / maxPointsPossible) * 100) : 0
  };
}

const efficiencyScenario = publicEfficiencyFromPredictions(
  [
    { matchId: 'final1', points: 10 },
    { matchId: 'final2', points: 10 },
    { matchId: 'future1', points: 0 },
    { matchId: 'future2', points: 0 },
    { matchId: 'future3', points: 0 },
    { matchId: 'future4', points: 0 },
    { matchId: 'future5', points: 0 },
    { matchId: 'future6', points: 0 },
    { matchId: 'future7', points: 0 },
    { matchId: 'future8', points: 0 }
  ],
  {
    final1: { status: 'finalizado', scoreA: 1, scoreB: 0, phase: 'Fase de grupos' },
    final2: { status: 'finalizado', scoreA: 1, scoreB: 0, phase: 'Fase de grupos' },
    future1: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future2: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future3: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future4: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future5: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future6: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future7: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' },
    future8: { status: 'agendado', scoreA: '', scoreB: '', phase: 'Fase de grupos' }
  },
  scoring
);
assert.strictEqual(efficiencyScenario.predictionsCount, 10, 'palpites futuros continuam contando como registrados');
assert.strictEqual(efficiencyScenario.scoredPredictionsCount, 2, 'aproveitamento deve considerar só jogos finalizados');
assert.strictEqual(efficiencyScenario.efficiency, 100, '2 acertos exatos em 2 jogos finalizados deve gerar 100% de aproveitamento');

assert.strictEqual(50 * 9 * 0.7, 315, 'premiação do primeiro lugar deve ser 70% de R$ 450,00');

function publicStageKeyForMatch(match) {
  const normalize = (value) => String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
  const phase = normalize(match.phase);
  const round = normalize(match.round);
  if (phase.includes('fase de grupos')) {
    if (round.includes('1')) return 'groupR1';
    if (round.includes('2')) return 'groupR2';
    if (round.includes('3')) return 'groupR3';
    const matchNo = Number(match.matchNo || 0);
    if (matchNo > 0 && matchNo <= 24) return 'groupR1';
    if (matchNo > 24 && matchNo <= 48) return 'groupR2';
    if (matchNo > 48 && matchNo <= 72) return 'groupR3';
    return 'groupR1';
  }
  if (phase.includes('16 avos')) return 'round32';
  if (phase.includes('oitavas')) return 'round16';
  if (phase.includes('quartas')) return 'quarter';
  if (phase.includes('semifinal')) return 'semi';
  if (phase.includes('terceiro')) return 'third';
  if (phase.includes('final')) return 'final';
  return 'other';
}

assert.strictEqual(publicStageKeyForMatch({ phase: 'Fase de grupos', round: 'Rodada 1' }), 'groupR1', 'fase de grupos rodada 1 deve cair em groupR1');
assert.strictEqual(publicStageKeyForMatch({ phase: 'Fase de grupos', matchNo: 35 }), 'groupR2', 'fase de grupos sem round deve inferir rodada 2 pelo numero do jogo');
assert.strictEqual(publicStageKeyForMatch({ phase: 'Semifinal' }), 'semi', 'semifinal deve cair em semi');
assert.strictEqual(publicStageKeyForMatch({ phase: 'Disputa de terceiro lugar' }), 'third', 'terceiro lugar deve cair em third');

function publicLostPredictionCount(participants, matches, predictions, participantId) {
  const realPredictions = predictions.filter(prediction => !(prediction.automatic || prediction.autoDefault));
  return matches
    .filter(match => match.status === 'finalizado' && match.scoreA !== '' && match.scoreB !== '')
    .filter(match => participants.some(participant => participant.id === participantId) && !realPredictions.some(prediction => prediction.participantId === participantId && prediction.matchId === match.id))
    .length;
}

assert.strictEqual(publicLostPredictionCount(
  [{ id: 'p1' }],
  [{ id: 'm1', status: 'finalizado', scoreA: 1, scoreB: 0 }, { id: 'm2', status: 'agendado', scoreA: '', scoreB: '' }],
  [],
  'p1'
), 1, 'jogos perdidos sem palpite devem considerar apenas finalizados');

console.log('TESTES PUBLICOS V42 OK');


function publicCupResolvePlaceholderScenario() {
  const matches = [
    { matchNo: 73, teamA: 'África do Sul', teamB: 'Canadá', status: 'finalizado', scoreA: 0, scoreB: 1, qualifiedTeam: 'B' },
    { matchNo: 75, teamA: 'Holanda', teamB: 'Marrocos', status: 'agendado', scoreA: '', scoreB: '', qualifiedTeam: '' },
    { matchNo: 90, teamA: 'Vencedor jogo 73', teamB: 'Vencedor jogo 75', status: 'agendado', scoreA: '', scoreB: '', qualifiedTeam: '' },
    { matchNo: 97, teamA: 'Vencedor jogo 89', teamB: 'Vencedor jogo 90', status: 'agendado', scoreA: '', scoreB: '', qualifiedTeam: '' }
  ];
  const byNo = (matchNo) => matches.find(match => Number(match.matchNo) === Number(matchNo));
  const normalizeSearch = (value) => String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const isFinalizedWithScore = (match) => match?.status === 'finalizado' && match.scoreA !== '' && match.scoreB !== '';
  const normalizeSide = (value) => ['A', 'B'].includes(String(value || '').trim().toUpperCase()) ? String(value || '').trim().toUpperCase() : '';
  const winnerSide = (match) => {
    const explicit = normalizeSide(match?.qualifiedTeam);
    if (explicit) return explicit;
    if (!isFinalizedWithScore(match)) return '';
    return Number(match.scoreA) > Number(match.scoreB) ? 'A' : Number(match.scoreB) > Number(match.scoreA) ? 'B' : '';
  };
  const sourceFromName = (teamName) => {
    const text = normalizeSearch(teamName);
    const winner = text.match(/venc(?:edor)?\.?\s*(?:jogo)?\s*#?\s*(\d+)/);
    return winner ? { type: 'winner', matchNo: Number(winner[1]) } : null;
  };
  const resolved = (teamName, seen = new Set()) => {
    const source = sourceFromName(teamName);
    if (!source || seen.has(source.matchNo)) return teamName;
    seen.add(source.matchNo);
    const match = byNo(source.matchNo);
    const side = winnerSide(match);
    if (!match || !side) return teamName;
    const team = side === 'B' ? match.teamB : match.teamA;
    return sourceFromName(team) ? resolved(team, seen) : team;
  };
  const match90 = byNo(90);
  return { teamA: resolved(match90.teamA), teamB: resolved(match90.teamB) };
}

const resolvedCupScenario = publicCupResolvePlaceholderScenario();
assert.strictEqual(resolvedCupScenario.teamA, 'Canadá', 'publico deve resolver Vencedor jogo 73 para Canadá pelo resultado publicado');
assert.strictEqual(resolvedCupScenario.teamB, 'Vencedor jogo 75', 'publico deve manter placeholder quando jogo de origem ainda não terminou');
console.log('TESTES PUBLICOS V55 OK');


function publicCupScoreLabel(match) {
  const normalizeSide = (value) => ['A', 'B'].includes(String(value || '').trim().toUpperCase()) ? String(value || '').trim().toUpperCase() : '';
  const isFinalizedWithScore = (item) => item?.status === 'finalizado' && item.scoreA !== '' && item.scoreB !== '';
  const winnerSide = (item) => {
    const explicit = normalizeSide(item.qualifiedTeam);
    if (explicit) return explicit;
    if (!isFinalizedWithScore(item)) return '';
    if (Number(item.scoreA) > Number(item.scoreB)) return 'A';
    if (Number(item.scoreB) > Number(item.scoreA)) return 'B';
    return '';
  };
  const side = winnerSide(match);
  const qualified = side === 'B' ? match.teamB : side === 'A' ? match.teamA : '';
  return `${match.scoreA} x ${match.scoreB}${qualified ? ` · ${qualified}` : ''}`;
}

assert.strictEqual(publicCupScoreLabel({ teamA: 'África do Sul', teamB: 'Canadá', status: 'finalizado', scoreA: 0, scoreB: 1, qualifiedTeam: 'B' }), '0 x 1 · Canadá', 'chave publica deve mostrar o classificado junto do placar');
assert.strictEqual(publicCupScoreLabel({ teamA: 'Holanda', teamB: 'Marrocos', status: 'finalizado', scoreA: 1, scoreB: 1, qualifiedTeam: 'A' }), '1 x 1 · Holanda', 'empate no mata-mata deve mostrar quem passou');
console.log('TESTES PUBLICOS V56 OK');
