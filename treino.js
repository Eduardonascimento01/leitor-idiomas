// treino.js: a lógica do treino, sem tela (testável no Node).
// 1) Repita comigo: compara o que você falou com a frase do livro, palavra por palavra.
// 2) Flashcards: revisão espaçada (a palavra que você acerta volta cada vez mais tarde).
(function (raiz) {
  'use strict';

  // ---------- 1. comparar a sua fala ----------
  // O reconhecimento de voz às vezes escreve "I'm" e às vezes "I am", "7" ou "seven".
  // Por isso as duas frases passam pela mesma "limpeza" antes de comparar.
  const CONTRACOES = {
    "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is',
    "she's": 'she is', "it's": 'it is', "that's": 'that is', "what's": 'what is', "where's": 'where is',
    "there's": 'there is', "let's": 'let us', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
    "can't": 'can not', cannot: 'can not', "won't": 'will not', "isn't": 'is not', "aren't": 'are not',
    "wasn't": 'was not', "weren't": 'were not', "i'll": 'i will', "you'll": 'you will', "i've": 'i have',
    "i'd": 'i would', "couldn't": 'could not', "wouldn't": 'would not', "shouldn't": 'should not',
  };
  const NUMEROS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

  // Espanhol: números por extenso (sem acento, porque a comparação tira os acentos)
  const NUMEROS_ES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  // "está" e "esta", "Martín" e "Martin": o reconhecimento às vezes erra o acento, então tiramos dos dois lados
  const semAcento = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Uma palavra escrita vira uma ou mais "formas" para comparar: "I'm" -> ["i", "am"]
  function formas(palavra, idioma = 'en') {
    if (idioma === 'es') {
      const p = semAcento(palavra.toLowerCase()).replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
      if (!p) return [];
      if (/^\d+$/.test(p) && +p <= 20) return [NUMEROS_ES[+p]];
      return [p];
    }
    const p = palavra.toLowerCase().replace(/[’‘]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
    if (!p) return [];
    if (CONTRACOES[p]) return CONTRACOES[p].split(' ');
    if (/^\d+$/.test(p) && +p <= 20) return [NUMEROS[+p]];
    const semPosse = p.replace(/'s$/, '');          // "dog's" -> "dog"
    return [semPosse.replace(/'/g, '')];
  }
  // "dog" e "dogs" contam como a mesma palavra (o reconhecimento confunde o 's' do fim)
  const igual = (a, b) => a === b || a + 's' === b || b + 's' === a;
  const normalizar = (texto, idioma) => (texto.match(/\S+/g) || []).flatMap(p => formas(p, idioma));

  // Compara a frase esperada (palavras como aparecem na tela) com o que foi ouvido.
  // Usa a "maior sequência em comum" (LCS): acha o máximo de palavras que batem
  // na mesma ordem, mesmo que você tenha pulado ou trocado alguma.
  // Devolve, para cada palavra da tela, se você acertou: [true, false, ...]
  function compararFala(palavrasDaTela, ouvido, idioma = 'en') {
    // cada palavra da tela pode virar várias formas ("I'm" = "i am"): guardamos de qual palavra veio
    const esperadas = [];
    palavrasDaTela.forEach((p, i) => formas(p, idioma).forEach(f => esperadas.push({ f, i })));
    const ouv = normalizar(ouvido || '', idioma);
    const n = esperadas.length, m = ouv.length;
    const t = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let a = n - 1; a >= 0; a--) {
      for (let b = m - 1; b >= 0; b--) {
        t[a][b] = igual(esperadas[a].f, ouv[b]) ? t[a + 1][b + 1] + 1 : Math.max(t[a + 1][b], t[a][b + 1]);
      }
    }
    const bateu = new Array(n).fill(false);
    let a = 0, b = 0;
    while (a < n && b < m) {
      if (igual(esperadas[a].f, ouv[b])) { bateu[a] = true; a++; b++; }
      else if (t[a + 1][b] >= t[a][b + 1]) a++;
      else b++;
    }
    // a palavra da tela está certa se TODAS as formas dela bateram
    const certo = palavrasDaTela.map(() => null);
    esperadas.forEach((e, k) => { certo[e.i] = (certo[e.i] === null ? true : certo[e.i]) && bateu[k]; });
    // palavra só de pontuação (ex: "—") não conta: fica como certa
    return certo.map(c => (c === null ? true : c));
  }

  // Nota de 0 a 1 e uma mensagem de incentivo
  function nota(certos) {
    const total = certos.length || 1;
    const ok = certos.filter(Boolean).length;
    const n = ok / total;
    const msg = n === 1 ? 'Tudo certo.' : n >= 0.8 ? 'Quase tudo certo.'
      : n >= 0.5 ? 'Ouça de novo as palavras em vermelho.' : 'Ouça a frase de novo e repita devagar.';
    return { ok, total: certos.length, n, msg };
  }

  // ---------- 2. flashcards com revisão espaçada ----------
  // Cada palavra fica numa "caixa" (0 a 6). Acertou: sobe uma caixa e volta mais tarde.
  // Errou: volta para a caixa 0 e aparece de novo hoje mesmo.
  const INTERVALOS = [0, 1, 2, 4, 7, 15, 30];   // dias de espera em cada caixa

  const hojeISO = (d = new Date()) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };
  function somarDias(iso, dias) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    return hojeISO(d);
  }

  function responder(cartao, acertou, hoje) {
    const caixa = acertou ? Math.min(INTERVALOS.length - 1, (cartao.caixa || 0) + 1) : 0;
    return Object.assign({}, cartao, { caixa, proxima: somarDias(hoje, acertou ? INTERVALOS[caixa] : 0),
      acertos: (cartao.acertos || 0) + (acertou ? 1 : 0), erros: (cartao.erros || 0) + (acertou ? 0 : 1) });
  }

  // Cartões que vencem hoje (ou antes). Palavra nova (sem data) vence na hora.
  const paraRevisar = (caderno, hoje) => caderno.filter(c => !c.proxima || c.proxima <= hoje);

  const api = { formas, normalizar, compararFala, nota, INTERVALOS, hojeISO, somarDias, responder, paraRevisar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Treino = api;
})(this);
