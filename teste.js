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
  assert.strictEqual(T.nota(c).msg, 'Perfeito! 🎉');
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
