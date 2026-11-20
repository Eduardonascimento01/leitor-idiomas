// fala.js: a lógica da leitura que não depende da tela.
// Decide COMO falar em cada velocidade, divide texto em frases e
// escolhe as vozes em inglês. Por não mexer na tela, dá para testar no Node (teste.js).
(function (raiz) {
  'use strict';

  const VELOCIDADES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Abaixo de 1x a voz NÃO é esticada (esticar distorce o som).
  // Cada palavra é falada sozinha numa velocidade clara, e o "devagar" vem das pausas.
  //   taxa: velocidade da voz ao falar a palavra
  //   pausa: silêncio entre uma palavra e outra (ms)
  //   pausaFrase: silêncio entre uma frase e outra (ms)
  function planoDaVelocidade(v) {
    if (v <= 0.25) return { modo: 'palavra', taxa: 0.75, pausa: 1500, pausaFrase: 2500 };
    if (v <= 0.5) return { modo: 'palavra', taxa: 0.8, pausa: 800, pausaFrase: 1600 };
    if (v < 1) return { modo: 'palavra', taxa: 0.9, pausa: 350, pausaFrase: 1000 };
    return { modo: 'corrido', taxa: v, pausa: 0, pausaFrase: Math.round(600 / v) };
  }

  const rotuloVelocidade = v => String(v).replace(/^0\./, '0.') + '×';

  // Palavras de uma frase, do jeito que aparecem (com a pontuação grudada)
  const palavras = frase => frase.match(/\S+/g) || [];

  // Tira a pontuação das pontas: '"Hello,' -> 'Hello'. Mantém o apóstrofo do meio (don't).
  const limpar = p => p.replace(/^[^A-Za-zÀ-ÿ0-9]+|[^A-Za-zÀ-ÿ0-9]+$/g, '');

  // Divide um texto em frases. Frases muito longas são cortadas
  // (em vírgula, se der) para a voz não travar.
  function dividirFrases(texto, max = 25) {
    const limpo = (texto || '').replace(/\s+/g, ' ').trim();
    if (!limpo) return [];
    const brutas = limpo.split(/(?<=[.!?…]["”')\]]*)\s+(?=["“'(\[]?[A-Z0-9À-Ý])/);
    const frases = [];
    for (const f of brutas) {
      const ps = palavras(f);
      if (ps.length <= max) { frases.push(f); continue; }
      let atual = [];
      for (const p of ps) {
        atual.push(p);
        const cortaNaVirgula = /[,;:]$/.test(p) && atual.length >= max * 0.5;
        if (cortaNaVirgula || atual.length >= max) { frases.push(atual.join(' ')); atual = []; }
      }
      if (atual.length) frases.push(atual.join(' '));
    }
    return frases;
  }

  // Texto que vai para a voz + a posição (letra) onde cada palavra começa nele
  function montarFala(ps, ini) {
    const offsets = [];
    let texto = '';
    for (let i = ini; i < ps.length; i++) {
      if (texto) texto += ' ';
      offsets.push(texto.length);
      texto += ps[i];
    }
    return { texto, offsets };
  }

  // A voz avisa "estou na letra N": devolve qual palavra (contando da 1ª da fala) é essa
  function palavraNoChar(offsets, charIndex) {
    let lo = 0, hi = offsets.length - 1, resp = 0;
    while (lo <= hi) {
      const meio = (lo + hi) >> 1;
      if (offsets[meio] <= charIndex) { resp = meio; lo = meio + 1; } else hi = meio - 1;
    }
    return resp;
  }

  // Algumas vozes (ex: Google no Chrome) não avisam qual palavra estão falando.
  // Então estimamos: em 1x, a voz fala umas 14 letras por segundo.
  function temposEstimados(ps, taxa) {
    const porLetra = 1000 / (14 * taxa);
    const tempos = [];
    let t = 0;
    for (const p of ps) { tempos.push(Math.round(t)); t += (p.length + 1) * porLetra; }
    return tempos;
  }

  // Idioma da voz: no Android vem "en_US", no PC "en-US"
  const idioma = v => (v.lang || '').replace('_', '-');
  const ehIngles = v => /^en(-|$)/i.test(idioma(v));

  // Bandeira em emoji não aparece no Windows (vira "US"), então o país vai escrito
  const PAISES = { 'en-US': 'EUA', 'en-GB': 'Reino Unido', 'en-AU': 'Austrália', 'en-CA': 'Canadá', 'en-IE': 'Irlanda', 'en-IN': 'Índia', 'en-NZ': 'Nova Zelândia', 'en-ZA': 'África do Sul' };
  function rotuloVoz(v) {
    const lang = idioma(v);
    const nome = v.name.replace(/^Microsoft /, '').replace(/ - English.*$/, '').replace(/ Online \(Natural\)/, ' (natural)');
    return `${nome} · ${PAISES[lang] || lang}`;
  }

  // Só inglês. Ordem: Google, depois as "Natural" da Microsoft (soam humanas),
  // depois o resto; dentro de cada grupo, americano antes de britânico.
  function ordenarVozes(todas) {
    const grupo = v => (/google/i.test(v.name) ? 0 : /natural/i.test(v.name) ? 1 : 2);
    const pais = v => (idioma(v) === 'en-US' ? 0 : idioma(v) === 'en-GB' ? 1 : 2);
    return todas.filter(ehIngles).sort((a, b) =>
      grupo(a) - grupo(b) || pais(a) - pais(b) || a.name.localeCompare(b.name));
  }

  // Padrões de cada nível: velocidade, mostrar tradução, parar a cada frase
  const PADRAO_NIVEL = {
    1: { velocidade: 0.25, traducao: true, pararCadaFrase: false },
    2: { velocidade: 0.5, traducao: true, pararCadaFrase: true },
    3: { velocidade: 0.75, traducao: true, pararCadaFrase: true },
    4: { velocidade: 1, traducao: false, pararCadaFrase: false },
    5: { velocidade: 1, traducao: false, pararCadaFrase: false },
  };

  const api = { VELOCIDADES, planoDaVelocidade, rotuloVelocidade, palavras, limpar, dividirFrases,
    montarFala, palavraNoChar, temposEstimados, idioma, ehIngles, rotuloVoz, ordenarVozes, PADRAO_NIVEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Fala = api;
})(this);
