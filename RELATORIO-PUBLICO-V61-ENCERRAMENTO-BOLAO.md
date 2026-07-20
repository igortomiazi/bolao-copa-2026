# Público v61 - Encerramento do Bolão

## Objetivo
Transformar o site público em uma página de encerramento após o fim da Copa, mantendo ranking, palpites, tabela e estatísticas disponíveis para consulta.

## Alterações

### Home
- Quando a final estiver lançada no `bolao-publico.json`, a Home muda automaticamente para modo de encerramento.
- Adicionado card de agradecimento aos participantes.
- Adicionado destaque para campeã da Copa.
- Adicionado destaque para campeão do bolão.
- Adicionado pódio final do bolão.
- Adicionados atalhos para Ranking final, Tabela da Copa e Estatísticas finais.
- Adicionado bloco de premiação final.

### Tabela da Copa
- Adicionado resumo final da Copa quando a final estiver lançada:
  - campeã;
  - vice;
  - 3º lugar;
  - artilheiro(s);
  - caminho da campeã no mata-mata.

### Ranking e Estatísticas
- Títulos passam a indicar resultado final quando a Copa estiver encerrada.

## Observação importante
Esta versão não precisa substituir `data/bolao-publico.json`. A tela final lê automaticamente o JSON já publicado no GitHub.

## Validação
- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`

Resultado: testes públicos OK.
