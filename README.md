# Leitor de Inglês

Aprenda inglês ouvindo uma **voz nativa**, palavra por palavra, com tradução.
Projeto irmão do [Leitor de Livros](https://github.com/Eduardonascimento01/leitor-livros).

## O que faz
- **5 níveis:** Primeiras palavras, Frases curtas, Historinhas fáceis, Textos adaptados e Livro de verdade (seu PDF, .txt ou texto colado).
- **Voz nativa em inglês:** só aparecem vozes em inglês. Google (Chrome) primeiro, depois as vozes "Natural" da Microsoft (Edge).
- **8 velocidades:** 0.25×, 0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75× e 2×.
  - Abaixo de 1×, a voz fala **palavra por palavra**, e a pausa entre elas cresce quanto mais lento. A voz não é esticada, porque isso distorce o som.
- **Tocar numa palavra:** ouvir normal ou devagar, ver a tradução e a pronúncia (IPA) e salvar no caderno.
- **Frase a frase:** opção de parar depois de cada frase e botão 🔁 Repetir.
- **Tradução:** visível, escondida ou só na frase em que você tocar no botão PT.
- **Caderno de palavras** e progresso das lições, guardados no navegador.
- Funciona no PC e no celular.

## Como usar
Abra o `index.html` no Chrome ou no Edge, ou acesse a versão publicada.
Atalhos: espaço (ler/pausar), ← → (frase anterior/próxima), R (repetir).
Link direto para uma lição: `index.html#licao=2-casa`.

## Arquivos
- `fala.js`: a lógica da leitura (velocidades, frases, vozes), testável no Node
- `conteudo.js`: os níveis e as lições
- `app.js`: a tela e a voz
- `texto.js`: transforma o texto do PDF em parágrafos (vem do Leitor de Livros)
- `teste.js`: rode `node teste.js`

## Serviços usados (grátis, sem cadastro)
- [MyMemory](https://mymemory.translated.net/): tradução de palavras e frases
- [Free Dictionary API](https://dictionaryapi.dev/): pronúncia
- [PDF.js](https://mozilla.github.io/pdf.js/): ler PDF
