// nuvem.js: login com o Google e progresso salvo no Firebase (Firestore).
// Cada pessoa tem uma "gaveta" só dela: o documento progresso/<seu id>.
// As regras de segurança (firestore.rules) deixam só o dono abrir a própria gaveta.
//
// As configurações do Firebase (firebase-config.js) podem ficar públicas:
// quem protege os dados são as regras, não o segredo dessas chaves.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
const S = window.Sincronia;
const painel = $('nuvem');

if (window.FIREBASE_CONFIG && painel && S) {
  const app = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let usuario = null, pronto = false, timer = null;
  painel.hidden = false;

  const mostrar = (texto, botao) => {
    $('nuvemTexto').textContent = texto;
    $('nuvemBotao').textContent = botao;
  };
  mostrar('☁️ Entre com o Google para salvar o progresso e usar em outros aparelhos.', 'Entrar com Google');

  // Manda o progresso dos dois idiomas para a nuvem
  async function enviar() {
    if (!usuario || !pronto) return;
    const dados = { atualizado: serverTimestamp() };
    for (const p of S.PREFIXOS) dados[p] = JSON.stringify(S.lerLocal(p));
    try {
      await setDoc(doc(db, 'progresso', usuario.uid), dados);
      mostrar(`☁️ Progresso salvo na nuvem (${usuario.displayName || usuario.email}).`, 'Sair');
    } catch (e) {
      mostrar('☁️ Não consegui salvar na nuvem agora. Tento de novo na próxima mudança.', 'Sair');
    }
  }

  // Ao entrar: junta o que está no aparelho com o que está na nuvem
  async function sincronizar() {
    mostrar('☁️ Juntando o seu progresso...', 'Sair');
    let nuvem = {};
    try {
      const snap = await getDoc(doc(db, 'progresso', usuario.uid));
      if (snap.exists()) nuvem = snap.data();
    } catch (e) {
      mostrar('☁️ Não consegui ler a nuvem (sem internet?). Seu progresso continua salvo neste aparelho.', 'Sair');
      return;
    }
    let mudouAqui = false;
    for (const p of S.PREFIXOS) {
      let daNuvem = {};
      try { daNuvem = nuvem[p] ? JSON.parse(nuvem[p]) : {}; } catch { daNuvem = {}; }
      const local = S.lerLocal(p);
      const junto = S.juntar(local, daNuvem);
      if (!S.igual(junto, local)) { S.gravarLocal(p, junto); mudouAqui = true; }
    }
    pronto = true;
    await enviar();
    // trouxe coisas de outro aparelho: recarrega a tela para aparecerem
    if (mudouAqui) location.reload();
  }

  onAuthStateChanged(auth, u => {
    usuario = u;
    pronto = false;
    if (u) sincronizar();
    else mostrar('☁️ Entre com o Google para salvar o progresso e usar em outros aparelhos.', 'Entrar com Google');
  });

  $('nuvemBotao').onclick = async () => {
    if (usuario) { await signOut(auth); return; }
    const provedor = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provedor); }
    catch (e) {
      // celular que bloqueia janelinha: tenta trocando de página
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') signInWithRedirect(auth, provedor);
      else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') mostrar('☁️ Não deu para entrar (' + e.code + ').', 'Entrar com Google');
    }
  };

  // O app avisa quando algo muda (lição feita, caderno, assunto): salva 2 s depois
  window.addEventListener('leitor:mudou', () => { clearTimeout(timer); timer = setTimeout(enviar, 2000); });
}
