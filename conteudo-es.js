// conteudo-es.js: os níveis e as lições de ESPANHOL (mesma forma do conteudo.js).
// Cada lição é uma lista de frases: [espanhol, português, emoji opcional].
// Palavras escolhidas para servir na Espanha e na América Latina
// (ex: "teléfono" em vez de "móvil" ou "celular").
(function (raiz) {
  'use strict';

  const NIVEIS = [
    {
      n: 1, nome: 'Primeiras palavras', icone: '🌱',
      desc: 'Palavras soltas do dia a dia, com figura e tradução. Bem devagar.',
      licoes: [
        { id: 'es-1-comida', titulo: 'Comida e bebida', frases: [
          ['agua', 'água', '💧'], ['pan', 'pão', '🍞'], ['manzana', 'maçã', '🍎'], ['leche', 'leite', '🥛'],
          ['café', 'café', '☕'], ['arroz', 'arroz', '🍚'], ['huevo', 'ovo', '🥚'], ['queso', 'queijo', '🧀'],
          ['carne', 'carne', '🥩'], ['uva', 'uva', '🍇'], ['naranja', 'laranja', '🍊'], ['pollo', 'frango', '🍗'],
        ] },
        { id: 'es-1-casa', titulo: 'Casa e objetos', frases: [
          ['casa', 'casa', '🏠'], ['puerta', 'porta', '🚪'], ['ventana', 'janela', '🪟'], ['cama', 'cama', '🛏️'],
          ['silla', 'cadeira', '🪑'], ['mesa', 'mesa', '🍽️'], ['cocina', 'cozinha', '🍳'], ['baño', 'banheiro', '🛁'],
          ['llave', 'chave', '🔑'], ['teléfono', 'telefone, celular', '📱'], ['libro', 'livro', '📖'], ['lámpara', 'luminária', '💡'],
        ] },
        { id: 'es-1-pessoas', titulo: 'Pessoas e família', frases: [
          ['hombre', 'homem', '👨'], ['mujer', 'mulher', '👩'], ['niño', 'menino', '👦'], ['niña', 'menina', '👧'],
          ['bebé', 'bebê', '👶'], ['madre', 'mãe', '👩‍👦'], ['padre', 'pai', '👨‍👦'], ['hermano', 'irmão', '🧑'],
          ['hermana', 'irmã', '👧'], ['amigo', 'amigo', '🤝'], ['profesor', 'professor', '🧑‍🏫'], ['familia', 'família', '👨‍👩‍👧'],
        ] },
        { id: 'es-1-cores', titulo: 'Cores e números', frases: [
          ['rojo', 'vermelho', '🔴'], ['azul', 'azul', '🔵'], ['verde', 'verde', '🟢'], ['amarillo', 'amarelo', '🟡'],
          ['negro', 'preto', '⚫'], ['blanco', 'branco', '⚪'], ['uno', 'um', '1️⃣'], ['dos', 'dois', '2️⃣'],
          ['tres', 'três', '3️⃣'], ['cuatro', 'quatro', '4️⃣'], ['cinco', 'cinco', '5️⃣'], ['diez', 'dez', '🔟'],
        ] },
        { id: 'es-1-acoes', titulo: 'Ações (verbos)', frases: [
          ['comer', 'comer', '🍽️'], ['beber', 'beber', '🥤'], ['dormir', 'dormir', '😴'], ['caminar', 'andar, caminhar', '🚶'],
          ['correr', 'correr', '🏃'], ['leer', 'ler', '📖'], ['escribir', 'escrever', '✍️'], ['hablar', 'falar', '🗣️'],
          ['escuchar', 'escutar', '👂'], ['jugar', 'jogar, brincar', '🎮'], ['estudiar', 'estudar', '📚'], ['trabajar', 'trabalhar', '💼'],
        ] },
        { id: 'es-1-cumprimentos', titulo: 'Cumprimentos', frases: [
          ['hola', 'olá', '👋'], ['adiós', 'tchau', '🚶'], ['por favor', 'por favor', '🙏'], ['gracias', 'obrigado', '💛'],
          ['sí', 'sim', '✅'], ['no', 'não', '❌'], ['perdón', 'desculpa', '😅'], ['buenos días', 'bom dia', '🌅'],
          ['buenas noches', 'boa noite', '🌙'], ['con permiso', 'com licença', '🙋'], ['¿cómo estás?', 'como você está?', '🙂'], ['estoy bien', 'estou bem', '👍'],
        ] },
      ],
    },
    {
      n: 2, nome: 'Frases curtas', icone: '🌿',
      desc: 'Frases de 3 a 8 palavras, com tradução. Para depois de cada frase.',
      licoes: [
        { id: 'es-2-apresentacao', titulo: 'Me apresentando', frases: [
          ['¡Hola! Me llamo Eduardo.', 'Olá! Meu nome é Eduardo.'],
          ['Soy de Brasil.', 'Eu sou do Brasil.'],
          ['Vivo en São Paulo.', 'Eu moro em São Paulo.'],
          ['Soy estudiante.', 'Eu sou estudante.'],
          ['Estudio informática.', 'Eu estudo informática.'],
          ['Me gustan los videojuegos.', 'Eu gosto de videogames.'],
          ['Quiero aprender español.', 'Eu quero aprender espanhol.'],
          ['¡Mucho gusto!', 'Muito prazer!'],
        ] },
        { id: 'es-2-comida', titulo: 'Na hora de comer', frases: [
          ['Tengo hambre.', 'Estou com fome.'],
          ['Quiero un poco de agua, por favor.', 'Eu quero um pouco de água, por favor.'],
          ['El café está caliente.', 'O café está quente.'],
          ['Este pan está muy rico.', 'Este pão está muito gostoso.'],
          ['Como arroz con pollo.', 'Eu como arroz com frango.'],
          ['¿Te gusta la pizza?', 'Você gosta de pizza?'],
          ['¡Sí, me encanta la pizza!', 'Sim, eu adoro pizza!'],
          ['La cuenta, por favor.', 'A conta, por favor.'],
        ] },
        { id: 'es-2-casa', titulo: 'Minha casa', frases: [
          ['Esta es mi casa.', 'Esta é a minha casa.'],
          ['Mi habitación es pequeña.', 'Meu quarto é pequeno.'],
          ['La cocina es grande.', 'A cozinha é grande.'],
          ['Mi cama está al lado de la ventana.', 'Minha cama fica ao lado da janela.'],
          ['La puerta está abierta.', 'A porta está aberta.'],
          ['¿Dónde está mi teléfono?', 'Onde está o meu celular?'],
          ['Está encima de la mesa.', 'Está em cima da mesa.'],
          ['Me gusta mi casa.', 'Eu gosto da minha casa.'],
        ] },
        { id: 'es-2-dia', titulo: 'Meu dia', frases: [
          ['Me despierto a las siete.', 'Eu acordo às sete.'],
          ['Me ducho.', 'Eu tomo banho.'],
          ['Desayuno con mi familia.', 'Eu tomo café da manhã com a minha família.'],
          ['Voy a la universidad en autobús.', 'Eu vou para a faculdade de ônibus.'],
          ['Estudio por la tarde.', 'Eu estudo à tarde.'],
          ['Por la noche, juego videojuegos.', 'À noite, eu jogo videogame.'],
          ['Me acuesto a las once.', 'Eu vou para a cama às onze.'],
          ['¡Buenas noches!', 'Boa noite!'],
        ] },
      ],
    },
    {
      n: 3, nome: 'Historinhas fáceis', icone: '🌳',
      desc: 'Histórias curtas com palavras simples. Tradução frase por frase.',
      licoes: [
        { id: 'es-3-tomas', titulo: 'Tomás y su perro', frases: [
          ['Tomás tiene un perrito.', 'O Tomás tem um cachorrinho.'],
          ['El perro se llama Max.', 'O cachorro se chama Max.'],
          ['Max es marrón y muy feliz.', 'O Max é marrom e muito feliz.'],
          ['Todas las mañanas, pasean por el parque.', 'Toda manhã, eles passeiam pelo parque.'],
          ['A Max le gusta correr detrás de la pelota.', 'O Max gosta de correr atrás da bola.'],
          ['Un día, la pelota cae al lago.', 'Um dia, a bola cai no lago.'],
          ['¡Max salta al agua!', 'O Max pula na água!'],
          ['Vuelve con la pelota en la boca.', 'Ele volta com a bola na boca.'],
          ['Tomás se ríe y dice: "¡Muy bien, Max!"', 'O Tomás ri e diz: "Muito bem, Max!"'],
        ] },
        { id: 'es-3-domingo', titulo: 'Un domingo de lluvia', frases: [
          ['Es domingo y está lloviendo.', 'É domingo e está chovendo.'],
          ['Ana no puede ir a la playa.', 'A Ana não pode ir à praia.'],
          ['Está un poco triste.', 'Ela está um pouco triste.'],
          ['Entonces su hermano tiene una idea.', 'Então o irmão dela tem uma ideia.'],
          ['"¡Vamos a hacer un pastel!", dice él.', '"Vamos fazer um bolo!", ele diz.'],
          ['Mezclan huevos, leche, azúcar y harina.', 'Eles misturam ovos, leite, açúcar e farinha.'],
          ['La cocina huele de maravilla.', 'A cozinha fica com um cheiro maravilhoso.'],
          ['Después de una hora, el pastel está listo.', 'Depois de uma hora, o bolo está pronto.'],
          ['Ana sonríe. Los días de lluvia también pueden ser divertidos.', 'A Ana sorri. Dias de chuva também podem ser divertidos.'],
        ] },
        { id: 'es-3-programa', titulo: 'Mi primer programa', frases: [
          ['Leo está aprendiendo a programar.', 'O Leo está aprendendo a programar.'],
          ['Enciende la computadora y escribe su primer programa.', 'Ele liga o computador e escreve o seu primeiro programa.'],
          ['El programa dice: "¡Hola, mundo!"', 'O programa diz: "Olá, mundo!"'],
          ['Leo está muy orgulloso.', 'O Leo fica muito orgulhoso.'],
          ['Después, quiere hacer un juego pequeño.', 'Depois, ele quer fazer um joguinho.'],
          ['En el juego, un gato salta sobre unas cajas.', 'No jogo, um gato pula por cima de umas caixas.'],
          ['No es fácil, pero él no se rinde.', 'Não é fácil, mas ele não desiste.'],
          ['Una semana después, sus amigos juegan con su juego.', 'Uma semana depois, os amigos dele jogam o jogo dele.'],
          ['"¡Qué genial!", dicen.', '"Que legal!", eles dizem.'],
        ] },
      ],
    },
    {
      n: 4, nome: 'Textos adaptados', icone: '🏔️',
      desc: 'Textos maiores e velocidade normal. A tradução fica escondida: toque em PT para ver.',
      licoes: [
        { id: 'es-4-faro', titulo: 'El viejo faro', frases: [
          ['En una pequeña isla, había un viejo faro.', 'Numa pequena ilha, havia um farol antigo.'],
          ['Durante muchos años, su luz guió a los barcos en las noches oscuras.', 'Por muitos anos, a luz dele guiou os navios nas noites escuras.'],
          ['El farero, un señor llamado Walter, vivía allí solo.', 'O faroleiro, um senhor chamado Walter, morava lá sozinho.'],
          ['Cada noche, subía cien escalones para encender la luz.', 'Toda noite, ele subia cem degraus para acender a luz.'],
          ['Una noche de tormenta, la luz se apagó de repente.', 'Numa noite de tempestade, a luz se apagou de repente.'],
          ['Walter oyó la bocina de un barco a lo lejos.', 'O Walter ouviu a buzina de um navio ao longe.'],
          ['Tomó su vieja linterna y subió las escaleras lo más rápido que pudo.', 'Ele pegou a velha lanterna e subiu a escada o mais rápido que conseguiu.'],
          ['Le temblaban las manos, pero arregló la lámpara justo a tiempo.', 'As mãos dele tremiam, mas ele consertou a lâmpada bem a tempo.'],
          ['El barco cambió de rumbo y entró en el puerto sano y salvo.', 'O navio mudou de rumo e entrou no porto são e salvo.'],
          ['A la mañana siguiente, el capitán vino a darle las gracias en persona.', 'Na manhã seguinte, o capitão veio agradecer a ele pessoalmente.'],
        ] },
        { id: 'es-4-idioma', titulo: '¿Por qué aprender un idioma nuevo?', frases: [
          ['Aprender un idioma nuevo es como abrir una puerta nueva.', 'Aprender uma língua nova é como abrir uma porta nova.'],
          ['Al principio, todo suena extraño y rápido.', 'No começo, tudo parece estranho e rápido.'],
          ['Entiendes solo algunas palabras, y eso es completamente normal.', 'Você entende só algumas palavras, e isso é completamente normal.'],
          ['El secreto es practicar un poco todos los días.', 'O segredo é praticar um pouco todo dia.'],
          ['Escucha la misma frase muchas veces y repítela en voz alta.', 'Escute a mesma frase muitas vezes e repita em voz alta.'],
          ['Tu boca necesita entrenamiento, igual que tu cerebro.', 'A sua boca precisa de treino, assim como o seu cérebro.'],
          ['No tengas miedo de equivocarte.', 'Não tenha medo de errar.'],
          ['Cada error te muestra qué practicar después.', 'Cada erro mostra o que praticar em seguida.'],
          ['Algún día, verás una película sin subtítulos.', 'Um dia, você vai assistir a um filme sem legendas.'],
          ['Y vas a sonreír, porque vas a entender.', 'E você vai sorrir, porque vai entender.'],
        ] },
      ],
    },
    {
      n: 5, nome: 'Seu Arquivo', icone: '🚀',
      desc: 'Abra o seu PDF ou .txt em espanhol, ou cole um texto. A tradução vem da internet quando você pede.',
      licoes: [],
    },
  ];

  const api = { NIVEIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.ConteudoES = api;
})(this);
