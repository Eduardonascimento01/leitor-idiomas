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
