# Público v56 - Classificado destacado na chave

## Ajustes

- A chave pública agora destaca visualmente a linha da seleção classificada em jogos finalizados.
- A seleção eliminada fica mais discreta.
- O placar da chave agora mostra também quem passou.

Exemplos:

- `0 x 1 · Canadá`
- `1 x 1 · Holanda`

Isso ajuda principalmente em empates de mata-mata, onde o placar sozinho não informa quem avançou.

## Arquivos alterados

- `js/public-app.js`
- `css/styles.css`
- `tests/public-scoring-tests.js`
- `RELATORIO-PUBLICO-V56-CLASSIFICADO-NA-CHAVE.md`

## Validação

- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`
