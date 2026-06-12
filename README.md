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

## Como atualizar a versão pública

No seu sistema ADMIN/local:

1. Atualize resultados, palpites e bônus normalmente.
2. Exporte o backup JSON.
3. Renomeie o arquivo exportado para:

```txt
bolao-publico.json
```

4. Substitua o arquivo dentro da pasta:

```txt
data/bolao-publico.json
```

5. Suba essa alteração no GitHub.
6. O site público passará a mostrar essa nova versão.

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

## V15 público - correção do gráfico de evolução

- O gráfico de evolução por rodada agora exibe pontos visíveis mesmo quando há apenas uma rodada finalizada.
- Quando houver duas ou mais rodadas, o gráfico passa a ligar os pontos normalmente.


## Atualização - Modal público de palpites por jogo

A tela **Jogos** agora possui o botão **Ver palpites**, que abre um modal somente leitura com:

- resultado final do jogo;
- resumo do jogo;
- total de palpites, pontuaram, zeraram, média e maior pontuação;
- pontuação e regra atingida por participante;
- destaque para o melhor palpite do jogo;
- tooltip explicativo sobre o critério;
- ordenação automática por maior pontuação quando o jogo está finalizado.


## Atualização - Estatísticas mais compactas

A área **Pontuação por fase** agora usa blocos expansíveis por participante. Isso reduz a rolagem da página e mostra apenas fases que já possuem jogos finalizados.

Também foi ajustado o texto dos critérios de pontuação para diferenciar melhor **Vencedor correto** e **Empate correto**.


## Ajustes visuais - Estatísticas e jogos

- A área **Pontuação por fase** agora abre todos os participantes fechados por padrão.
- O botão **Abrir/Fechar detalhes** recebeu mais destaque visual.
- O alinhamento entre bandeiras, nomes e placar foi corrigido.
- As tabelas compactas de estatísticas foram ajustadas para evitar barras horizontais desnecessárias.


## Atualização - Home sem barras e mobile melhorado

- As tabelas compactas da Home foram ajustadas para não exibirem barras horizontais desnecessárias.
- O layout mobile recebeu melhorias de menu, espaçamento, cards, filtros e tabelas.
- A navegação em telas de celular ficou mais confortável, com menu fixo no topo e botões maiores.

## Atualização - Palpites por jogo

- A aba **Palpites** agora abre por padrão em **visualização por jogo**.
- Os jogos são mostrados em ordem cronológica, facilitando a conferência dos palpites.
- Há opção de alternar para **visualização em tabela**.
- Em jogos ainda não finalizados, a coluna de critério mostra **Aguardando resultado**.


## Atualização - Alinhamento da aba Palpites

A aba **Palpites** recebeu ajustes visuais:

- filtros alinhados em uma linha mais estável no desktop;
- cards de jogos com título, badges e botão **Abrir** melhor distribuídos;
- tabelas internas sem barra horizontal desnecessária no desktop;
- comportamento mobile ajustado para empilhar os elementos sem quebrar a leitura.
