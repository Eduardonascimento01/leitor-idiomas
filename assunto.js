// assunto.js: cria uma lição nova sobre um ASSUNTO que você escolhe (nível 6).
// Quem escreve a lição é uma IA grátis e sem chave: o Pollinations
// (projeto de código aberto, github.com/pollinations/pollinations).
// A parte que monta o pedido e confere a resposta não usa a internet,
// então dá para testar no Node (teste.js).
(function (raiz) {
  'use strict';

  const URL_IA = 'https://text.pollinations.ai/openai';

  // Os 3 tipos de lição que dá para pedir
  const TIPOS = {
    frases: { nome: 'Frases curtas', qtd: 8, regra: 'frases curtas e úteis, de 3 a 8 palavras cada' },
    historia: { nome: 'Historinha', qtd: 9, regra: 'uma historinha fácil, contada em frases simples de até 12 palavras' },
    texto: { nome: 'Texto', qtd: 10, regra: 'um texto informativo, com frases de até 20 palavras' },
  };

  // O pedido para a IA. Pedimos SÓ um JSON, para o app conseguir ler a resposta.
  function montarPedido(assunto, idiomaNome, tipo) {
    const t = TIPOS[tipo] || TIPOS.frases;
    return [
      { role: 'system', content: `Você é professor de ${idiomaNome} para brasileiros iniciantes. ` +
        'Responda SOMENTE com um JSON válido, sem texto antes ou depois, sem markdown.' },
      { role: 'user', content: `Crie uma lição de ${idiomaNome} sobre o assunto: "${assunto}".\n` +
        `Faça ${t.qtd} frases: ${t.regra}. Use ${idiomaNome} natural, como um nativo fala, com vocabulário do dia a dia.\n` +
        'Cada frase vem com a tradução em português do Brasil.\n' +
        'Formato exato: {"titulo": "título curto em português", "frases": [["frase em ' + idiomaNome + '", "tradução"], ...]}' },
    ];
  }

  // A IA às vezes manda o JSON dentro de ```json ... ``` ou com texto em volta.
  // Pegamos do primeiro "{" ao último "}" e conferimos tudo antes de aceitar.
  function lerResposta(texto) {
    const s = String(texto || '');
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    let j;
    try { j = JSON.parse(s.slice(a, b + 1)); } catch { return null; }
    if (!j || !Array.isArray(j.frases)) return null;
    const limpa = x => String(x || '').replace(/\s+/g, ' ').trim().slice(0, 220);
    const frases = j.frases
      .map(f => (Array.isArray(f) ? f : [f && (f.frase || f.texto), f && (f.traducao || f.pt)]))
      .map(([l, pt]) => [limpa(l), limpa(pt)])
      .filter(([l]) => l.length > 0)
      .slice(0, 12);
    if (frases.length < 3) return null;
    return { titulo: limpa(j.titulo).slice(0, 60) || 'Lição nova', frases };
  }

  const esperar = ms => new Promise(r => setTimeout(r, ms));

  // Pede a lição. O serviço grátis às vezes diz "ocupado": tentamos até 3 vezes.
  // aviso(msg) mostra na tela o que está acontecendo.
  async function gerar(assunto, idiomaNome, tipo, aviso) {
    let ultimoErro = 'O serviço de IA não respondeu.';
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      if (aviso) aviso(tentativa === 1 ? 'Escrevendo a lição... (pode levar até 1 minuto)'
        : `O serviço grátis está ocupado. Tentando de novo (${tentativa} de 3)...`);
      const ctrl = new AbortController();
      const tempo = setTimeout(() => ctrl.abort(), 90000);
      try {
        const r = await fetch(URL_IA, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'openai', messages: montarPedido(assunto, idiomaNome, tipo) }),
        });
        clearTimeout(tempo);
        if (r.ok) {
          const j = await r.json();
          const conteudo = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          const licao = lerResposta(conteudo);
          if (licao) return licao;
          ultimoErro = 'A IA respondeu fora do formato.';
        } else if (r.status === 403) {
          // o serviço só aceita pedidos vindos de um site no ar (com o app aberto do computador, ele bloqueia)
          const e = new Error('A IA grátis só funciona pelo site no ar: eduardonascimento01.github.io/leitor-idiomas');
          e.final = true;
          throw e;
        } else ultimoErro = `O serviço de IA está ocupado (erro ${r.status}).`;
      } catch (e) {
        clearTimeout(tempo);
        if (e.final) throw e;          // não adianta tentar de novo
        ultimoErro = e.name === 'AbortError' ? 'A IA demorou demais.' : 'Sem internet ou o serviço de IA está fora do ar.';
      }
      if (tentativa < 3) await esperar(10000);   // o próprio serviço pede para esperar ~10 s
    }
    throw new Error(ultimoErro + ' Tente de novo daqui a pouco.');
  }

  const api = { TIPOS, montarPedido, lerResposta, gerar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Assunto = api;
})(this);
