# Bolão Copa 2026 Público - v57

## Histórico de pontuação por participante

Adicionado no site público o mesmo conceito do histórico do Admin, em modo somente leitura.

### Onde fica
- Aba **Ranking**
- Cada linha do ranking agora tem botão **Ver histórico**

### O que o modal mostra
- Total de pontos
- Jogos em que pontuou
- Jogos em que zerou
- Jogos sem palpite
- Placares exatos
- Melhor jogo
- Lista jogo a jogo com:
  - resultado
  - palpite
  - classificado no mata-mata, quando houver
  - pontuação
  - critério

### Filtros disponíveis
- Tudo
- Pontuou
- Não pontuou
- Placares exatos
- Acertou vencedor/empate
- Acertou classificado
- Errou tudo
- Sem palpite
- Bônus
- Filtro por fase/rodada

### Layout
- Modal sem rolagem dupla
- Cabeçalho, resumo, filtros e rodapé ficam fixos
- Apenas a lista de jogos rola internamente
- Visual alinhado ao Admin v66

## Arquivos alterados
- `js/public-app.js`
- `css/styles.css`
- `tests/public-scoring-tests.js`
- `RELATORIO-PUBLICO-V57-HISTORICO-PARTICIPANTE.md`

## Validação
- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`

Resultado:
- `TESTES PUBLICOS OK`
- `TESTES PUBLICOS V42 OK`
- `TESTES PUBLICOS V55 OK`
- `TESTES PUBLICOS V56 OK`
- `TESTES PUBLICOS V57 OK`
