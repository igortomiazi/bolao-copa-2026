const assert = require('assert');

function outcome(a, b) {
  if (a > b) return 'A';
  if (b > a) return 'B';
  return 'E';
}
function calc(predA, predB, realA, realB) {
  const exact = predA === realA && predB === realB;
  const outcomeHit = outcome(predA, predB) === outcome(realA, realB);
  const realOutcome = outcome(realA, realB);
  const goalDifferenceHit = outcomeHit && realOutcome !== "E" && (predA - predB) === (realA - realB);
  if (exact) return 10;
  if (goalDifferenceHit) return 7;
  if (outcomeHit) return 5;
  return 0;
}

assert.strictEqual(calc(2, 1, 2, 1), 10, 'placar exato vitória deve valer 10');
assert.strictEqual(calc(0, 0, 0, 0), 10, 'placar exato empate deve valer 10');
assert.strictEqual(calc(4, 2, 2, 0), 7, 'vencedor + saldo deve valer 7');
assert.strictEqual(calc(3, 0, 1, 0), 5, 'vencedor simples deve valer 5');
assert.strictEqual(calc(2, 2, 0, 0), 5, 'empate simples deve valer 5');
assert.strictEqual(calc(1, 0, 0, 1), 0, 'erro total deve valer 0');

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
