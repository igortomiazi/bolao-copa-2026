# Bolão Copa 2026 — Versão pública de consulta

Esta é a versão para publicar no GitHub Pages.

Ela é **somente leitura**:

- não cadastra participantes;
- não altera jogos;
- não salva palpites;
- não lança resultados;
- não importa backup pelo visitante;
- não grava nada no GitHub;
- não usa `localStorage` para dados do bolão.

## Regras de pontuação

- Placar exato: 10 pontos.
- Vencedor + saldo de gols: 7 pontos.
- Resultado correto, incluindo empate: 5 pontos.
- Erro total: 0 ponto.
- Se não houver palpite cadastrado em jogo finalizado, o sistema considera 0x0 automático.

Observação: empate com saldo zero, mas placar diferente, vale 5 pontos, não 7. Exemplo: palpite 2x2 e resultado 0x0 vale 5 pontos.

## Desempate

Em caso de empate na pontuação:

1. maior número de placares exatos;
2. maior número de resultados corretos;
3. maior número de palpites registrados manualmente;
4. cadastro mais antigo.
