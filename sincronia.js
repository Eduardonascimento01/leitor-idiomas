// sincronia.js: junta o progresso deste aparelho com o que está na nuvem (Firebase).
// Não usa a internet: só decide COMO juntar, por isso dá para testar no Node (teste.js).
//
// O que vai para a nuvem, por idioma: lições feitas, caderno e seus assuntos.
// Regra de ouro: juntar sem perder nada. Exemplo: no PC você fez a lição 1 e no
// celular a lição 2; depois de juntar, as duas aparecem feitas nos dois aparelhos.
// Para apagar de verdade (uma palavra do caderno, uma lição criada), guardamos
// uma "lista de apagados"; sem ela, o outro aparelho traria a coisa de volta.
(function (raiz) {
  'use strict';

  const PREFIXOS = ['ingles', 'espanhol'];
  const vazio = () => ({ feitas: {}, caderno: [], assuntos: [], apagados: [], tirados: [] });

  // Confere o formato (dado estranho vira vazio, em vez de quebrar o app)
  function arrumar(d) {
    const v = vazio();
    if (!d || typeof d !== 'object') return v;
    if (d.feitas && typeof d.feitas === 'object') v.feitas = d.feitas;
    for (const k of ['caderno', 'assuntos', 'apagados', 'tirados']) if (Array.isArray(d[k])) v[k] = d[k];
    return v;
  }

  const chavePalavra = c => String(c.en || '').toLowerCase();
  // Quanto "uso" um cartão do caderno já teve: o que foi mais revisado vence
  const uso = c => (c.acertos || 0) + (c.erros || 0);

  function juntar(localBruto, nuvemBruta) {
    const a = arrumar(localBruto), b = arrumar(nuvemBruta);
    const apagados = [...new Set([...a.apagados, ...b.apagados])];
    const tirados = [...new Set([...a.tirados, ...b.tirados].map(x => String(x).toLowerCase()))];

    // lições feitas: feita em qualquer aparelho = feita
    const feitas = Object.assign({}, b.feitas, a.feitas);
    for (const id of apagados) delete feitas[id];

    // caderno: uma vez cada palavra; se está nos dois, fica o cartão mais revisado
    const porPalavra = new Map();
    for (const c of [...a.caderno, ...b.caderno]) {
      const k = chavePalavra(c);
      if (!k || tirados.includes(k)) continue;
      const ja = porPalavra.get(k);
      if (!ja || uso(c) > uso(ja)) porPalavra.set(k, c);
    }

    // seus assuntos: uma vez cada lição (pelo id), na ordem em que foram criadas
    const porId = new Map();
    for (const l of [...a.assuntos, ...b.assuntos]) if (l && l.id && !apagados.includes(l.id) && !porId.has(l.id)) porId.set(l.id, l);
    const assuntos = [...porId.values()].sort((x, y) => String(x.id).localeCompare(String(y.id)));

    return { feitas, caderno: [...porPalavra.values()], assuntos, apagados, tirados };
  }

  // Mudou alguma coisa? (para saber se precisa recarregar a tela depois de juntar)
  const igual = (x, y) => JSON.stringify(arrumar(x)) === JSON.stringify(arrumar(y));

  // ---------- ler e gravar no navegador ----------
  function lerLocal(prefixo) {
    const ler = (k, p) => { try { const v = localStorage.getItem(prefixo + ':' + k); return v === null ? p : JSON.parse(v); } catch { return p; } };
    return arrumar({ feitas: ler('feitas', {}), caderno: ler('caderno', []), assuntos: ler('assuntos', []),
      apagados: ler('apagados', []), tirados: ler('tirados', []) });
  }
  function gravarLocal(prefixo, d) {
    try { for (const k of Object.keys(vazio())) localStorage.setItem(prefixo + ':' + k, JSON.stringify(d[k])); }
    catch { /* sem armazenamento */ }
  }

  const api = { PREFIXOS, vazio, arrumar, juntar, igual, lerLocal, gravarLocal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Sincronia = api;
})(this);
