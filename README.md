# Leitor de Idiomas

Aprenda **inglês e espanhol** ouvindo uma **voz nativa**, palavra por palavra, com tradução.
Projeto irmão do [Leitor de Livros](https://github.com/Eduardonascimento01/leitor-livros).

## O que faz
- **Dois idiomas:** inglês e espanhol, escolhidos no topo da tela inicial. Cada idioma tem o próprio progresso, caderno e voz.
- **6 níveis:** Primeiras palavras, Frases curtas, Historinhas fáceis, Textos adaptados, Seu Arquivo (seu PDF, .txt ou texto colado) e Seus assuntos.
- **Nível 6, Seus assuntos:** libera depois das lições dos níveis 1 a 4. Você escreve um assunto (ex: futebol), escolhe o tipo (frases curtas, historinha ou texto) e uma IA grátis escreve a lição, com tradução.
- **Voz nativa:** só aparecem vozes do idioma escolhido. Google (Chrome) primeiro, depois as vozes "Natural" da Microsoft (Edge). No espanhol, Espanha primeiro e depois México e EUA (dá para trocar em "Voz e opções").
- **8 velocidades:** 0.25×, 0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75× e 2×.
  - Abaixo de 1×, a voz fala **palavra por palavra**, e a pausa entre elas cresce quanto mais lento. A voz não é esticada, porque isso distorce o som.
- **Tocar numa palavra:** ouvir normal ou devagar, ver a tradução e a pronúncia (IPA, só no inglês) e salvar no caderno.
- **Frase a frase:** opção de parar depois de cada frase e botão 🔁 Repetir.
- **Tradução:** visível, escondida ou só na frase em que você tocar no botão PT.
- **🎤 Repita comigo (v2):** você fala a frase no microfone e cada palavra fica verde (certa) ou vermelha (treinar). Pode ser pelo botão 🎤 ou automático depois de cada frase. Também funciona na janela da palavra e nos flashcards.
- **🧠 Flashcards com revisão espaçada (v2):** as palavras do caderno voltam para revisão em 1, 2, 4, 7, 15 e 30 dias conforme você acerta; se errar, ela volta no mesmo dia. No nível 1, dá para pôr todas as palavras da lição no caderno de uma vez.
- **Caderno de palavras** e progresso das lições, guardados no navegador.
- **☁️ Progresso na nuvem (opcional):** entrando com o Google, as lições feitas, o caderno e os seus assuntos ficam no Firebase e aparecem em qualquer aparelho. O que foi feito em dois aparelhos é juntado sem perder nada (`sincronia.js`).
- Funciona no PC e no celular.

## Como usar
Abra o `index.html` no Chrome ou no Edge, ou acesse a versão publicada.
Atalhos: espaço (ler/pausar), ← → (frase anterior/próxima), R (repetir), M (microfone).
O microfone usa o reconhecimento de fala do navegador (melhor no Chrome) e precisa de internet.
Link direto para uma lição: `index.html#licao=2-casa`.

## Arquivos
- `fala.js`: a lógica da leitura (velocidades, frases, vozes), testável no Node
- `treino.js`: compara a sua fala com a frase e calcula a revisão espaçada, testável no Node
- `conteudo.js` e `conteudo-es.js`: os níveis e as lições (inglês e espanhol)
- `assunto.js`: pede a lição do nível 6 para a IA e confere a resposta
- `sincronia.js`: junta o progresso do aparelho com o da nuvem, testável no Node
- `nuvem.js`: login com o Google e gravação no Firebase; `firebase-config.js` liga (null = desligado); `firestore.rules`: regras de segurança para colar no console
- `app.js`: a tela e a voz
- `texto.js`: transforma o texto do PDF em parágrafos (vem do Leitor de Livros)
- `teste.js`: rode `node teste.js`

## Serviços usados (grátis, sem cadastro)
- [Pollinations](https://github.com/pollinations/pollinations): IA de código aberto que escreve as lições do nível 6 (só funciona pelo site no ar)
- [MyMemory](https://mymemory.translated.net/): tradução de palavras e frases
- [Free Dictionary API](https://dictionaryapi.dev/): pronúncia
- [PDF.js](https://mozilla.github.io/pdf.js/): ler PDF
