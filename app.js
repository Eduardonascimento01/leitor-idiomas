// app.js: liga a tela, as lições e a voz.
// Fluxo: escolher nível -> escolher lição (ou abrir um livro) -> a lição vira
// uma lista de frases -> a voz lê frase por frase. Abaixo de 1x ela lê palavra
// por palavra, com pausas (ver fala.js).
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  // Ícone de linha do "sprite" que está no index.html
  const ic = nome => `<svg class="ic" aria-hidden="true"><use href="#i-${nome}"/></svg>`;
  const sintese = window.speechSynthesis;
  // Reconhecimento de fala: transforma a sua voz em texto (Chrome e Edge; usa a internet)
  const Reconhecer = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SEM_MICROFONE = 'Este navegador não reconhece fala. Use o Chrome (no PC ou no celular).';

  // ---------- guardar coisas neste navegador ----------
  function ler(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v === null ? padrao : JSON.parse(v); }
    catch { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado: ignora */ }
    // progresso que vai para a nuvem (nuvem.js): avisa que mudou
    if (/:(feitas|caderno|assuntos|apagados|tirados)$/.test(chave)) window.dispatchEvent(new Event('leitor:mudou'));
  }

  // ---------- idioma (inglês ou espanhol) ----------
  // Cada idioma guarda as coisas separadas: o progresso do inglês continua nas chaves "ingles:..."
  // (como sempre foi) e o espanhol usa "espanhol:...". Atalho: #idioma=es no endereço.
  const pedido = (location.hash.match(/idioma=(en|es)/) || [])[1];
  if (pedido) gravar('idiomas:atual', pedido);
  const IDIOMA = ler('idiomas:atual', 'en') === 'es' ? 'es' : 'en';
  const I = Fala.qualIdioma(IDIOMA);
  const P = IDIOMA === 'es' ? 'espanhol' : 'ingles';

  const prefs = Object.assign({ voz: '', velocidade: 0.25, traducao: true, pararCadaFrase: false,
    repitaComigo: false, fonte: 1.35, tema: 'claro', nivel: 1 }, ler(P + ':prefs', {}));
  const salvarPrefs = () => gravar(P + ':prefs', prefs);
  const feitas = ler(P + ':feitas', {});          // { idDaLicao: true }
  let caderno = ler(P + ':caderno', []);          // [{ en, pt, frase, data }]
  const cacheTrad = ler(P + ':traducoes', {});    // { 'en|texto': 'tradução' }
  const cacheIpa = ler(P + ':ipa', {});           // { palavra: '/ipa/' }
  // Obs.: o campo "en" das frases e do caderno quer dizer "texto no idioma estudado" (no espanhol, é o espanhol)

  // ---------- níveis: os 5 do idioma + o nível 6, "Seus assuntos" ----------
  const assuntos = ler(P + ':assuntos', []);      // lições que a IA criou para você
  const BASE = IDIOMA === 'es' ? ConteudoES.NIVEIS : Conteudo.NIVEIS;
  const NIVEL6 = { n: 6, nome: 'Seus assuntos', icone: '✨', licoes: assuntos,
    desc: 'Escolha um assunto e crie uma lição sobre ele, no mesmo jeito das outras.' };
  const NIVEIS = BASE.concat(NIVEL6);
  // O nível 6 já vem aberto (pedido do Eduardo, 2026-11-26: sem trava).
  // Para voltar a trava "só depois dos níveis 1 a 4", troque o true por:
  //   licoesProntas().every(l => feitas[l.id])
  const licoesProntas = () => BASE.flatMap(nv => nv.licoes);
  const liberouAssuntos = () => true;
  function marcarFeita(licao) {
    if (!licao || feitas[licao.id]) return false;
    feitas[licao.id] = true;
    gravar(P + ':feitas', feitas);
    return true;
  }

  // ---------- estado da leitura ----------
  const estado = {
    nivel: null, licao: null,
    frases: [],          // [{ en, pt, emoji, ps: [palavras] }]
    elFrases: [],        // <div class="frase"> de cada frase
    elPalavras: [],      // [frase][palavra] -> <span>
    s: 0, w: 0,          // frase e palavra atuais
    lendo: false,
    geracao: 0,          // cada leitura nova ganha um número; as antigas param sozinhas
    timers: [],
    livro: null,         // nível 5: { nome, paginas: [[frases]], pagina }
  };

  // ---------- telas ----------
  const telas = ['telaNiveis', 'telaLicoes', 'telaLeitura', 'telaCaderno', 'telaRevisao'];
  let telaAnterior = 'telaNiveis';
  function mostrar(id) {
    const atual = telas.find(t => !$(t).hidden);
    if (id === 'telaCaderno' && atual !== 'telaCaderno' && atual !== 'telaRevisao') telaAnterior = atual;
    if (id !== 'telaLeitura') parar();
    telas.forEach(t => { $(t).hidden = t !== id; });
    window.scrollTo(0, 0);
  }

  // ---------- tema e letra ----------
  function aplicarVisual() {
    document.documentElement.dataset.tema = prefs.tema;
    // a barra de cima do celular fica da cor do topo do app (claro ou escuro)
    const barra = document.getElementById('corBarra');
    if (barra) barra.content = prefs.tema === 'escuro' ? '#1e232b' : '#ffffff';
    $('tema').innerHTML = `<span class="emoji-btn" aria-hidden="true">${prefs.tema === 'escuro' ? '☀️' : '🌙'}</span>`;
    document.documentElement.style.setProperty('--fonte-leitura', prefs.fonte + 'rem');
  }
  $('tema').onclick = () => { prefs.tema = prefs.tema === 'escuro' ? 'claro' : 'escuro'; aplicarVisual(); salvarPrefs(); };
  $('fonteMais').onclick = () => { prefs.fonte = Math.min(2.2, +(prefs.fonte + 0.1).toFixed(2)); aplicarVisual(); salvarPrefs(); };
  $('fonteMenos').onclick = () => { prefs.fonte = Math.max(0.9, +(prefs.fonte - 0.1).toFixed(2)); aplicarVisual(); salvarPrefs(); };

  const status = msg => { $('status').textContent = msg || ''; };

  // ---------- vozes do idioma ----------
  let vozes = [];
  const SEM_VOZ = `Não achei voz em ${I.nome} neste navegador. No PC, use o Chrome ou o Edge; no celular, instale a voz em ${I.nome} nas configurações de texto para fala.`;
  function carregarVozes() {
    if (!sintese) return;
    const lista = Fala.ordenarVozes(sintese.getVoices(), IDIOMA);
    if (!lista.length) return;
    vozes = lista;
    const sel = $('voz');
    sel.innerHTML = '';
    for (const v of vozes) {
      const op = document.createElement('option');
      op.value = v.name;
      op.textContent = Fala.rotuloVoz(v);
      sel.appendChild(op);
    }
    sel.value = (vozes.find(v => v.name === prefs.voz) || vozes[0]).name;
  }
  const vozAtual = () => vozes.find(v => v.name === $('voz').value) || vozes[0] || null;
  // O microfone entende melhor no mesmo sotaque da voz escolhida (ex: es-MX)
  const langDaVoz = () => { const v = vozAtual(); return v ? Fala.idioma(v) : I.padrao; };
  if (sintese) {
    carregarVozes();
    sintese.addEventListener('voiceschanged', carregarVozes);
    setTimeout(() => {
      if (!vozes.length) status(SEM_VOZ);
    }, 2500);
  }
  $('voz').onchange = () => { prefs.voz = $('voz').value; salvarPrefs(); reiniciarSeLendo(); };
  $('testarVoz').onclick = () => { parar(); falar(I.teste, 1); };

  // Fala um texto e espera terminar. Devolve false se deu erro ou foi cancelado.
  // VIGIA (conserto de 2026-11-26): às vezes o navegador "engole" uma fala e nunca avisa
  // que terminou (onend). Antes, a leitura ficava parada para sempre e a lição não era salva.
  // Agora, se a fala passar muito do tempo esperado, seguimos em frente sozinhos.
  function falar(texto, taxa, aoComecar, aoLimite) {
    return new Promise(resolve => {
      if (!sintese) { resolve(false); return; }
      const u = new SpeechSynthesisUtterance(texto);
      const v = vozAtual();
      if (v) { u.voice = v; u.lang = Fala.idioma(v); } else u.lang = I.padrao;
      u.rate = taxa;
      let acabou = false, prorrogou = 0, vigia = null;
      const fim = ok => { if (acabou) return; acabou = true; clearTimeout(vigia); resolve(ok); };
      // tempo esperado com folga: ~70 ms por letra em 1x; damos mais que o dobro + 4 s
      const limite = 4000 + (texto.length * 160) / Math.max(taxa, 0.3);
      const vigiar = () => {
        vigia = setTimeout(() => {
          // ainda falando de verdade (voz lenta)? espera mais um pouco, no máximo 2 vezes
          if (sintese.speaking && falar.ultima === u && prorrogou < 2) { prorrogou++; vigiar(); return; }
          fim(true);
        }, limite);
      };
      u.onstart = () => aoComecar && aoComecar();
      u.onboundary = e => aoLimite && aoLimite(e);
      u.onend = () => fim(true);
      u.onerror = () => fim(false);
      falar.ultima = u;            // guarda a fala: o Chrome às vezes "esquece" falas sem referência
      sintese.speak(u);
      vigiar();
    });
  }
  const esperar = ms => new Promise(r => { estado.timers.push(setTimeout(r, ms)); });
  function limparTimers() { estado.timers.forEach(clearTimeout); estado.timers = []; }

  // ---------- velocidade ----------
  // Velocidade numa BARRA: cada uma das 8 velocidades é uma "parada" da barra.
  // Arrastando, o valor e a explicação mudam na hora; ao soltar, a leitura continua na nova velocidade.
  function montarVelocidades() {
    const box = $('velocidades');
    const V = Fala.VELOCIDADES;
    box.innerHTML = `<div class="vel-linha"><span class="vel-rotulo">Velocidade</span>
      <div class="vel-trilho"><input id="velBarra" type="range" min="0" max="${V.length - 1}" step="1" aria-label="Velocidade">
      <div class="vel-marcas">${V.map((v, i) => `<button type="button" data-i="${i}" style="left:calc(${i / (V.length - 1)} * (100% - 18px) + 9px)">${Fala.rotuloVelocidade(v)}</button>`).join('')}</div></div>
      <strong id="velValor"></strong></div>`;
    const barra = $('velBarra');
    const usar = (i, aplicar) => {
      prefs.velocidade = V[i];
      marcarVelocidade();
      if (aplicar) { salvarPrefs(); reiniciarSeLendo(); }
    };
    barra.oninput = () => usar(+barra.value, false);
    barra.onchange = () => usar(+barra.value, true);
    box.querySelectorAll('.vel-marcas button').forEach(b => { b.onclick = () => usar(+b.dataset.i, true); });
    marcarVelocidade();
  }
  function marcarVelocidade() {
    const V = Fala.VELOCIDADES;
    const i = Math.max(0, V.indexOf(prefs.velocidade));
    const barra = $('velBarra');
    barra.value = i;
    barra.style.setProperty('--p', (i / (V.length - 1)) * 100 + '%');   // parte pintada de azul
    barra.setAttribute('aria-valuetext', Fala.rotuloVelocidade(V[i]));
    $('velValor').textContent = Fala.rotuloVelocidade(V[i]);
    $('velocidades').querySelectorAll('.vel-marcas button').forEach(b => b.classList.toggle('ativa', +b.dataset.i === i));
    const p = Fala.planoDaVelocidade(prefs.velocidade);
    $('explicaVel').textContent = p.modo === 'palavra'
      ? `Palavra por palavra, com ${(p.pausa / 1000).toFixed(1).replace('.', ',')} s de pausa entre elas`
      : prefs.velocidade === 1 ? 'Frase corrida, na velocidade de um nativo' : 'Frase corrida, mais rápida que o normal';
  }

  // ---------- opções ----------
  $('optTraducao').onchange = () => { prefs.traducao = $('optTraducao').checked; salvarPrefs(); aplicarTraducao(); };
  $('optParar').onchange = () => { prefs.pararCadaFrase = $('optParar').checked; salvarPrefs(); };
  $('optRepita').onchange = () => {
    prefs.repitaComigo = $('optRepita').checked; salvarPrefs();
    if (prefs.repitaComigo && !Reconhecer) { status(SEM_MICROFONE); }
  };
  function aplicarTraducao() {
    $('texto').classList.toggle('sem-traducao', !prefs.traducao);
    if (prefs.traducao && estado.nivel === 5) estado.frases.forEach((f, i) => traduzirFrase(i));
  }
  function aplicarPadraoDoNivel(n) {
    if (prefs.nivel === n) return;   // já estava neste nível: mantém o que você ajustou
    Object.assign(prefs, Fala.PADRAO_NIVEL[n], { nivel: n });
    salvarPrefs();
  }

  // ---------- tela de níveis ----------
  function progressoDoNivel(nivel) {
    const total = nivel.licoes.length;
    const ok = nivel.licoes.filter(l => feitas[l.id]).length;
    return { total, ok };
  }
  // Qual lição o botão "Continuar" abre: a última que você abriu (se não terminou),
  // senão a primeira lição ainda não feita, na ordem dos níveis.
  function proximaLicao() {
    const ultima = ler(P + ':ultima', null);
    for (const nv of NIVEIS) {
      const l = nv.licoes.find(x => ultima && x.id === ultima && !feitas[x.id]);
      if (l) return { nivel: nv, licao: l };
    }
    for (const nv of NIVEIS) {
      const l = nv.licoes.find(x => !feitas[x.id]);
      if (l) return { nivel: nv, licao: l };
    }
    return null;
  }
  function montarNiveis() {
    const alvo = proximaLicao();
    const cont = $('continuar');
    cont.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'continuar';
    if (alvo) {
      const comecou = Object.keys(feitas).length || ler(P + ':ultima', null);
      b.innerHTML = `<div><small>${comecou ? 'Continuar' : 'Começar'} · Nível ${alvo.nivel.n}</small><strong></strong></div>${ic('arrow')}`;
      b.querySelector('strong').textContent = alvo.licao.titulo;
      b.onclick = () => abrirLicao(alvo.nivel, alvo.licao);
    } else {
      b.innerHTML = `<div><small>Todas as lições feitas</small><strong>Criar uma lição sobre um assunto</strong></div>${ic('arrow')}`;
      b.onclick = () => abrirNivel(6);
    }
    cont.appendChild(b);

    const atual = alvo ? alvo.nivel.n : 6;
    const prontas = licoesProntas();
    const prontasFeitas = prontas.filter(l => feitas[l.id]).length;
    const box = $('listaNiveis');
    box.innerHTML = '';
    for (const nivel of NIVEIS) {
      const { total, ok } = progressoDoNivel(nivel);
      const completo = total && ok === total;
      const trancado = nivel.n === 6 && !liberouAssuntos();
      let conta = total ? `${ok} de ${total} ${total === 1 ? 'lição' : 'lições'}` : 'Seu PDF, .txt ou texto colado';
      if (nivel.n === 6) {
        conta = trancado ? `Libera quando terminar os níveis 1 a 4 (${prontasFeitas} de ${prontas.length} lições)`
          : total ? `${ok} de ${total} ${total === 1 ? 'lição criada' : 'lições criadas'} por você` : 'Crie a sua primeira lição';
      }
      const li = document.createElement('li');
      const p = document.createElement('button');
      p.type = 'button';
      p.className = 'passo' + (nivel.n === atual ? ' atual' : completo ? ' completo' : '') + (trancado ? ' trancado' : '');
      p.innerHTML = `<span class="num">${trancado ? '🔒' : nivel.n}</span><div class="txt"><strong></strong><span></span>
        <span class="conta"></span>
        ${total ? `<div class="barra"><i style="width:${(ok / total) * 100}%"></i></div>` : ''}</div>`;
      p.dataset.n = nivel.n;
      p.querySelector('strong').textContent = nivel.nome;
      if (nivel.n === atual) p.querySelector('strong').insertAdjacentHTML('beforeend', '<span class="agora">você está aqui</span>');
      p.querySelector('.txt > span').textContent = nivel.desc;
      p.querySelector('.conta').textContent = conta;
      p.onclick = () => abrirNivel(nivel.n);
      li.appendChild(p);
      box.appendChild(li);
    }
  }

  // ---------- tela de lições ----------
  function cartaoDeLicao(nivel, licao, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cartao-licao' + (feitas[licao.id] ? ' feita' : '');
    const qtd = `${licao.frases.length} ${nivel.n === 1 ? 'palavras' : 'frases'}`;
    const tipo = licao.tipo && Assunto.TIPOS[licao.tipo] ? ' · ' + Assunto.TIPOS[licao.tipo].nome : '';
    b.innerHTML = `<span class="n">${i + 1}</span><div><strong></strong><span></span></div>
      ${feitas[licao.id] ? `<span class="check" title="Feita">${ic('check')}</span>` : ''}`;
    // textContent (e não innerHTML): o título da lição criada vem da IA, então não pode virar código na página
    b.querySelector('strong').textContent = licao.titulo;
    b.querySelector('div span').textContent = qtd + tipo;
    b.onclick = () => abrirLicao(nivel, licao);
    return b;
  }
  function abrirNivel(n) {
    const nivel = NIVEIS.find(x => x.n === n);
    estado.nivel = n;
    $('tituloNivel').textContent = `Nível ${n} · ${nivel.nome}`;
    $('descNivel').textContent = nivel.desc;
    const box = $('listaLicoes');
    box.innerHTML = '';
    const { total, ok } = progressoDoNivel(nivel);
    if (total && ok === total && n < 5) {
      const s = document.createElement('p');
      s.className = 'sugestao';
      s.style.gridColumn = '1 / -1';
      s.textContent = n === 4
        ? 'Você terminou todas as lições prontas. No nível 6, crie lições sobre o assunto que quiser.'
        : `Você terminou todas as lições deste nível. Pode repetir para fixar ou subir para o nível ${n + 1}.`;
      box.appendChild(s);
    }
    nivel.licoes.forEach((licao, i) => {
      if (n !== 6) { box.appendChild(cartaoDeLicao(nivel, licao, i)); return; }
      // nível 6: cada lição criada tem um botão para apagar
      const linha = document.createElement('div');
      linha.className = 'cartao-assunto';
      const tirar = document.createElement('button');
      tirar.type = 'button'; tirar.className = 'botao icone'; tirar.innerHTML = ic('trash');
      tirar.setAttribute('aria-label', 'Apagar a lição ' + licao.titulo);
      tirar.onclick = () => {
        if (!confirm(`Apagar a lição "${licao.titulo}"?`)) return;
        assuntos.splice(assuntos.indexOf(licao), 1);
        delete feitas[licao.id];
        // lista de apagados: para o outro aparelho não trazer a lição de volta (sincronia.js)
        gravar(P + ':apagados', ler(P + ':apagados', []).concat(licao.id));
        gravar(P + ':assuntos', assuntos);
        gravar(P + ':feitas', feitas);
        abrirNivel(6);
      };
      linha.append(cartaoDeLicao(nivel, licao, i), tirar);
      box.appendChild(linha);
    });
    $('livro').hidden = n !== 5;
    $('statusLivro').textContent = '';
    $('assunto').hidden = n !== 6;
    if (n === 6) {
      const liberou = liberouAssuntos();
      const prontas = licoesProntas();
      $('assuntoTrava').hidden = liberou;
      $('assuntoForm').hidden = !liberou;
      $('assuntoTrava').textContent = `Termine as lições dos níveis 1 a 4 para liberar. Faltam ${prontas.filter(l => !feitas[l.id]).length} de ${prontas.length}.`;
      $('statusAssunto').textContent = '';
    }
    mostrar('telaLicoes');
  }

  // ---------- leitura ----------
  function prepararLeitura(nivel, titulo) {
    aplicarPadraoDoNivel(nivel.n);
    $('optTraducao').checked = prefs.traducao;
    $('optParar').checked = prefs.pararCadaFrase;
    $('optRepita').checked = prefs.repitaComigo;
    marcarVelocidade();
    $('tituloLicao').textContent = titulo;
    status(nivel.n === 1 ? 'Aperte o play para ouvir. Toque numa palavra para ver os detalhes.'
      : 'Aperte o play para ouvir. Toque numa palavra para ver a tradução e salvar no caderno.');
  }

  function abrirLicao(nivel, licao) {
    estado.nivel = nivel.n;
    estado.licao = licao;
    estado.primeiraVez = !feitas[licao.id];
    estado.livro = null;
    gravar(P + ':ultima', licao.id);     // para o botão "Continuar" da tela inicial
    prepararLeitura(nivel, licao.titulo);
    usarFrases(licao.frases.map(([en, pt, emoji]) => ({ en, pt, emoji })), nivel.n === 1);
    $('paginacao').hidden = true;
    mostrar('telaLeitura');
  }

  function usarFrases(lista, cartoes) {
    estado.frases = lista.map(f => Object.assign({ ps: Fala.palavras(f.en) }, f));
    estado.s = 0; estado.w = 0;
    estado.ouvidas = new Set();
    desenharFrases(cartoes);
  }

  function desenharFrases(cartoes) {
    const box = $('texto');
    box.innerHTML = '';
    box.classList.toggle('cartoes', !!cartoes);
    aplicarTraducao();
    estado.elFrases = [];
    estado.elPalavras = [];
    estado.frases.forEach((f, si) => {
      const div = document.createElement('div');
      div.className = 'frase';
      if (f.emoji) {
        const e = document.createElement('div');
        e.className = 'emoji';
        e.textContent = f.emoji;
        e.setAttribute('aria-hidden', 'true');
        div.appendChild(e);
      }
      const en = document.createElement('p');
      en.className = 'en';
      en.lang = IDIOMA;
      const spans = f.ps.map((p, wi) => {
        const sp = document.createElement('span');
        sp.className = 'pal';
        sp.textContent = p;
        if (!f.emoji) sp.onclick = () => abrirPalavra(si, wi);
        if (wi) en.appendChild(document.createTextNode(' '));
        en.appendChild(sp);
        return sp;
      });
      div.appendChild(en);
      const pt = document.createElement('p');
      pt.className = 'pt';
      pt.textContent = f.pt || '';
      div.appendChild(pt);
      const ver = document.createElement('button');
      ver.type = 'button';
      ver.className = 'ver-pt';
      ver.textContent = 'PT';
      ver.title = 'Ver a tradução desta frase';
      ver.setAttribute('aria-label', 'Ver a tradução desta frase');
      ver.onclick = () => { div.classList.toggle('revelada'); if (!f.pt) traduzirFrase(si); };
      div.appendChild(ver);
      if (f.emoji) { div.onclick = () => abrirPalavra(si, 0); div.style.cursor = 'pointer'; }
      box.appendChild(div);
      estado.elFrases.push(div);
      estado.elPalavras.push(spans);
    });
    marcar(-1, -1);
  }

  // Conserto de 2026-11-26: a lição conta como feita quando você OUVIU todas as frases,
  // por qualquer caminho (play, Repetir, frase a frase, tocando nos cartões do nível 1).
  // Antes, só contava se a leitura chegasse sem tropeço até o fim da última frase.
  function ouviu(s) {
    if (!estado.ouvidas || !estado.licao) return;
    estado.ouvidas.add(s);
    if (estado.ouvidas.size >= estado.frases.length) marcarFeita(estado.licao);
  }

  // Pinta a frase e a palavra atuais
  let marcadaFrase = -1, marcadaPalavra = null;
  function marcar(s, w) {
    if (marcadaPalavra) marcadaPalavra.classList.remove('lendo');
    if (marcadaFrase !== s && estado.elFrases[marcadaFrase]) estado.elFrases[marcadaFrase].classList.remove('atual');
    marcadaPalavra = null;
    if (s < 0 || !estado.elFrases[s]) { marcadaFrase = -1; return; }
    estado.elFrases[s].classList.add('atual');
    if (marcadaFrase !== s) seguirNaTela(estado.elFrases[s]);
    marcadaFrase = s;
    const sp = w >= 0 && estado.elPalavras[s][w];
    if (sp) { sp.classList.add('lendo'); marcadaPalavra = sp; }
  }
  function seguirNaTela(el) {
    const r = el.getBoundingClientRect();
    const topoLivre = $('telaLeitura').querySelector('.controles').getBoundingClientRect().bottom + 8;
    if (r.top < topoLivre || r.bottom > window.innerHeight - 20) {
      window.scrollBy({ top: r.top - topoLivre - 40, behavior: 'smooth' });
    }
  }

  // Lê uma frase a partir da palavra w. Devolve false se foi interrompida.
  async function lerFrase(s, w, g) {
    const f = estado.frases[s];
    const plano = Fala.planoDaVelocidade(prefs.velocidade);
    if (plano.modo === 'palavra') {
      for (let i = w; i < f.ps.length; i++) {
        estado.s = s; estado.w = i;
        marcar(s, i);
        const limpa = Fala.limpar(f.ps[i]) || f.ps[i];
        await falar(limpa, plano.taxa);
        if (g !== estado.geracao) return false;
        if (i < f.ps.length - 1) { await esperar(plano.pausa); if (g !== estado.geracao) return false; }
      }
      return true;
    }
    // Frase corrida: a voz avisa a palavra (onboundary). Se a voz não avisar
    // (Google no Chrome), estimamos o tempo de cada palavra.
    const { texto, offsets } = Fala.montarFala(f.ps, w);
    let avisou = false;
    estado.s = s; estado.w = w;
    marcar(s, w);
    const aoComecar = () => {
      const tempos = Fala.temposEstimados(f.ps.slice(w), plano.taxa);
      tempos.forEach((t, k) => estado.timers.push(setTimeout(() => {
        if (!avisou && g === estado.geracao) { estado.w = w + k; marcar(s, w + k); }
      }, t)));
    };
    const aoLimite = e => {
      if (e.name && e.name !== 'word') return;
      if (!avisou) { avisou = true; limparTimers(); }
      if (g !== estado.geracao) return;
      estado.w = w + Fala.palavraNoChar(offsets, e.charIndex);
      marcar(s, estado.w);
    };
    await falar(texto, plano.taxa, aoComecar, aoLimite);
    limparTimers();
    return g === estado.geracao;
  }

  // Começa a ler na frase s, palavra w. "soUma": lê só esta frase e para.
  async function tocarDe(s, w, soUma) {
    if (!estado.frases.length) return;
    if (!vozes.length) status(SEM_VOZ);
    const g = ++estado.geracao;
    limparTimers();
    if (sintese) sintese.cancel();
    estado.lendo = true;
    botaoTocar();
    await esperar(80);                  // o Chrome às vezes perde a fala pedida logo depois do cancel()
    if (g !== estado.geracao) return;
    while (s < estado.frases.length) {
      const ok = await lerFrase(s, w, g);
      if (!ok || g !== estado.geracao) return;
      ouviu(s);
      w = 0;
      estado.ultimaLida = s;
      // Repita comigo: depois de ouvir, é a sua vez de falar a frase
      if (prefs.repitaComigo && Reconhecer) {
        marcar(s, -1);
        await praticarFrase(s, g);
        if (g !== estado.geracao) return;
      }
      const ultima = s === estado.frases.length - 1;
      if (soUma || prefs.pararCadaFrase || ultima) {
        estado.lendo = false;
        botaoTocar();
        marcar(s, -1);
        estado.ultimaLida = s;
        if (ultima) { terminou(); estado.s = 0; estado.w = 0; return; }
        estado.s = s + 1; estado.w = 0;
        if (!soUma) status('Frase terminada. O play vai para a próxima; Repetir repete esta.');
        return;
      }
      await esperar(Fala.planoDaVelocidade(prefs.velocidade).pausaFrase);
      if (g !== estado.geracao) return;
      s++;
    }
  }

  function parar() {
    estado.geracao++;
    limparTimers();
    pararMicrofone();
    if (sintese) sintese.cancel();
    estado.lendo = false;
    botaoTocar();
  }
  function reiniciarSeLendo() { if (estado.lendo) tocarDe(estado.s, estado.w); }
  function botaoTocar() {
    $('tocar').innerHTML = ic(estado.lendo ? 'pause' : 'play');
    $('tocar').setAttribute('aria-label', estado.lendo ? 'Pausar' : 'Ler');
  }

  function terminou() {
    status('');
    if (estado.livro) { status('Fim da página. Use "Página" para continuar.'); return; }
    if (!estado.licao) return;
    marcarFeita(estado.licao);
    const primeiraVez = estado.primeiraVez;   // guardado ao abrir: ouviu() pode ter marcado antes
    const nivel = NIVEIS.find(x => x.n === estado.nivel);
    const idx = nivel.licoes.indexOf(estado.licao);
    const proxima = nivel.licoes[idx + 1];
    const fim = document.createElement('div');
    fim.className = 'fim';
    const qtd = estado.licao.frases.length;
    fim.innerHTML = `<strong>Lição concluída</strong><br>${qtd} ${estado.nivel === 1 ? 'palavras' : 'frases'}. ${primeiraVez ? 'Ouça de novo amanhã, repetindo em voz alta.' : 'Repetir é o que fixa.'}<br>`;
    const de = document.createElement('button');
    de.className = 'botao'; de.type = 'button'; de.innerHTML = ic('repeat') + ' Ouvir de novo';
    de.onclick = () => { fim.remove(); tocarDe(0, 0); };
    fim.appendChild(de);
    if (proxima) {
      const px = document.createElement('button');
      px.className = 'botao principal'; px.type = 'button'; px.textContent = `Próxima: ${proxima.titulo}`;
      px.insertAdjacentHTML('beforeend', ic('arrow'));
      px.onclick = () => abrirLicao(nivel, proxima);
      fim.appendChild(px);
    } else {
      const vl = document.createElement('button');
      vl.className = 'botao principal'; vl.type = 'button'; vl.textContent = 'Voltar às lições';
      vl.onclick = () => abrirNivel(estado.nivel);
      fim.appendChild(vl);
    }
    if (estado.nivel === 1) {
      const novas = estado.licao.frases.filter(([en]) => !noCaderno(en));
      if (novas.length) {
        const cd = document.createElement('button');
        cd.className = 'botao'; cd.type = 'button';
        cd.innerHTML = `${ic('bookmark')} ${novas.length === 1 ? 'Pôr a palavra' : `Pôr as ${novas.length} palavras`} no caderno`;
        cd.onclick = () => {
          for (const [en, pt] of novas) if (!noCaderno(en)) caderno.push({ en, pt, frase: '', data: Treino.hojeISO() });
          salvarCaderno();
          cd.disabled = true; cd.innerHTML = `${ic('check')} No caderno. Já dá para revisar.`;
        };
        fim.appendChild(cd);
      }
    }
    $('texto').appendChild(fim);
    fim.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- microfone: repita comigo ----------
  let reconhecedor = null;
  function pararMicrofone() {
    if (reconhecedor) { try { reconhecedor.abort(); } catch { /* já parou */ } reconhecedor = null; }
    document.querySelectorAll('.microfone.ouvindo').forEach(b => b.classList.remove('ouvindo'));
  }
  // Abre o microfone e devolve { frases: [o que entendeu, alternativas...] } ou { erro }
  function ouvirVoce(botao) {
    return new Promise(resolve => {
      if (!Reconhecer) { resolve({ erro: SEM_MICROFONE }); return; }
      pararMicrofone();
      if (sintese) sintese.cancel();
      const r = new Reconhecer();
      reconhecedor = r;
      r.lang = langDaVoz();
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.continuous = false;
      let frases = [], erro = null;
      r.onresult = e => { frases = Array.from(e.results[0] || []).map(a => a.transcript); };
      r.onerror = e => {
        erro = e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'O navegador não deixou usar o microfone. Clique no cadeado ao lado do endereço e permita o microfone.'
          : e.error === 'no-speech' ? 'Não ouvi nada. Aperte Falar e fale logo depois.'
          : e.error === 'network' ? 'O reconhecimento de fala precisa de internet.'
          : e.error === 'aborted' ? null : 'O microfone deu erro (' + e.error + ').';
      };
      r.onend = () => {
        if (reconhecedor === r) reconhecedor = null;
        if (botao) botao.classList.remove('ouvindo');
        resolve(erro ? { erro } : { frases });
      };
      if (botao) botao.classList.add('ouvindo');
      const tempo = setTimeout(() => { try { r.stop(); } catch { /* ok */ } }, 15000);
      r.addEventListener('end', () => clearTimeout(tempo));
      try { r.start(); } catch { if (botao) botao.classList.remove('ouvindo'); resolve({ erro: 'Não consegui abrir o microfone.' }); }
    });
  }
  // Das alternativas que o reconhecimento achou, fica a que mais acertou
  function melhorResultado(palavrasDaTela, frases) {
    let melhor = { certos: palavrasDaTela.map(() => false), ouvido: '' };
    for (const f of frases) {
      const c = Treino.compararFala(palavrasDaTela, f, IDIOMA);
      if (c.filter(Boolean).length > melhor.certos.filter(Boolean).length || !melhor.ouvido) melhor = { certos: c, ouvido: f };
    }
    return melhor;
  }
  // Você fala a frase s; as palavras ficam verdes (certas) ou vermelhas (treinar)
  async function praticarFrase(s, g) {
    const f = estado.frases[s];
    if (!f) return;
    const spans = estado.elPalavras[s];
    spans.forEach(sp => sp.classList.remove('certa', 'errada'));
    estado.elFrases[s].classList.add('atual');
    status(`Sua vez: fale a frase em ${I.nome}.`);
    const r = await ouvirVoce($('falarEu'));
    if (g !== undefined && g !== estado.geracao) return;
    if (r.erro) { status(r.erro); return; }
    const { certos, ouvido } = melhorResultado(f.ps, r.frases);
    certos.forEach((ok, i) => spans[i].classList.add(ok ? 'certa' : 'errada'));
    const n = Treino.nota(certos);
    status(`${n.ok} de ${n.total} ${n.total === 1 ? 'palavra certa' : 'palavras certas'}. ${n.msg} Entendi: "${ouvido || '...'}"`);
    if (g !== undefined) await esperar(1800);   // dá tempo de ver o resultado antes de seguir
  }
  $('falarEu').onclick = () => {
    if ($('falarEu').classList.contains('ouvindo')) { pararMicrofone(); return; }
    const s = Math.min(estado.ultimaLida ?? estado.s, estado.frases.length - 1);
    parar();
    marcar(s, -1);
    praticarFrase(s);
  };

  // ---------- botões da leitura ----------
  $('tocar').onclick = () => { if (estado.lendo) parar(); else tocarDe(estado.s, estado.w); };
  $('repetir').onclick = () => {
    const s = estado.lendo ? estado.s : (estado.ultimaLida ?? estado.s);
    tocarDe(Math.min(s, estado.frases.length - 1), 0, true);
  };
  function irPara(s) {
    s = Math.max(0, Math.min(estado.frases.length - 1, s));
    const lendo = estado.lendo;
    parar();
    estado.s = s; estado.w = 0; estado.ultimaLida = s;
    marcar(s, -1);
    if (lendo) tocarDe(s, 0);
  }
  // Conserto de 2026-11-26: com "Parar depois de cada frase", o app já deixa estado.s
  // apontando para a PRÓXIMA frase (para o play continuar). Somar +1 de novo pulava duas.
  // Agora a conta parte da frase que está pintada na tela.
  const fraseNaTela = () => (marcadaFrase >= 0 ? marcadaFrase : estado.s);
  $('fraseAnt').onclick = () => irPara(fraseNaTela() - 1);
  $('fraseProx').onclick = () => irPara(fraseNaTela() + 1);

  document.addEventListener('keydown', e => {
    if ($('telaLeitura').hidden || $('janela').open) return;
    if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.target.tagName) && e.key === ' ') return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === ' ') { e.preventDefault(); $('tocar').click(); }
    else if (e.key === 'ArrowRight') $('fraseProx').click();
    else if (e.key === 'ArrowLeft') $('fraseAnt').click();
    else if (e.key === 'r' || e.key === 'R') $('repetir').click();
    else if (e.key === 'm' || e.key === 'M') $('falarEu').click();
  });

  // ---------- tradução e pronúncia (internet) ----------
  // MyMemory: tradução grátis, sem cadastro. Free Dictionary: pronúncia (IPA).
  async function traduzir(texto) {
    const chave = IDIOMA + '|' + texto.toLowerCase();
    if (cacheTrad[chave]) return cacheTrad[chave];
    const url = 'https://api.mymemory.translated.net/get?langpair=' + IDIOMA + '|pt-BR&q=' + encodeURIComponent(texto.slice(0, 480));
    const r = await fetch(url);
    if (!r.ok) throw new Error('falhou');
    const j = await r.json();
    const t = j && j.responseData && j.responseData.translatedText;
    if (!t || /MYMEMORY WARNING|QUERY LENGTH/i.test(t)) throw new Error('limite');
    cacheTrad[chave] = t;
    gravar(P + ':traducoes', cacheTrad);
    return t;
  }
  async function pronuncia(palavra) {
    if (IDIOMA !== 'en') return '';     // o dicionário grátis só tem inglês (o espanhol se lê como se escreve)
    const p = palavra.toLowerCase();
    if (p in cacheIpa) return cacheIpa[p];
    let ipa = '';
    try {
      const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(p));
      if (r.ok) {
        const j = await r.json();
        const fon = (j[0] && (j[0].phonetic || (j[0].phonetics || []).map(x => x.text).find(Boolean))) || '';
        ipa = fon;
      }
    } catch { return ''; }
    cacheIpa[p] = ipa;
    gravar(P + ':ipa', cacheIpa);
    return ipa;
  }
  async function traduzirFrase(si) {
    const f = estado.frases[si];
    if (!f || f.pt || f.traduzindo) return;
    const pt = estado.elFrases[si].querySelector('.pt');
    f.traduzindo = true;
    pt.textContent = 'Traduzindo...';
    try { f.pt = await traduzir(f.en); pt.textContent = f.pt; }
    catch { pt.textContent = 'Não consegui traduzir agora (sem internet ou limite do dia).'; }
    f.traduzindo = false;
  }

  // ---------- janela da palavra ----------
  let palavraAberta = null;
  async function abrirPalavra(si, wi) {
    parar();
    estado.s = si; estado.w = wi;
    marcar(si, wi);
    const f = estado.frases[si];
    // No nível 1 o "cartão" inteiro é a palavra (ex: "good morning")
    const en = f.emoji ? f.en : (Fala.limpar(f.ps[wi]) || f.ps[wi]);
    palavraAberta = { en, frase: f.en, si, wi };
    $('jPalavra').textContent = en;
    $('jIpa').textContent = '';
    $('jResultado').textContent = '';
    $('jTraducao').textContent = f.emoji ? f.pt : 'Buscando...';
    atualizarBotaoSalvar();
    $('jLerDaqui').hidden = !!f.emoji;
    $('janela').showModal();
    falar(en, 0.85).then(ok => { if (ok && f.emoji) ouviu(si); });   // nível 1: ouvir o cartão conta
    pronuncia(en).then(ipa => { if (palavraAberta && palavraAberta.en === en) $('jIpa').textContent = ipa ? `Pronúncia: ${ipa}` : ''; });
    if (!f.emoji) {
      try {
        const t = await traduzir(en);
        if (palavraAberta && palavraAberta.en === en) { $('jTraducao').textContent = t; palavraAberta.pt = t; }
      } catch {
        if (palavraAberta && palavraAberta.en === en) $('jTraducao').textContent = 'Sem tradução agora (sem internet ou limite do dia).';
      }
    } else palavraAberta.pt = f.pt;
  }
  const fecharJanela = () => { if (sintese) sintese.cancel(); pararMicrofone(); $('janela').close(); };
  $('jFalar').onclick = async () => {
    if ($('jFalar').classList.contains('ouvindo')) { pararMicrofone(); return; }
    const alvo = palavraAberta.en;
    $('jResultado').textContent = 'Fale a palavra.';
    const r = await ouvirVoce($('jFalar'));
    if (!palavraAberta || palavraAberta.en !== alvo) return;
    if (r.erro) { $('jResultado').textContent = r.erro; return; }
    const { certos, ouvido } = melhorResultado(Fala.palavras(alvo), r.frases);
    $('jResultado').textContent = certos.every(Boolean) ? 'Certo.'
      : `Entendi "${ouvido || '...'}". Ouça de novo e tente outra vez.`;
  };
  $('jFechar').onclick = fecharJanela;
  $('janela').addEventListener('click', e => { if (e.target === $('janela')) fecharJanela(); });
  $('jOuvir').onclick = () => { sintese && sintese.cancel(); falar(palavraAberta.en, 1); };
  $('jDevagar').onclick = () => { sintese && sintese.cancel(); falar(palavraAberta.en, 0.6); };
  $('jLerDaqui').onclick = () => { const { si, wi } = palavraAberta; $('janela').close(); tocarDe(si, wi); };

  // ---------- caderno ----------
  const noCaderno = en => caderno.some(c => c.en.toLowerCase() === en.toLowerCase());
  function atualizarBotaoSalvar() {
    const ja = palavraAberta && noCaderno(palavraAberta.en);
    $('jSalvar').innerHTML = ja ? `${ic('check')} Já está no caderno` : `${ic('bookmark')} Salvar no caderno`;
    $('jSalvar').disabled = !!ja;
  }
  $('jSalvar').onclick = () => {
    if (!palavraAberta || noCaderno(palavraAberta.en)) return;
    caderno.unshift({ en: palavraAberta.en, pt: palavraAberta.pt || '', frase: palavraAberta.frase, data: new Date().toISOString().slice(0, 10) });
    salvarCaderno();
    atualizarBotaoSalvar();
  };
  function contarCaderno() {
    $('contaCaderno').textContent = caderno.length;
    const n = Treino.paraRevisar(caderno, Treino.hojeISO()).length;
    $('revisar').innerHTML = ic('cards') + (n ? ` Revisar agora · ${n} ${n === 1 ? 'palavra' : 'palavras'}` : ' Nada para revisar hoje');
    $('revisar').disabled = !n;
    const aviso = $('avisoRevisao');
    aviso.hidden = !n;
    aviso.innerHTML = '';
    if (n) {
      const t = document.createElement('span');
      t.textContent = `${n} ${n === 1 ? 'palavra' : 'palavras'} para revisar hoje.`;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'botao principal'; b.textContent = 'Revisar';
      b.onclick = () => { telaAnterior = 'telaNiveis'; comecarRevisao(); };
      aviso.append(t, b);
    }
  }
  function salvarCaderno() {
    // palavra salva de novo sai da lista de "tiradas"
    const tirados = ler(P + ':tirados', []);
    const ficam = tirados.filter(t => !noCaderno(t));
    if (ficam.length !== tirados.length) gravar(P + ':tirados', ficam);
    gravar(P + ':caderno', caderno);
    contarCaderno();
  }

  // ---------- revisão com flashcards ----------
  // Aparece a palavra em inglês (e a voz fala). Você tenta lembrar o significado,
  // pode falar no microfone, e depois diz se acertou. Errou: volta no fim da fila.
  const rev = { fila: [], atual: null, feitas: 0 };
  function comecarRevisao() {
    rev.fila = Treino.paraRevisar(caderno, Treino.hojeISO()).map(c => c.en);
    rev.feitas = 0;
    $('cartao').hidden = false;
    $('revFim').hidden = true;
    mostrar('telaRevisao');
    proximoCartao();
  }
  function proximoCartao() {
    pararMicrofone();
    const en = rev.fila.shift();
    rev.atual = caderno.find(c => c.en === en) || null;
    if (!rev.atual) { if (rev.fila.length) { proximoCartao(); return; } fimRevisao(); return; }
    const n = rev.fila.length + 1;
    $('revInfo').textContent = `${n === 1 ? 'Falta 1' : 'Faltam ' + n}. Você sabe o que significa?`;
    $('fcEn').textContent = rev.atual.en;
    $('fcFala').textContent = '';
    $('fcPt').textContent = rev.atual.pt || '(sem tradução salva)';
    $('fcFrase').textContent = rev.atual.frase && rev.atual.frase !== rev.atual.en ? rev.atual.frase : '';
    $('fcResposta').hidden = true;
    $('fcBotoes').hidden = true;
    $('fcMostrar').hidden = false;
    if (sintese) sintese.cancel();
    falar(rev.atual.en, 0.85);
  }
  function responderCartao(acertou) {
    const i = caderno.indexOf(rev.atual);
    if (i >= 0) caderno[i] = Treino.responder(rev.atual, acertou, Treino.hojeISO());
    if (!acertou) rev.fila.push(rev.atual.en);   // aparece de novo antes de acabar
    else rev.feitas++;
    salvarCaderno();
    proximoCartao();
  }
  function fimRevisao() {
    $('cartao').hidden = true;
    $('revInfo').textContent = '';
    const fim = $('revFim');
    const amanha = Treino.somarDias(Treino.hojeISO(), 1);
    const nAmanha = Treino.paraRevisar(caderno, amanha).length;
    fim.innerHTML = `<strong>Revisão de hoje concluída</strong><br>${rev.feitas} ${rev.feitas === 1 ? 'palavra revisada' : 'palavras revisadas'}.
      ${nAmanha ? `Amanhã voltam ${nAmanha}.` : 'Amanhã não tem nada para revisar.'}<br>`;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'botao principal'; b.textContent = 'Voltar ao caderno';
    b.onclick = () => { montarCaderno(); mostrar('telaCaderno'); };
    fim.appendChild(b);
    fim.hidden = false;
  }
  $('revisar').onclick = comecarRevisao;
  $('voltarDaRevisao').onclick = () => { pararMicrofone(); montarCaderno(); mostrar('telaCaderno'); };
  $('fcOuvir').onclick = () => { if (sintese) sintese.cancel(); falar(rev.atual.en, 0.85); };
  $('fcMostrar').onclick = () => { $('fcResposta').hidden = false; $('fcBotoes').hidden = false; $('fcMostrar').hidden = true; };
  $('fcErrei').onclick = () => responderCartao(false);
  $('fcAcertei').onclick = () => responderCartao(true);
  $('fcFalar').onclick = async () => {
    if ($('fcFalar').classList.contains('ouvindo')) { pararMicrofone(); return; }
    const alvo = rev.atual;
    $('fcFala').textContent = 'Fale a palavra.';
    const r = await ouvirVoce($('fcFalar'));
    if (rev.atual !== alvo) return;
    if (r.erro) { $('fcFala').textContent = r.erro; return; }
    const { certos, ouvido } = melhorResultado(Fala.palavras(alvo.en), r.frases);
    $('fcFala').textContent = certos.every(Boolean) ? 'Pronúncia certa.' : `Entendi "${ouvido || '...'}". Tente de novo.`;
  };
  function montarCaderno() {
    const box = $('listaCaderno');
    box.innerHTML = '';
    if (!caderno.length) {
      box.innerHTML = '<p class="vazio">Ainda vazio. Durante a leitura, toque numa palavra e depois em Salvar no caderno.</p>';
      return;
    }
    caderno.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'item-caderno';
      const ouvir = document.createElement('button');
      ouvir.className = 'botao icone'; ouvir.type = 'button'; ouvir.innerHTML = ic('play');
      ouvir.setAttribute('aria-label', 'Ouvir ' + c.en);
      ouvir.onclick = () => { sintese && sintese.cancel(); falar(c.en, 0.85); };
      const txt = document.createElement('div');
      txt.className = 'txt';
      const forte = document.createElement('strong'); forte.lang = IDIOMA; forte.textContent = c.en;
      const pt = document.createElement('span'); pt.textContent = c.pt;
      const fr = document.createElement('small'); fr.lang = IDIOMA; fr.textContent = c.frase && c.frase !== c.en ? c.frase : '';
      const quando = document.createElement('small'); quando.className = 'quando';
      quando.textContent = !c.proxima ? 'Nova: ainda não revisada'
        : c.proxima <= Treino.hojeISO() ? 'Revisar hoje' : 'Próxima revisão: ' + c.proxima.split('-').reverse().slice(0, 2).join('/');
      txt.append(forte, pt, fr, quando);
      const tirar = document.createElement('button');
      tirar.className = 'botao icone'; tirar.type = 'button'; tirar.innerHTML = ic('trash');
      tirar.setAttribute('aria-label', 'Tirar ' + c.en + ' do caderno');
      tirar.onclick = () => {
        gravar(P + ':tirados', ler(P + ':tirados', []).concat(c.en.toLowerCase()));   // não volta pela nuvem
        caderno.splice(i, 1); salvarCaderno(); montarCaderno();
      };
      item.append(ouvir, txt, tirar);
      box.appendChild(item);
    });
  }
  $('abrirCaderno').onclick = () => { montarCaderno(); mostrar('telaCaderno'); };
  $('voltarDoCaderno').onclick = () => {
    if (telaAnterior === 'telaNiveis') { montarNiveis(); mostrar('telaNiveis'); }
    else mostrar(telaAnterior);
  };

  // ---------- nível 5: o seu livro ----------
  const nivel5 = () => NIVEIS.find(x => x.n === 5);
  function abrirLivro(nome, paginas) {
    estado.licao = null;
    estado.livro = { nome, paginas: paginas.length ? paginas : [[]], pagina: 0 };
    const marcador = ler(P + ':marcador', {});
    if (marcador.nome === nome && marcador.pagina < paginas.length) estado.livro.pagina = marcador.pagina;
    prepararLeitura(nivel5(), nome);
    mostrarPaginaDoLivro();
    mostrar('telaLeitura');
  }
  function mostrarPaginaDoLivro() {
    const l = estado.livro;
    parar();
    const frases = l.paginas[l.pagina] || [];
    usarFrases(frases.map(en => ({ en, pt: '' })), false);
    if (!frases.length) $('texto').innerHTML = '<p class="vazio">Esta página não tem texto (pode ser uma imagem ou um PDF escaneado).</p>';
    $('paginacao').hidden = l.paginas.length < 2;
    $('pagInfo').textContent = `Página ${l.pagina + 1} de ${l.paginas.length}`;
    $('pagAnt').disabled = l.pagina === 0;
    $('pagProx').disabled = l.pagina >= l.paginas.length - 1;
    gravar(P + ':marcador', { nome: l.nome, pagina: l.pagina });
    window.scrollTo(0, 0);
  }
  $('pagAnt').onclick = () => { estado.livro.pagina--; mostrarPaginaDoLivro(); };
  $('pagProx').onclick = () => { estado.livro.pagina++; mostrarPaginaDoLivro(); };

  // Texto comprido vira páginas de ~12 frases
  function paginarFrases(frases, porPagina = 12) {
    const paginas = [];
    for (let i = 0; i < frases.length; i += porPagina) paginas.push(frases.slice(i, i + porPagina));
    return paginas;
  }
  // .txt antigo do Windows (Bloco de Notas "ANSI") não vem em UTF-8: "señor" virava "se�or".
  // Tenta UTF-8 primeiro; se não for, lê como Windows-1252 (o jeito antigo, com os acentos do português e do espanhol).
  async function lerTextoDoArquivo(arq) {
    const bytes = await arq.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return new TextDecoder('windows-1252').decode(bytes); }
  }
  $('lerColado').onclick = () => {
    const frases = Fala.dividirFrases($('colado').value);
    if (!frases.length) { $('statusLivro').textContent = 'Cole um texto primeiro.'; return; }
    abrirLivro('Texto colado', paginarFrases(frases));
  };
  $('entrada').onchange = async () => {
    const arq = $('entrada').files[0];
    $('entrada').value = '';
    if (!arq) return;
    const st = $('statusLivro');
    try {
      if (/\.pdf$/i.test(arq.name) || arq.type === 'application/pdf') {
        if (!window.pdfjsLib) throw new Error('não consegui carregar o leitor de PDF (sem internet?)');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        st.textContent = `Abrindo ${arq.name}...`;
        const pdf = await pdfjsLib.getDocument({ data: await arq.arrayBuffer() }).promise;
        const paginas = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          st.textContent = `Lendo a página ${n} de ${pdf.numPages}...`;
          const cont = await (await pdf.getPage(n)).getTextContent();
          const paragrafos = Texto.paragrafosDeLinhas(Texto.linhasDoPdf(cont.items));
          paginas.push(paragrafos.flatMap(p => Fala.dividirFrases(p)));
        }
        st.textContent = '';
        abrirLivro(arq.name, paginas);
      } else {
        const frases = Texto.paragrafosDeLinhas((await lerTextoDoArquivo(arq)).split(/\r?\n/)).flatMap(p => Fala.dividirFrases(p));
        abrirLivro(arq.name, paginarFrases(frases));
      }
    } catch (e) {
      st.textContent = 'Não deu para abrir: ' + e.message;
    }
  };

  // ---------- nível 6: criar uma lição sobre um assunto ----------
  $('assuntoCriar').onclick = async () => {
    const texto = $('assuntoTexto').value.replace(/\s+/g, ' ').trim();
    const st = msg => { $('statusAssunto').textContent = msg || ''; };
    if (!texto) { st('Escreva um assunto primeiro. Ex: futebol, viagem, no restaurante.'); return; }
    const tipo = $('assuntoTipo').value;
    $('assuntoCriar').disabled = true;
    try {
      const l = await Assunto.gerar(texto, I.nome, tipo, st);
      const licao = { id: 'a-' + Date.now().toString(36), titulo: l.titulo, assunto: texto, tipo, frases: l.frases };
      assuntos.push(licao);
      gravar(P + ':assuntos', assuntos);
      $('assuntoTexto').value = '';
      st('');
      abrirLicao(NIVEL6, licao);
    } catch (e) {
      st(e.message);
    } finally {
      $('assuntoCriar').disabled = false;
    }
  };
  $('assuntoTexto').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('assuntoCriar').click(); } });

  // ---------- troca de idioma ----------
  // Cada idioma tem o seu progresso; o tema e o tamanho da letra vão junto na troca.
  function trocarIdioma(cod) {
    if (cod === IDIOMA) return;
    const chaveOutro = (cod === 'es' ? 'espanhol' : 'ingles') + ':prefs';
    gravar(chaveOutro, Object.assign(ler(chaveOutro, {}), { tema: prefs.tema, fonte: prefs.fonte }));
    gravar('idiomas:atual', cod);
    parar();
    location.replace(location.pathname + location.search);   // recarrega sem o #atalho
  }
  document.querySelectorAll('.idiomas button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.idioma === IDIOMA));
    b.onclick = () => trocarIdioma(b.dataset.idioma);
  });
  // Textos da página que dependem do idioma
  document.title = `Leitor de Idiomas · ${I.Nome}`;
  $('tituloInicio').textContent = `Seu ${I.nome}, passo a passo`;
  $('ouCole').textContent = `ou cole um texto em ${I.nome}:`;
  $('colado').placeholder = IDIOMA === 'es' ? 'Pega aquí tu texto en español' : 'Paste your English text here';
  document.querySelectorAll('[lang="en"]').forEach(el => { el.lang = IDIOMA; });

  // ---------- navegação ----------
  $('inicio').onclick = () => { montarNiveis(); mostrar('telaNiveis'); };
  $('voltarNiveis').onclick = () => { montarNiveis(); mostrar('telaNiveis'); };
  $('voltarLicoes').onclick = () => abrirNivel(estado.nivel);

  // ---------- começar ----------
  aplicarVisual();
  montarVelocidades();
  montarNiveis();
  contarCaderno();
  if (!sintese) status('Este navegador não fala em voz alta. Use o Chrome ou o Edge.');

  // Atalho pelo endereço: #licao=2-casa abre a lição direto, #nivel=5 abre o nível
  const m = location.hash.match(/^#(licao|nivel)=(.+)$/);
  if (m && m[1] === 'nivel' && NIVEIS.some(x => x.n === +m[2])) abrirNivel(+m[2]);
  if (m && m[1] === 'licao') {
    for (const nv of NIVEIS) {
      const l = nv.licoes.find(x => x.id === decodeURIComponent(m[2]));
      if (l) { estado.nivel = nv.n; abrirLicao(nv, l); }
    }
  }
})();
