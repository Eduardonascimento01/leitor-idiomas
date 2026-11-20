// conteudo.js: os níveis e as lições que já vêm no app.
// Cada lição é uma lista de frases: [inglês, português, emoji opcional].
// No nível 1 cada "frase" é uma palavra só.
(function (raiz) {
  'use strict';

  const NIVEIS = [
    {
      n: 1, nome: 'Primeiras palavras', icone: '🌱',
      desc: 'Palavras soltas do dia a dia, com figura e tradução. Bem devagar.',
      licoes: [
        { id: '1-comida', titulo: 'Comida e bebida', frases: [
          ['water', 'água', '💧'], ['bread', 'pão', '🍞'], ['apple', 'maçã', '🍎'], ['milk', 'leite', '🥛'],
          ['coffee', 'café', '☕'], ['rice', 'arroz', '🍚'], ['egg', 'ovo', '🥚'], ['cheese', 'queijo', '🧀'],
          ['meat', 'carne', '🥩'], ['juice', 'suco', '🧃'], ['banana', 'banana', '🍌'], ['chicken', 'frango', '🍗'],
        ] },
        { id: '1-casa', titulo: 'Casa e objetos', frases: [
          ['house', 'casa', '🏠'], ['door', 'porta', '🚪'], ['window', 'janela', '🪟'], ['bed', 'cama', '🛏️'],
          ['chair', 'cadeira', '🪑'], ['table', 'mesa', '🍽️'], ['kitchen', 'cozinha', '🍳'], ['bathroom', 'banheiro', '🛁'],
          ['key', 'chave', '🔑'], ['phone', 'celular', '📱'], ['book', 'livro', '📖'], ['computer', 'computador', '💻'],
        ] },
        { id: '1-pessoas', titulo: 'Pessoas e família', frases: [
          ['man', 'homem', '👨'], ['woman', 'mulher', '👩'], ['boy', 'menino', '👦'], ['girl', 'menina', '👧'],
          ['baby', 'bebê', '👶'], ['mother', 'mãe', '👩‍👦'], ['father', 'pai', '👨‍👦'], ['brother', 'irmão', '🧑'],
          ['sister', 'irmã', '👧'], ['friend', 'amigo', '🤝'], ['teacher', 'professor', '🧑‍🏫'], ['family', 'família', '👨‍👩‍👧'],
        ] },
        { id: '1-cores', titulo: 'Cores e números', frases: [
          ['red', 'vermelho', '🔴'], ['blue', 'azul', '🔵'], ['green', 'verde', '🟢'], ['yellow', 'amarelo', '🟡'],
          ['black', 'preto', '⚫'], ['white', 'branco', '⚪'], ['one', 'um', '1️⃣'], ['two', 'dois', '2️⃣'],
          ['three', 'três', '3️⃣'], ['four', 'quatro', '4️⃣'], ['five', 'cinco', '5️⃣'], ['ten', 'dez', '🔟'],
        ] },
        { id: '1-acoes', titulo: 'Ações (verbos)', frases: [
          ['eat', 'comer', '🍽️'], ['drink', 'beber', '🥤'], ['sleep', 'dormir', '😴'], ['walk', 'andar', '🚶'],
          ['run', 'correr', '🏃'], ['read', 'ler', '📖'], ['write', 'escrever', '✍️'], ['speak', 'falar', '🗣️'],
          ['listen', 'escutar', '👂'], ['play', 'jogar, brincar', '🎮'], ['study', 'estudar', '📚'], ['work', 'trabalhar', '💼'],
        ] },
        { id: '1-cumprimentos', titulo: 'Cumprimentos', frases: [
          ['hello', 'olá', '👋'], ['goodbye', 'tchau', '🚶'], ['please', 'por favor', '🙏'], ['thank you', 'obrigado', '💛'],
          ['yes', 'sim', '✅'], ['no', 'não', '❌'], ['sorry', 'desculpa', '😅'], ['good morning', 'bom dia', '🌅'],
          ['good night', 'boa noite', '🌙'], ['excuse me', 'com licença', '🙋'], ['how are you?', 'como vai você?', '🙂'], ["I'm fine", 'estou bem', '👍'],
        ] },
      ],
    },
    {
      n: 2, nome: 'Frases curtas', icone: '🌿',
      desc: 'Frases de 3 a 8 palavras, com tradução. Para depois de cada frase.',
      licoes: [
        { id: '2-apresentacao', titulo: 'Me apresentando', frases: [
          ['Hello! My name is Eduardo.', 'Olá! Meu nome é Eduardo.'],
          ['I am from Brazil.', 'Eu sou do Brasil.'],
          ['I live in São Paulo.', 'Eu moro em São Paulo.'],
          ['I am a student.', 'Eu sou estudante.'],
          ['I study computer science.', 'Eu estudo ciência da computação.'],
          ['I like games.', 'Eu gosto de jogos.'],
          ['I want to learn English.', 'Eu quero aprender inglês.'],
          ['Nice to meet you!', 'Prazer em conhecer você!'],
        ] },
        { id: '2-comida', titulo: 'Na hora de comer', frases: [
          ['I am hungry.', 'Estou com fome.'],
          ['I want some water, please.', 'Eu quero um pouco de água, por favor.'],
          ['The coffee is hot.', 'O café está quente.'],
          ['This bread is very good.', 'Este pão está muito bom.'],
          ['I eat rice and beans.', 'Eu como arroz e feijão.'],
          ['Do you like pizza?', 'Você gosta de pizza?'],
          ['Yes, I love pizza!', 'Sim, eu amo pizza!'],
          ['Can I have the bill, please?', 'Pode me trazer a conta, por favor?'],
        ] },
        { id: '2-casa', titulo: 'Minha casa', frases: [
          ['This is my house.', 'Esta é a minha casa.'],
          ['My room is small.', 'Meu quarto é pequeno.'],
          ['The kitchen is big.', 'A cozinha é grande.'],
          ['My bed is next to the window.', 'Minha cama fica ao lado da janela.'],
          ['The door is open.', 'A porta está aberta.'],
          ['Where is my phone?', 'Onde está o meu celular?'],
          ['It is on the table.', 'Está em cima da mesa.'],
          ['I like my home.', 'Eu gosto da minha casa.'],
        ] },
        { id: '2-dia', titulo: 'Meu dia', frases: [
          ['I wake up at seven.', 'Eu acordo às sete.'],
          ['I take a shower.', 'Eu tomo banho.'],
          ['I have breakfast.', 'Eu tomo café da manhã.'],
          ['I go to college by bus.', 'Eu vou para a faculdade de ônibus.'],
          ['I study in the afternoon.', 'Eu estudo à tarde.'],
          ['At night, I play games.', 'À noite, eu jogo videogame.'],
          ['I go to bed at eleven.', 'Eu vou para a cama às onze.'],
          ['Good night!', 'Boa noite!'],
        ] },
      ],
    },
    {
      n: 3, nome: 'Historinhas fáceis', icone: '🌳',
      desc: 'Histórias curtas com palavras simples. Tradução frase por frase.',
      licoes: [
        { id: '3-tom', titulo: 'Tom and his dog', frases: [
          ['Tom has a little dog.', 'O Tom tem um cachorrinho.'],
          ["The dog's name is Max.", 'O nome do cachorro é Max.'],
          ['Max is brown and very happy.', 'O Max é marrom e muito feliz.'],
          ['Every morning, they walk in the park.', 'Toda manhã, eles passeiam no parque.'],
          ['Max likes to run after the ball.', 'O Max gosta de correr atrás da bola.'],
          ['One day, the ball falls into the lake.', 'Um dia, a bola cai no lago.'],
          ['Max jumps into the water!', 'O Max pula na água!'],
          ['He comes back with the ball in his mouth.', 'Ele volta com a bola na boca.'],
          ['Tom laughs and says, "Good boy, Max!"', 'O Tom ri e diz: "Muito bem, Max!"'],
        ] },
        { id: '3-domingo', titulo: 'A rainy Sunday', frases: [
          ['It is Sunday, and it is raining.', 'É domingo, e está chovendo.'],
          ['Ana cannot go to the beach.', 'A Ana não pode ir à praia.'],
          ['She is a little sad.', 'Ela está um pouco triste.'],
          ['Then her brother has an idea.', 'Então o irmão dela tem uma ideia.'],
          ['"Let\'s make a cake!" he says.', '"Vamos fazer um bolo!", ele diz.'],
          ['They mix eggs, milk, sugar, and flour.', 'Eles misturam ovos, leite, açúcar e farinha.'],
          ['The kitchen smells wonderful.', 'A cozinha fica com um cheiro maravilhoso.'],
          ['After one hour, the cake is ready.', 'Depois de uma hora, o bolo está pronto.'],
          ['Ana smiles. Rainy days can be fun too.', 'A Ana sorri. Dias de chuva também podem ser divertidos.'],
        ] },
        { id: '3-programa', titulo: 'My first program', frases: [
          ['Leo is learning to code.', 'O Leo está aprendendo a programar.'],
          ['He opens his computer and writes his first program.', 'Ele abre o computador e escreve o seu primeiro programa.'],
          ['The program says, "Hello, world!"', 'O programa diz: "Olá, mundo!"'],
          ['Leo is very proud.', 'O Leo fica muito orgulhoso.'],
          ['Next, he wants to make a small game.', 'Em seguida, ele quer fazer um joguinho.'],
          ['The game has a cat that jumps over boxes.', 'O jogo tem um gato que pula por cima de caixas.'],
          ['It is not easy, but he does not give up.', 'Não é fácil, mas ele não desiste.'],
          ['After a week, his friends play the game.', 'Depois de uma semana, os amigos dele jogam o jogo.'],
          ['"This is so cool!" they say.', '"Isso é muito legal!", eles dizem.'],
        ] },
      ],
    },
    {
      n: 4, nome: 'Textos adaptados', icone: '🏔️',
      desc: 'Textos maiores e velocidade normal. A tradução fica escondida: toque em PT para ver.',
      licoes: [
        { id: '4-farol', titulo: 'The old lighthouse', frases: [
          ['On a small island, there was an old lighthouse.', 'Numa pequena ilha, havia um farol antigo.'],
          ['For many years, its light guided the ships through the dark nights.', 'Por muitos anos, a luz dele guiou os navios pelas noites escuras.'],
          ['The keeper, an old man named Walter, lived there alone.', 'O faroleiro, um senhor chamado Walter, morava lá sozinho.'],
          ['Every evening, he climbed one hundred steps to turn on the light.', 'Toda noite, ele subia cem degraus para acender a luz.'],
          ['One stormy night, the light suddenly went out.', 'Numa noite de tempestade, a luz de repente se apagou.'],
          ["Walter could hear a ship's horn in the distance.", 'O Walter conseguia ouvir a buzina de um navio ao longe.'],
          ['He grabbed his old lantern and ran up the stairs as fast as he could.', 'Ele pegou a velha lanterna e subiu a escada o mais rápido que conseguiu.'],
          ['His hands were shaking, but he fixed the lamp just in time.', 'As mãos dele tremiam, mas ele consertou a lâmpada bem a tempo.'],
          ['The ship changed its course and sailed safely into the harbor.', 'O navio mudou de rumo e entrou no porto em segurança.'],
          ['The next morning, the captain came to thank him in person.', 'Na manhã seguinte, o capitão veio agradecer a ele pessoalmente.'],
        ] },
        { id: '4-idioma', titulo: 'Why learn a new language?', frases: [
          ['Learning a new language is like opening a new door.', 'Aprender uma nova língua é como abrir uma nova porta.'],
          ['At first, everything sounds strange and fast.', 'No começo, tudo parece estranho e rápido.'],
          ['You understand only a few words, and that is completely normal.', 'Você entende só algumas palavras, e isso é completamente normal.'],
          ['The secret is to practice a little every day.', 'O segredo é praticar um pouco todo dia.'],
          ['Listen to the same sentence many times, and repeat it out loud.', 'Escute a mesma frase muitas vezes e repita em voz alta.'],
          ['Your mouth needs training, just like your brain.', 'A sua boca precisa de treino, assim como o seu cérebro.'],
          ["Don't be afraid of making mistakes.", 'Não tenha medo de errar.'],
          ['Every mistake shows you what to practice next.', 'Cada erro mostra o que praticar em seguida.'],
          ['One day, you will watch a movie without subtitles.', 'Um dia, você vai assistir a um filme sem legendas.'],
          ['And you will smile, because you will understand.', 'E você vai sorrir, porque vai entender.'],
        ] },
      ],
    },
    {
      n: 5, nome: 'Livro de verdade', icone: '🚀',
      desc: 'Abra o seu PDF ou .txt em inglês, ou cole um texto. A tradução vem da internet quando você pede.',
      licoes: [],
    },
  ];

  const api = { NIVEIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Conteudo = api;
})(this);
