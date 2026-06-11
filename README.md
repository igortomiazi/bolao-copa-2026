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

O que vale para o público é o arquivo:

```txt
data/bolao-publico.json
```

## Regras de pontuação

### Regra geral

- Placar exato: 10 pontos.
- Vencedor + saldo de gols: 7 pontos.
- Resultado correto, incluindo empate: 5 pontos.
- Erro total: 0 ponto.
- Se não houver palpite cadastrado em jogo finalizado, o sistema considera 0x0 automático.

Observação: empate com saldo zero, mas placar diferente, vale 5 pontos, não 7. Exemplo: palpite 2x2 e resultado 0x0 vale 5 pontos.

### Mata-mata, prorrogação e pênaltis

Nos jogos eliminatórios, o placar do bolão considera o resultado **até o fim da prorrogação**, quando houver.

Pênaltis **não entram no placar**. Se o jogo terminar empatado e for decidido nos pênaltis, o placar continua empatado e o classificado/vencedor é tratado em campo separado.

Além da pontuação do placar, o participante ganha:

```txt
+3 pontos se acertar quem se classifica/vence no mata-mata
```

Exemplos:

- Palpite 1x1 + Brasil classificado; resultado 1x1 + Brasil nos pênaltis = 13 pontos.
- Palpite 2x2 + Brasil classificado; resultado 0x0 + Brasil nos pênaltis = 8 pontos.
- Palpite Brasil 2x0 + Brasil classificado; resultado 1x1 + Brasil nos pênaltis = 3 pontos.

## Premiação

- 70% para o primeiro lugar.
- 20% para o segundo lugar.
- 10% para o terceiro lugar.

## Desempate

Em caso de empate na pontuação:

1. maior número de placares exatos;
2. maior número de resultados corretos;
3. maior número de palpites registrados manualmente;
4. cadastro mais antigo.

## Testes

Se tiver Node instalado, execute:

```bash
node tests/public-scoring-tests.js
```

Resultado esperado:

```txt
TESTES PUBLICOS OK
```
