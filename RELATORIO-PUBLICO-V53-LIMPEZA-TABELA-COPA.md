# Bolao Copa 2026 - Publico - v53

## Limpeza da consulta publica

### Home
- Removido ranking resumido.
- Removido grafico simples de pontuacao geral.
- Mantidos KPIs principais.
- Home reorganizada com:
  - resumo do bolao/premiacao;
  - proximos jogos;
  - ultimos resultados.

### Ranking
- Removido grafico "Total por participante".
- Mantidos podio, premiacao e ranking geral.

### Estatisticas
- Removido card "Mais jogos perdidos".
- Removidos graficos "Aproveitamento percentual" e "Jogos perdidos sem palpite".
- "Jogos que mais deram pontos" aumentado de 6 para 15.
- "Jogos mais dificeis" aumentado de 6 para 15.
- Corrigido bug visual em que o destaque da tabela "Pontuacao por fase/rodada" sumia ao passar o mouse.

### Bonus
- Aviso suavizado para consulta publica.

## Tabela da Copa
- Adicionada nova aba "Tabela da Copa" no menu publico.
- Inclui:
  - chave oficial do mata-mata;
  - melhores terceiros;
  - classificacao por grupo.
- Sem simulador.
- Chave organizada em duas laterais com final no centro, usando a mesma ordem corrigida da versao Admin.

## Visual
- Google Fonts adicionadas:
  - Oswald para titulos, destaques e selecoes;
  - Inter para interface e textos.
- Ajuste de dark mode para tom mais escuro.
- Numeros importantes com fonte numerica tabular.

## Validacao
- node --check js/public-app.js
- node tests/public-scoring-tests.js
- Resultado: TESTES PUBLICOS OK / TESTES PUBLICOS V42 OK
