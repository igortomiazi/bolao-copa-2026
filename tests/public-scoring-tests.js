const assert = require('assert');

const KNOCKOUT_PHASES = ["16 avos", "Oitavas", "Quartas", "Semifinal", "Disputa de terceiro lugar", "Final"];
const scoring = { exactScore: 10, goalDifference: 7, outcome: 5, wrong: 0, knockoutQualified: 3 };

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
  else if (outcomeHit) basePoints = scoring.outcome;

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
assert.strictEqual(calc(2, 2, 0, 0), 5, 'empate simples deve valer 5');
assert.strictEqual(calc(1, 0, 0, 1), 0, 'erro total deve valer 0');
assert.strictEqual(calc(1, 1, 1, 1, 'Oitavas', 'A', 'A'), 13, 'mata-mata empate exato + classificado deve valer 13');
assert.strictEqual(calc(2, 2, 0, 0, 'Oitavas', 'A', 'A'), 8, 'mata-mata empate simples + classificado deve valer 8');
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
