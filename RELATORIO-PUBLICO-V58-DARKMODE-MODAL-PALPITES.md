# Público v58 - Dark mode grafite e modal de palpites

## Alterações

### Dark mode
- Paleta escura migrada para grafite, sem preto puro e sem azul dominante.
- Cards, tabelas, filtros, modais e botões ganharam camadas mais claras para melhorar leitura.
- Dourado, verde, vermelho e estados ficaram menos saturados no modo escuro.

### Modal Ver palpites
- Modal ganhou layout próprio e mais refinado.
- Cabeçalho e rodapé ficam fixos; a lista de palpites rola internamente.
- Substituída tabela antiga por lista responsiva em três colunas: participante, palpite, pontuação/regra.
- Removido o texto repetido "🏆 Melhor do jogo".
- Melhor desempenho continua destacado visualmente por fundo e faixa lateral.
- Pontuações positivas e zeradas ficam mais fáceis de ler.

## Arquivos alterados
- `css/styles.css`
- `js/public-app.js`

## Validação
- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`
