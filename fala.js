// fala.js: a lógica da leitura que não depende da tela.
// Decide COMO falar em cada velocidade, divide texto em frases e
// escolhe as vozes do idioma (inglês ou espanhol). Por não mexer na tela, dá para testar no Node (teste.js).
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
  // Títulos e abreviações comuns em inglês e espanhol (o ponto delas não acaba a frase).
  // "etc." fica de fora: muitas vezes ele É o fim da frase.
  const ABREVIACAO = /(^|\s)(Mr|Mrs|Ms|Mx|Dr|Dra|Drs|Sr|Sra|Srta|Sres|St|Prof|Profa|Jr|Ud|Uds|Vd|Vds|Lic|Ing|Av|Pág|pág|Núm|núm|No|vs|Fig|fig|aprox)\.$/;
  function dividirFrases(texto, max = 25) {
    const limpo = (texto || '').replace(/\s+/g, ' ').trim();
    if (!limpo) return [];
    // (a frase em espanhol pode começar com ¿ ou ¡)
    const cortes = limpo.split(/(?<=[.!?…]["”')\]]*)\s+(?=["“'(\[¿¡]?[A-Z0-9À-ÝÑ])/);
    // Abreviação não termina frase: "El Sr. García", "Dr. Smith", "J. K. Rowling" ficam juntos
    const brutas = [];
    for (const c of cortes) {
      const ant = brutas[brutas.length - 1];
      if (ant !== undefined && (ABREVIACAO.test(ant) || /(^|\s)[A-ZÁÉÍÓÚÑ]\.$/.test(ant))) brutas[brutas.length - 1] = ant + ' ' + c;
      else brutas.push(c);
    }
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

  // ---------- idiomas ----------
  // Cada idioma tem: o código, o nome, o sotaque padrão e a ordem dos países das vozes.
  const IDIOMAS = {
    en: { codigo: 'en', nome: 'inglês', Nome: 'Inglês', padrao: 'en-US', paises: ['en-US', 'en-GB'],
      teste: 'Hello! How are you today? I hope you are learning a lot.',
      // Entre as Natural, as vozes adultas mais claras vêm antes (a "Ana" é voz de criança)
      preferidas: ['Aria', 'Jenny', 'Guy', 'Ava', 'Andrew', 'Emma', 'Brian', 'Sonia', 'Ryan', 'Libby'] },
    es: { codigo: 'es', nome: 'espanhol', Nome: 'Espanhol', padrao: 'es-ES', paises: ['es-ES', 'es-MX', 'es-US'],
      teste: '¡Hola! ¿Cómo estás hoy? Espero que estés aprendiendo mucho.',
      preferidas: ['Elvira', 'Alvaro', 'Dalia', 'Jorge', 'Ximena', 'Paloma', 'Salome', 'Elena', 'Tomas'] },
  };
  const qualIdioma = cod => IDIOMAS[cod] || IDIOMAS.en;

  // Idioma da voz: no Android vem "en_US", no PC "en-US"
  const idioma = v => (v.lang || '').replace('_', '-');
  const ehDoIdioma = (v, cod) => new RegExp('^' + qualIdioma(cod).codigo + '(-|$)', 'i').test(idioma(v));
  const ehIngles = v => ehDoIdioma(v, 'en');

  // Bandeira em emoji não aparece no Windows (vira "US"), então o país vai escrito
  const PAISES = { 'en-US': 'EUA', 'en-GB': 'Reino Unido', 'en-AU': 'Austrália', 'en-CA': 'Canadá', 'en-IE': 'Irlanda', 'en-IN': 'Índia', 'en-NZ': 'Nova Zelândia', 'en-ZA': 'África do Sul',
    'es-ES': 'Espanha', 'es-MX': 'México', 'es-US': 'EUA', 'es-AR': 'Argentina', 'es-CO': 'Colômbia', 'es-CL': 'Chile', 'es-PE': 'Peru', 'es-VE': 'Venezuela', 'es-UY': 'Uruguai', 'es-CU': 'Cuba', 'es-419': 'América Latina' };
  function rotuloVoz(v) {
    const lang = idioma(v);
    const nome = v.name.replace(/^Microsoft /, '').replace(/ - (English|Spanish).*$/, '').replace(/ Online \(Natural\)/, ' (natural)');
    return `${nome} · ${PAISES[lang] || lang}`;
  }

  // Só vozes do idioma. Ordem: Google, depois as "Natural" da Microsoft (soam humanas),
  // depois o resto; dentro de cada grupo, os países na ordem do idioma (ex: americano antes de britânico).
  function ordenarVozes(todas, cod = 'en') {
    const I = qualIdioma(cod);
    const preferida = v => { const i = I.preferidas.findIndex(n => v.name.includes(n)); return i < 0 ? 99 : i; };
    const grupo = v => (/google/i.test(v.name) ? 0 : /natural/i.test(v.name) ? 1 : 2);
    const pais = v => { const i = I.paises.indexOf(idioma(v)); return i < 0 ? 9 : i; };
    return todas.filter(v => ehDoIdioma(v, cod)).sort((a, b) =>
      grupo(a) - grupo(b) || pais(a) - pais(b) || preferida(a) - preferida(b) || a.name.localeCompare(b.name));
  }

  // Padrões de cada nível: velocidade, mostrar tradução, parar a cada frase
  const PADRAO_NIVEL = {
    1: { velocidade: 0.25, traducao: true, pararCadaFrase: false },
    2: { velocidade: 0.5, traducao: true, pararCadaFrase: true },
    3: { velocidade: 0.75, traducao: true, pararCadaFrase: true },
    4: { velocidade: 1, traducao: false, pararCadaFrase: false },
    5: { velocidade: 1, traducao: false, pararCadaFrase: false },
    6: { velocidade: 0.75, traducao: true, pararCadaFrase: true },   // seus assuntos
  };

  const api = { VELOCIDADES, planoDaVelocidade, rotuloVelocidade, palavras, limpar, dividirFrases,
    montarFala, palavraNoChar, temposEstimados, IDIOMAS, qualIdioma, idioma, ehDoIdioma, ehIngles, rotuloVoz, ordenarVozes, PADRAO_NIVEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Fala = api;
})(this);
