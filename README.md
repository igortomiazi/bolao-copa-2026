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

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo:

```txt
bolao-copa-2026
```

2. Envie para a raiz do repositório estes arquivos/pastas:

```txt
index.html
css/
js/
data/
tests/
README.md
```

3. Vá em:

```txt
Settings → Pages
```

4. Configure:

```txt
Source: Deploy from a branch
Branch: main
Folder: / root
```

5. Salve.

O link público ficará parecido com:

```txt
https://SEU_USUARIO.github.io/bolao-copa-2026/
```

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

## Testes

Se tiver Node instalado, execute:

```bash
node tests/public-scoring-tests.js
```

Resultado esperado:

```txt
TESTES PUBLICOS OK
```

