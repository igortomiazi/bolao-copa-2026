# Público v55 - Chave com avanço automático visual

## Correção

A Tabela da Copa pública agora resolve visualmente placeholders da chave a partir dos resultados publicados.

Exemplo:
- Se o jogo #73 terminou África do Sul 0 x 1 Canadá e `qualifiedTeam = B`, qualquer campo `Vencedor jogo 73` passa a aparecer como `Canadá` na chave pública, mesmo que o JSON ainda tenha o placeholder no jogo seguinte.

## Causa do problema

O site público estava mostrando a chave apenas com `teamA` e `teamB` gravados no `data/bolao-publico.json`. Quando o Admin lançava o resultado, o JSON podia já conter o placar do jogo finalizado, mas o confronto seguinte ainda podia estar como `Vencedor jogo XX`.

## Arquivos alterados

- `js/public-app.js`
- `tests/public-scoring-tests.js`

## Validação

- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`
