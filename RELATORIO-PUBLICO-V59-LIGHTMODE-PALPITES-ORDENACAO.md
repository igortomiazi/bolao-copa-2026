# Público v59 - Light mode, Palpites e ordenação por horário

## Alterações

### Light mode
- Corrigida a leitura do light mode depois dos ajustes de dark mode.
- Cards, tabelas, botões, filtros e badges ganharam contraste melhor no tema claro.
- Critérios de palpite agora usam cores próprias para fundo claro, evitando texto claro demais em amarelo/azul.

### Aba Palpites
- Melhor leitura na visualização por jogo.
- Cards de jogo com borda, fundo e hover mais definidos.
- Botão Abrir/Fechar mais visível.
- Tabela interna com linhas e contraste melhores.
- Badges de classificado e critérios ajustados para light/dark.

### Ordenação
- Aba Jogos agora ordena por data/horário da partida e só depois por número do jogo.
- Aba Palpites também ordena por data/horário da partida.

## Arquivos alterados
- `js/public-app.js`
- `css/styles.css`
- `tests/public-scoring-tests.js`

## Validação
- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`
