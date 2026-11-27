// espanhol.js: ajudas que só o espanhol tem no Leitor de Idiomas.
//  1) ipa(palavra): a pronúncia escrita (ex: "casa" -> /ˈka.sa/), feita por REGRAS.
//     O espanhol se lê como se escreve, então não precisa de dicionário.
//  2) lerWiktionary(textoDaPagina): lê a página do Wiktionary e diz a classe da
//     palavra, o gênero (el/la) e, se for verbo conjugado, o infinitivo
//     (ex: "estás" -> forma do verbo estar).
// Não usa a internet nem a tela: dá para testar no Node (teste.js).
(function (raiz) {
  'use strict';

  // ---------- 1) pronúncia por regras ----------
  const VOGAIS = 'aeiouáéíóúü';
  const FORTES = 'aeoáéíóú';            // í e ú com acento também são "fortes" (quebram o ditongo: dí-a)
  const ehVogal = c => VOGAIS.includes(c);
  // Grupos que ficam juntos na mesma sílaba: "tra-ba-jo", "ha-blar"
  const GRUPOS = ['pr', 'br', 'tr', 'dr', 'cr', 'kr', 'gr', 'fr', 'pl', 'bl', 'cl', 'kl', 'gl', 'fl', 'tl'];

  // Divide a palavra em "letras de som": ch, ll, rr e qu/gu (antes de e/i) contam como uma só
  function unidades(p) {
    const u = [];
    for (let i = 0; i < p.length; i++) {
      const dois = p.slice(i, i + 2), prox = p[i + 2] || '';
      if (dois === 'ch' || dois === 'll' || dois === 'rr') { u.push(dois); i++; continue; }
      if ((dois === 'qu' || dois === 'gu') && 'eiéí'.includes(prox)) { u.push(dois); i++; continue; }
      u.push(p[i]);
    }
    // "y" é vogal no fim da palavra (rey, hoy) ou sozinho (y); senão é consoante (yo, playa)
    return u.map((c, i) => (c === 'y' && (i === u.length - 1 || !ehVogal(u[i + 1] || '')) && i > 0 && ehVogal(u[i - 1] || '')) || (c === 'y' && u.length === 1) ? 'Y' : c);
  }
  const vogalU = c => ehVogal(c) || c === 'Y';

  // Separa em sílabas (regras da escola: 1 consoante vai para a próxima sílaba, grupos ficam juntos)
  function silabas(p) {
    const u = unidades(p);
    // núcleos: blocos de vogais seguidas; duas fortes juntas = sílabas diferentes (le-er, pa-ís)
    const marcas = [];                 // onde começa cada sílaba (índice em u)
    let i = 0;
    const blocos = [];
    while (i < u.length) {
      if (vogalU(u[i])) {
        let j = i;
        while (j + 1 < u.length && vogalU(u[j + 1])) j++;
        // dentro do bloco de vogais, corta entre duas fortes ou forte + í/ú acentuado
        let ini = i;
        for (let k = i + 1; k <= j; k++) {
          const a = u[k - 1], b = u[k];
          if ((FORTES.includes(a) || a === 'Y') && FORTES.includes(b)) { blocos.push([ini, k - 1]); ini = k; }
          else if (FORTES.includes(a) && 'íú'.includes(b)) { blocos.push([ini, k - 1]); ini = k; }
        }
        blocos.push([ini, j]);
        i = j + 1;
      } else i++;
    }
    if (!blocos.length) return [u.join('')];
    marcas.push(0);
    for (let b = 1; b < blocos.length; b++) {
      const fimAnt = blocos[b - 1][1], iniAtual = blocos[b][0];
      const cons = u.slice(fimAnt + 1, iniAtual);          // consoantes entre as duas vogais
      let corte;
      if (cons.length === 0) corte = iniAtual;
      else if (cons.length === 1) corte = iniAtual - 1;
      else {
        const ult2 = cons.slice(-2).join('');
        corte = GRUPOS.includes(ult2) ? iniAtual - 2 : iniAtual - 1;
        if (cons.length >= 4) corte = iniAtual - 2;
      }
      marcas.push(corte);
    }
    return marcas.map((m, k) => u.slice(m, marcas[k + 1]));
  }

  // Sílaba forte: a do acento; sem acento, a penúltima se a palavra acaba em vogal, n ou s; senão a última
  function silabaForte(sils, palavra) {
    const k = sils.findIndex(s => s.some(c => 'áéíóú'.includes(c)));
    if (k >= 0) return k;
    if (sils.length === 1) return 0;
    return /[aeiouns]$/.test(palavra) ? sils.length - 2 : sils.length - 1;
  }

  // Som de cada letra (o jeito "de dicionário", sem os detalhes finos de cada sotaque)
  function somDaSilaba(s, ctx) {
    // núcleo da sílaba: a vogal forte (ou com acento); com duas fracas (iu, ui), a segunda (ciu-dad, muy)
    const posVogais = s.map((x, i) => (vogalU(x) ? i : -1)).filter(i => i >= 0);
    let nucleo = posVogais.find(i => FORTES.includes(s[i]));
    if (nucleo === undefined) nucleo = posVogais[posVogais.length - 1];
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i], prox = s[i + 1] || ctx.proxima || '';
      const semivogal = i !== nucleo;          // i/u que não são o núcleo viram "j"/"w": bien, cuatro
      switch (c) {
        case 'a': case 'á': out += 'a'; break;
        case 'e': case 'é': out += 'e'; break;
        case 'o': case 'ó': out += 'o'; break;
        case 'í': out += 'i'; break;
        case 'ú': out += 'u'; break;
        // i/u fracas ao lado de outra vogal viram "semivogal": bien = /bjen/, cuatro = /kwa/
        case 'i': case 'Y': out += semivogal ? 'j' : 'i'; break;
        case 'u': out += semivogal ? 'w' : 'u'; break;
        case 'ü': out += 'w'; break;
        case 'b': case 'v': out += 'b'; break;
        case 'c': out += 'eiéí'.includes(prox) ? (ctx.espanha ? 'θ' : 's') : 'k'; break;
        case 'z': out += ctx.espanha ? 'θ' : 's'; break;
        case 'ch': out += 'tʃ'; break;
        case 'd': out += 'd'; break;
        case 'f': out += 'f'; break;
        case 'g': out += 'eiéí'.includes(prox) ? 'x' : 'g'; break;
        case 'gu': out += 'g'; break;                       // gue, gui: o "u" não soa
        case 'qu': out += 'k'; break;                       // que, qui
        case 'h': break;                                    // h não soa
        case 'j': out += 'x'; break;
        case 'k': out += 'k'; break;
        case 'l': out += 'l'; break;
        case 'll': case 'y': out += 'ʝ'; break;
        case 'm': out += 'm'; break;
        case 'n': out += 'n'; break;
        case 'ñ': out += 'ɲ'; break;
        case 'p': out += 'p'; break;
        case 'rr': out += 'r'; break;
        // r forte no começo da palavra e depois de l, n, s (honra, alrededor); senão r fraco
        case 'r': out += (ctx.inicioPalavra && i === 0) || (i === 0 && 'lns'.includes(ctx.anterior)) ? 'r' : 'ɾ'; break;
        case 's': out += 's'; break;
        case 't': out += 't'; break;
        case 'w': out += 'w'; break;
        default: out += c;
      }
    }
    return out;
  }

  // ipa("corazón") -> "/ko.ɾa.ˈθon/" (Espanha) ou "/ko.ɾa.ˈson/" (América)
  function ipa(palavra, opcoes) {
    const o = opcoes || {};
    const p = String(palavra || '').toLowerCase().normalize('NFC').replace(/[^a-záéíóúüñ]/g, '');
    if (!p) return '';
    if (p === 'y') return '/i/';
    const sils = silabas(p.replace(/x/g, 'ks'));
    const forte = silabaForte(sils, p);
    const partes = sils.map((s, k) => {
      const ant = k ? sils[k - 1][sils[k - 1].length - 1] : '';
      const som = somDaSilaba(s, { espanha: !!o.espanha, inicioPalavra: k === 0, anterior: ant, proxima: sils[k + 1] ? sils[k + 1][0] : '' });
      return (k === forte && sils.length > 1 ? 'ˈ' : '') + som;
    });
    return '/' + partes.join('.') + '/';
  }

  // ---------- 2) Wiktionary: classe, gênero e infinitivo ----------
  const CLASSES = { 'es-noun': 'substantivo', 'es-proper noun': 'nome próprio', 'es-verb': 'verbo', 'es-adj': 'adjetivo',
    'es-adv': 'advérbio', 'es-pron': 'pronome', 'es-prep': 'preposição', 'es-conj': 'conjunção', 'es-intj': 'interjeição',
    'es-num': 'número', 'es-det': 'determinante', 'es-article': 'artigo', 'es-contraction': 'contração' };
  const GENERO = { m: 'masculino (el)', f: 'feminino (la)', mf: 'masculino ou feminino (el/la)', mfbysense: 'masculino ou feminino (el/la)' };

  // Recebe o texto-fonte da página do Wiktionary em inglês e devolve frases curtas em português
  function lerWiktionary(texto) {
    const t = String(texto || '');
    const m = t.match(/==Spanish==([\s\S]*?)(\n==[^=]|$)/);
    if (!m) return [];
    const sec = m[1];
    const achados = [];
    const por = (s) => { if (!achados.includes(s)) achados.push(s); };
    const re = /\{\{([^{}]+)\}\}/g;
    let r;
    while ((r = re.exec(sec))) {
      const partes = r[1].split('|').map(x => x.trim());
      const nome = partes[0];
      const posicionais = partes.slice(1).filter(x => !x.includes('='));
      if (nome === 'es-verb form of' && posicionais[0]) por('forma do verbo ' + posicionais[0]);
      else if (nome === 'inflection of' && posicionais[0] === 'es' && posicionais[1]) por('forma de ' + posicionais[1]);
      else if (/^(plural|feminine|masculine|feminine plural|masculine plural|feminine singular) of$/.test(nome) && posicionais[0] === 'es' && posicionais[1]) {
        const tipo = { plural: 'plural', feminine: 'feminino', masculine: 'masculino', 'feminine plural': 'feminino plural', 'masculine plural': 'masculino plural', 'feminine singular': 'feminino' }[nome.replace(/ of$/, '')];
        por(tipo + ' de ' + posicionais[1]);
      }
      else if (nome === 'es-noun') {
        const g = GENERO[posicionais[0]];
        por('substantivo' + (g ? ' ' + g : ''));
      }
      else if (nome === 'es-verb') por('verbo (infinitivo)');
      else if (CLASSES[nome]) por(CLASSES[nome]);
    }
    return achados.slice(0, 4);
  }

  const api = { ipa, silabas: p => silabas(p).map(s => s.join('')), lerWiktionary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Espanhol = api;
})(this);
