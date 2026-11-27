// teste.js: confere a lógica (fala.js e conteudo.js) sem abrir o navegador.
// Rodar com: node teste.js
const assert = require('assert');
const F = require('./fala.js');
const { NIVEIS } = require('./conteudo.js');

let ok = 0;
function teste(nome, fn) { fn(); ok++; console.log('✓', nome); }

teste('8 velocidades, de 0.25x a 2x', () => {
  assert.deepStrictEqual(F.VELOCIDADES, [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
});

teste('abaixo de 1x: palavra por palavra, pausa maior quanto mais lento', () => {
  const [a, b, c] = [0.25, 0.5, 0.75].map(F.planoDaVelocidade);
  for (const p of [a, b, c]) assert.strictEqual(p.modo, 'palavra');
  assert.ok(a.pausa > b.pausa && b.pausa > c.pausa);
  // a voz nunca é esticada demais (distorce): taxa da palavra fica entre 0.7 e 1
  for (const p of [a, b, c]) assert.ok(p.taxa >= 0.7 && p.taxa <= 1);
});

teste('de 1x para cima: frase corrida na velocidade escolhida', () => {
  for (const v of [1, 1.25, 1.5, 1.75, 2]) {
    const p = F.planoDaVelocidade(v);
    assert.strictEqual(p.modo, 'corrido');
    assert.strictEqual(p.taxa, v);
  }
});

teste('limpar tira a pontuação das pontas e mantém o apóstrofo', () => {
  assert.strictEqual(F.limpar('"Hello,'), 'Hello');
  assert.strictEqual(F.limpar("don't."), "don't");
  assert.strictEqual(F.limpar('Max!"'), 'Max');
});

teste('dividirFrases separa por ponto, interrogação e exclamação', () => {
  const fr = F.dividirFrases('Hello! My name is Tom. Do you like pizza? Yes.');
  assert.deepStrictEqual(fr, ['Hello!', 'My name is Tom.', 'Do you like pizza?', 'Yes.']);
});

teste('dividirFrases corta frase gigante (para a voz não travar)', () => {
  const longa = Array.from({ length: 60 }, (_, i) => 'word' + i).join(' ') + '.';
  const fr = F.dividirFrases(longa);
  assert.ok(fr.length >= 3);
  assert.ok(fr.every(f => F.palavras(f).length <= 25));
  assert.strictEqual(fr.join(' '), longa);
});

teste('montarFala + palavraNoChar acham a palavra certa', () => {
  const ps = ['I', 'like', 'games.'];
  const { texto, offsets } = F.montarFala(ps, 0);
  assert.strictEqual(texto, 'I like games.');
  assert.strictEqual(F.palavraNoChar(offsets, 2), 1);
  assert.strictEqual(F.palavraNoChar(offsets, 7), 2);
  const doMeio = F.montarFala(ps, 1);
  assert.strictEqual(doMeio.texto, 'like games.');
});

teste('tempos estimados crescem e ficam mais curtos em velocidade maior', () => {
  const t1 = F.temposEstimados(['hello', 'my', 'friend'], 1);
  const t2 = F.temposEstimados(['hello', 'my', 'friend'], 2);
  assert.strictEqual(t1[0], 0);
  assert.ok(t1[1] < t1[2]);
  assert.ok(t2[2] < t1[2]);
});

teste('vozes: só inglês, Google primeiro, depois as "Natural"', () => {
  const vs = [
    { name: 'Microsoft Maria - Portuguese (Brazil)', lang: 'pt-BR' },
    { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)', lang: 'en-GB' },
    { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' },
    { name: 'Google UK English Female', lang: 'en-GB' },
    { name: 'Google US English', lang: 'en-US' },
    { name: 'English Android', lang: 'en_US' },
  ];
  const edge = F.ordenarVozes([{ name: 'Microsoft Ana Online (Natural) - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Jenny Online (Natural) - English (United States)', lang: 'en-US' }]);
  assert.ok(edge[0].name.includes('Jenny'), 'no Edge, a padrão não pode ser a voz de criança');
  const ord = F.ordenarVozes(vs).map(v => v.name);
  assert.strictEqual(ord.length, 6);
  assert.deepStrictEqual(ord.slice(0, 4), ['Google US English', 'Google UK English Female',
    'Microsoft Aria Online (Natural) - English (United States)', 'Microsoft Sonia Online (Natural) - English (United Kingdom)']);
  assert.strictEqual(F.rotuloVoz(vs[3]), 'Aria (natural) · EUA');
});

teste('conteúdo: 5 níveis, lições com tradução, ids únicos', () => {
  assert.strictEqual(NIVEIS.length, 5);
  const ids = new Set();
  for (const n of NIVEIS) {
    for (const l of n.licoes) {
      assert.ok(!ids.has(l.id), 'id repetido: ' + l.id);
      ids.add(l.id);
      for (const f of l.frases) {
        assert.ok(f[0] && f[1], `frase sem tradução em ${l.id}: ${f[0]}`);
        if (n.n === 1) assert.ok(f[2], `palavra sem figura em ${l.id}: ${f[0]}`);
      }
    }
    assert.ok(F.PADRAO_NIVEL[n.n], 'nível sem padrão: ' + n.n);
  }
});

console.log(`\n${ok} testes passaram.`);

// ---------- v2: treino ----------
const T = require('./treino.js');

teste('repita comigo: frase igual = tudo certo', () => {
  const c = T.compararFala(['Hello!', 'My', 'name', 'is', 'Eduardo.'], 'hello my name is Eduardo');
  assert.deepStrictEqual(c, [true, true, true, true, true]);
  assert.strictEqual(T.nota(c).msg, 'Tudo certo.');
});

teste('repita comigo: palavra trocada fica vermelha, o resto continua certo', () => {
  const c = T.compararFala(['I', 'like', 'games.'], 'I lake games');
  assert.deepStrictEqual(c, [true, false, true]);
});

teste('repita comigo: palavra pulada fica vermelha', () => {
  const c = T.compararFala(['Max', 'is', 'brown', 'and', 'very', 'happy.'], 'max is brown very happy');
  assert.deepStrictEqual(c, [true, true, true, false, true, true]);
});

teste("repita comigo: I'm = I am, 7 = seven, dog's = dog", () => {
  assert.deepStrictEqual(T.compararFala(["I'm", 'fine'], 'I am fine'), [true, true]);
  assert.deepStrictEqual(T.compararFala(['I', 'wake', 'up', 'at', 'seven.'], 'I wake up at 7'), [true, true, true, true, true]);
  assert.deepStrictEqual(T.compararFala(["The", "dog's", 'name'], 'the dogs name'), [true, true, true]);
});

teste('repita comigo: não ouviu nada = tudo vermelho', () => {
  assert.deepStrictEqual(T.compararFala(['Good', 'night!'], ''), [false, false]);
});

teste('flashcards: acertou sobe de caixa e volta mais tarde; errou volta hoje', () => {
  const hoje = '2026-11-20';
  let c = { en: 'water', pt: 'água' };
  c = T.responder(c, true, hoje);
  assert.strictEqual(c.caixa, 1); assert.strictEqual(c.proxima, '2026-11-21');
  c = T.responder(c, true, '2026-11-21');
  assert.strictEqual(c.caixa, 2); assert.strictEqual(c.proxima, '2026-11-23');
  c = T.responder(c, false, '2026-11-23');
  assert.strictEqual(c.caixa, 0); assert.strictEqual(c.proxima, '2026-11-23');
  assert.strictEqual(c.acertos, 2); assert.strictEqual(c.erros, 1);
});

teste('flashcards: só aparecem as palavras vencidas (e as novas)', () => {
  const cad = [{ en: 'a' }, { en: 'b', proxima: '2026-11-19' }, { en: 'c', proxima: '2026-11-25' }];
  assert.deepStrictEqual(T.paraRevisar(cad, '2026-11-20').map(c => c.en), ['a', 'b']);
  assert.strictEqual(T.somarDias('2026-12-30', 4), '2027-01-03');
});

console.log(`\n${ok} testes passaram (com o treino).`);

// ---------- espanhol e lições por assunto (2026-11-26) ----------
const ES = require('./conteudo-es.js');
const A = require('./assunto.js');

teste('espanhol: mesmos 5 níveis e mesma quantidade de lições do inglês, ids únicos', () => {
  assert.deepStrictEqual(ES.NIVEIS.map(n => n.n), NIVEIS.map(n => n.n));
  ES.NIVEIS.forEach((nv, i) => assert.strictEqual(nv.licoes.length, NIVEIS[i].licoes.length));
  const ids = ES.NIVEIS.flatMap(n => n.licoes.map(l => l.id));
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(!NIVEIS.some(n => n.licoes.some(l => l.id === id)), 'id repetido com o inglês: ' + id);
  for (const nv of ES.NIVEIS) for (const l of nv.licoes) for (const f of l.frases) assert.ok(f[0] && f[1], l.id);
});

teste('vozes: no espanhol só aparecem vozes em espanhol (Google primeiro, Espanha antes do México)', () => {
  const v = [
    { name: 'Microsoft Dalia Online (Natural) - Spanish (Mexico)', lang: 'es-MX' },
    { name: 'Google español', lang: 'es-ES' },
    { name: 'Microsoft Elvira Online (Natural) - Spanish (Spain)', lang: 'es-ES' },
    { name: 'Google US English', lang: 'en-US' },
    { name: 'Google español de Estados Unidos', lang: 'es_US' },
  ];
  const nomes = F.ordenarVozes(v, 'es').map(x => x.name);
  assert.deepStrictEqual(nomes, ['Google español', 'Google español de Estados Unidos',
    'Microsoft Elvira Online (Natural) - Spanish (Spain)', 'Microsoft Dalia Online (Natural) - Spanish (Mexico)']);
  assert.strictEqual(F.rotuloVoz(v[2]), 'Elvira (natural) · Espanha');
  assert.deepStrictEqual(F.ordenarVozes(v).map(x => x.name), ['Google US English']);   // o inglês continua igual
});

teste('espanhol: frases que começam com ¿ e ¡ são separadas', () => {
  assert.deepStrictEqual(F.dividirFrases('Hola. ¿Cómo estás? ¡Muy bien!'), ['Hola.', '¿Cómo estás?', '¡Muy bien!']);
  assert.strictEqual(F.limpar('¿Cómo'), 'Cómo');
  assert.strictEqual(F.limpar('niño!'), 'niño');
});

teste('repita comigo em espanhol: acento não atrapalha e 7 = siete', () => {
  const tela = F.palavras('¿Dónde está mi teléfono?');
  assert.ok(T.compararFala(tela, 'donde esta mi telefono', 'es').every(Boolean));
  assert.ok(T.compararFala(F.palavras('Me despierto a las siete.'), 'me despierto a las 7', 'es').every(Boolean));
  assert.deepStrictEqual(T.compararFala(F.palavras('Tengo hambre.'), 'tengo hombre', 'es'), [true, false]);
});

teste('assunto: o pedido para a IA leva o assunto, o idioma e o formato JSON', () => {
  const m = A.montarPedido('futebol', 'espanhol', 'historia');
  const tudo = m.map(x => x.content).join(' ');
  assert.ok(tudo.includes('futebol') && tudo.includes('espanhol') && tudo.includes('"frases"'));
});

teste('assunto: lê a resposta da IA mesmo com ```json em volta, e recusa resposta ruim', () => {
  const r = A.lerResposta('Claro!\n```json\n{"titulo":"No estádio","frases":[["Vamos al estadio.","Vamos ao estádio."],["El partido empieza a las ocho.","O jogo começa às oito."],["¡Gol!","Gol!"]]}\n```');
  assert.strictEqual(r.titulo, 'No estádio');
  assert.strictEqual(r.frases.length, 3);
  assert.strictEqual(A.lerResposta('não sei'), null);
  assert.strictEqual(A.lerResposta('{"titulo":"x","frases":[["só uma","uma"]]}'), null);   // poucas frases
  assert.strictEqual(A.lerResposta('{"frases": "texto"}'), null);
});

console.log(`\n${ok} testes passaram (com espanhol e assuntos).`);

// ---------- nuvem: juntar o progresso de dois aparelhos (2026-11-26) ----------
const SI = require('./sincronia.js');

teste('nuvem: lição feita em qualquer aparelho fica feita nos dois', () => {
  const j = SI.juntar({ feitas: { '1-casa': true } }, { feitas: { '1-comida': true } });
  assert.deepStrictEqual(Object.keys(j.feitas).sort(), ['1-casa', '1-comida']);
});

teste('nuvem: caderno sem palavra repetida; fica o cartão mais revisado', () => {
  const pc = { caderno: [{ en: 'water', pt: 'água', acertos: 3 }, { en: 'bread', pt: 'pão' }] };
  const cel = { caderno: [{ en: 'Water', pt: 'água', acertos: 0 }, { en: 'milk', pt: 'leite' }] };
  const j = SI.juntar(pc, cel);
  assert.deepStrictEqual(j.caderno.map(c => c.en).sort(), ['bread', 'milk', 'water']);
  assert.strictEqual(j.caderno.find(c => c.en === 'water').acertos, 3);
});

teste('nuvem: o que você apagou não volta do outro aparelho', () => {
  const aqui = { caderno: [], tirados: ['water'], assuntos: [], apagados: ['a-1'] };
  const nuvem = { caderno: [{ en: 'water' }], assuntos: [{ id: 'a-1', titulo: 'x', frases: [] }, { id: 'a-2', titulo: 'y', frases: [] }], feitas: { 'a-1': true } };
  const j = SI.juntar(aqui, nuvem);
  assert.strictEqual(j.caderno.length, 0);
  assert.deepStrictEqual(j.assuntos.map(l => l.id), ['a-2']);
  assert.ok(!j.feitas['a-1']);
});

teste('nuvem: dado estragado na nuvem não quebra o app', () => {
  const j = SI.juntar({ feitas: { x: true } }, 'lixo');
  assert.deepStrictEqual(j.feitas, { x: true });
  assert.ok(SI.igual(SI.juntar(j, {}), j));
});

teste('dividirFrases: abreviação não corta a frase (inglês e espanhol)', () => {
  assert.deepStrictEqual(F.dividirFrases('El Sr. García vive con la Dra. López. ¿Y tú?'),
    ['El Sr. García vive con la Dra. López.', '¿Y tú?']);
  assert.deepStrictEqual(F.dividirFrases('Mr. Smith met Dr. Brown. J. K. Rowling wrote it.'),
    ['Mr. Smith met Dr. Brown.', 'J. K. Rowling wrote it.']);
  assert.deepStrictEqual(F.dividirFrases('Vamos al parque, etc. Mañana es sábado.'),
    ['Vamos al parque, etc.', 'Mañana es sábado.']);
});

console.log(`
${ok} testes passaram (com a nuvem).`);
