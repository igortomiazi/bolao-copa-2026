# Bolão Copa 2026 Público - v54 Ajustes finais

## Correções

### Home
- Corrigido o botão **Ver palpites** nos cards de **Últimos resultados**.
- Agora ele abre o modal de palpites do jogo, igual acontece na aba Jogos.

### Tabela da Copa
- Ajustada a chave oficial para evitar rolagem lateral desnecessária em telas grandes.
- Reduzidos espaçamentos, largura mínima e tamanho de cards para a chave caber melhor na área disponível.
- Em telas pequenas/mobile, a chave não é exibida como bracket horizontal:
  - vira uma lista simples por fase;
  - sem conectores;
  - sem rolagem lateral pesada.

### Melhores terceiros
- Removidas rolagens laterais desnecessárias nas tabelas.
- As tabelas agora usam `table-layout: fixed` e larguras específicas por coluna.
- No mobile, colunas menos importantes são ocultadas para manter a leitura limpa.

## Validação
- `node --check js/public-app.js`
- `node tests/public-scoring-tests.js`
- Resultado: TESTES PUBLICOS OK / TESTES PUBLICOS V42 OK
