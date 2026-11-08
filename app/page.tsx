'use client';

// Página de planos do Maply Premium.
// Visual: gramática "split stage" da skill scroll-craft (Grátis x Premium lado a lado; o Premium vence no fim).
// O motor de rolagem (public/scrollcraft/scrollcraft.js) lê os atributos data-sc-* do HTML; não editar o motor.

import { useEffect, useRef, useState } from 'react';
import { createClient, type User } from '@supabase/supabase-js';
import './scrollcraft.css';
import './premium.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const LIMITE_VAGAS = 50;
const WHATSAPP_SUPORTE = 'https://wa.me/5594991040902';
const WHATSAPP_TEXTO = '(94) 99104-0902';
const TERMOS = 'https://docs.google.com/document/d/e/2PACX-1vRb2YzC22gxBxNKthDb4872lOAMv-qydh-fs-m3rzuNroBG9EpOSfbrJMZExJVQNIyagfk3GxdP09ns/pub';

const RAMOS = ['eletricista', 'encanador', 'manicure', 'diarista', 'mecânico', 'restaurante', 'pet shop'];

const ELITE = {
  mensal: { plano: 'Plano Elite Mensal', preco: 'R$ 29,99', unidade: 'por mês', ganho: 'Cobrado no cartão todo mês.', regra: 'Renova sozinho todo mês. Cancele quando quiser, sem multa.' },
  anual: { plano: 'Plano Elite Anual', preco: 'R$ 282,50', unidade: 'por ano', ganho: 'Equivale a R$ 23,54 por mês. Você economiza R$ 77,38.', regra: 'Pagamento único, no Pix ou no cartão. Não renova sozinho: avisamos 3 dias antes de vencer.' },
} as const;

const NOME_PLANO: Record<string, string> = {
  mensal: 'Elite mensal',
  mensal_cancelado: 'Elite mensal',
  anual: 'Elite anual',
  fundador: 'Fundador',
};

const OUTROS = [
  { ini: 'SF', nome: 'Silva e Filhos', km: '0,8 km' },
  { ini: 'PC', nome: 'Ponto Certo', km: '1,1 km' },
  { ini: 'CN', nome: 'Casa Nova Serviços', km: '1,4 km' },
  { ini: 'RA', nome: 'Rápido Atende', km: '1,9 km' },
  { ini: 'BB', nome: 'Bairro Bom', km: '2,2 km' },
];

const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

declare global {
  interface Window {
    ScrollCraft?: { mount: (root: HTMLElement) => void };
    __maplyScrollMontado?: boolean;
  }
}

/* ---------- ícones (traço, herdam a cor) ---------- */
const IconeBusca = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ display: 'inline' }}>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);
const IconeDiamante = ({ cor = 'currentColor', tam = 22 }: { cor?: string; tam?: number }) => (
  <svg className="diamante" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M12 21 8 9l4-6 4 6z" />
  </svg>
);
const IconeCheck = ({ cor }: { cor: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const IconeMais = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconeZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
);

export default function PaginaPremium() {
  /* ---------- conta ---------- */
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isPrestador, setIsPrestador] = useState(false);
  const [tipoPlano, setTipoPlano] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [vagasOcupadas, setVagasOcupadas] = useState<number | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null);

  /* ---------- login ---------- */
  const dialogo = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [msgLogin, setMsgLogin] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null);
  const [motivoLogin, setMotivoLogin] = useState('Entre com a mesma conta do app Maply.');

  /* ---------- assinatura da página: o nome do negócio do visitante ---------- */
  const [nome, setNome] = useState('');
  const [ramo, setRamo] = useState('eletricista');
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('anual');

  const nomeLimpo = nome.trim();
  const nomeTexto = nomeLimpo || 'seu negócio';
  const nomeInicio = nomeLimpo || 'Seu negócio';
  const inicial = (nomeLimpo || 'S').charAt(0).toUpperCase();

  // sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) dialogo.current?.close();
    });
    return () => subscription.unsubscribe();
  }, []);

  // perfil, plano e vagas do estado de quem entrou
  useEffect(() => {
    if (!user) {
      setIsPremium(false); setIsPrestador(false); setTipoPlano(null); setExpiraEm(null); setEstado(null); setVagasOcupadas(null);
      return;
    }
    (async () => {
      // meu_perfil() devolve o perfil completo do próprio usuário (tipo_plano e vencimento são privados)
      const { data } = await supabase.rpc('meu_perfil').maybeSingle<{
        estado: string | null; is_premium: boolean | null; is_prestador: boolean | null;
        tipo_plano: string | null; data_expiracao_premium: string | null; business_name: string | null;
      }>();
      setIsPremium(!!data?.is_premium);
      setIsPrestador(!!data?.is_prestador);
      setTipoPlano(data?.tipo_plano ?? null);
      setExpiraEm(data?.data_expiracao_premium ?? null);
      const uf = data?.estado || null;
      setEstado(uf);
      if (data?.business_name) setNome((atual) => atual.trim() ? atual : data.business_name ?? '');
      if (uf) {
        try {
          const r = await fetch(`/api/vagas?estado=${encodeURIComponent(uf)}`);
          const j = await r.json();
          setVagasOcupadas(typeof j.vagasOcupadas === 'number' ? j.vagasOcupadas : null);
        } catch { setVagasOcupadas(null); }
      }
    })();
  }, [user]);

  // lembra nome e ramo neste navegador (só conveniência)
  useEffect(() => {
    try {
      const n = localStorage.getItem('maply-nome');
      const r = localStorage.getItem('maply-ramo');
      if (n) setNome(n);
      if (r && RAMOS.includes(r)) setRamo(r);
    } catch { /* armazenamento bloqueado: segue sem lembrar */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('maply-nome', nome); localStorage.setItem('maply-ramo', ramo); } catch { /* idem */ }
  }, [nome, ramo]);

  // motor de rolagem: carrega uma vez, depois que o React desenhou a página
  useEffect(() => {
    if (window.__maplyScrollMontado) return;
    window.__maplyScrollMontado = true;
    const s = document.createElement('script');
    s.src = '/scrollcraft/scrollcraft.js';
    s.onload = () => window.ScrollCraft?.mount(document.body);
    document.body.appendChild(s);
  }, []);

  // coreografia própria: a busca que se reordena e o divisor Grátis | Premium
  useEffect(() => {
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const celular = matchMedia('(max-width: 860px)');
    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const suave = (x: number) => { x = clamp01(x); return x * x * (3 - 2 * x); };
    const progresso = (el: HTMLElement) => { const v = parseFloat(el.style.getPropertyValue('--sc-p')); return isNaN(v) ? 0 : v; };

    const atoBusca = document.getElementById('busca') as HTMLElement;
    const lista = document.getElementById('lista-viva') as HTMLElement;
    const outros = Array.from(lista.querySelectorAll<HTMLElement>('li[data-k]'));
    const eu = lista.querySelector<HTMLElement>('[data-eu]')!;
    const estadoBusca = document.getElementById('estado-busca');
    const divisor = document.getElementById('divisor') as HTMLElement;
    const fio = divisor.querySelector<HTMLElement>('.divisor__fill')!;
    const inicio = document.getElementById('abertura') as HTMLElement;
    const colapso = document.getElementById('colapso') as HTMLElement;

    let passo = 72;
    let ultimoY = -1;
    let ultimaMarca = '';
    let quadroId = 0;

    const medir = () => {
      passo = (eu.getBoundingClientRect().height || 64) + 8;
      lista.style.height = `${passo * 6 - 8}px`;
      ultimoY = -1; ultimaMarca = '';
    };
    const posicionar = (y: number) => {
      eu.style.transform = `translateY(${y * passo}px)`;
      eu.querySelector('.pos')!.textContent = `${Math.round(y) + 1}º`;
      eu.classList.toggle('topo', y < 0.04);
      outros.forEach((li) => {
        const k = Number(li.dataset.k);
        const pos = k + clamp01(k + 1 - y);
        li.style.transform = `translateY(${pos * passo}px)`;
        li.querySelector('.pos')!.textContent = `${Math.round(pos) + 1}º`;
      });
      if (estadoBusca) estadoBusca.textContent = y > 4.5 ? 'Sem Premium, você aparece em 6º.' : y < 0.04 ? 'Com Premium, você sobe para o 1º.' : 'Subindo na busca...';
    };
    const quadro = () => {
      // o motor publica --sc-p no quadro dele: compara também o progresso, não só a rolagem
      const marca = `${scrollY}|${innerWidth}|${progresso(atoBusca)}|${progresso(colapso)}`;
      if (marca !== ultimaMarca) {
        ultimaMarca = marca;
        const vh = innerHeight;
        const y = reduz ? 0 : 5 - 5 * suave((progresso(atoBusca) - 0.1) / 0.5);
        if (Math.abs(y - ultimoY) > 0.001) { posicionar(y); ultimoY = y; }
        const a = inicio.getBoundingClientRect().top + scrollY;
        const c = colapso.getBoundingClientRect();
        const fim = c.top + scrollY + c.height - vh;
        const k = Math.min(1, progresso(colapso) * 1.6);
        divisor.classList.toggle('ativo', scrollY < fim + vh * 0.05 && k < 0.98);
        if (!celular.matches) {
          divisor.style.setProperty('--divx', String(50 * (1 - (reduz ? 0 : k))));
          fio.style.setProperty('--fio', String(clamp01((scrollY - a) / Math.max(1, fim - a))));
        } else {
          const el = document.elementFromPoint(innerWidth / 2, 70);
          const lado = el?.closest('.claro, .escuro');
          divisor.dataset.lado = lado?.classList.contains('claro') ? 'g' : 'p';
        }
      }
      quadroId = requestAnimationFrame(quadro);
    };

    medir();
    addEventListener('resize', medir);
    quadroId = requestAnimationFrame(quadro);
    return () => { cancelAnimationFrame(quadroId); removeEventListener('resize', medir); };
  }, []);

  /* ---------- ações ---------- */
  const abrirLogin = (motivo?: string) => {
    setMotivoLogin(motivo || 'Entre com a mesma conta do app Maply.');
    setMsgLogin(null);
    dialogo.current?.showModal();
  };

  const entrarComSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntrando(true); setMsgLogin(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setMsgLogin({ tipo: 'erro', texto: 'E-mail ou senha incorretos. Confira e tente de novo, ou receba um link de acesso.' });
    setEntrando(false);
  };
  const entrarComLink = async () => {
    if (!email.trim()) { setMsgLogin({ tipo: 'erro', texto: 'Digite seu e-mail para receber o link de acesso.' }); return; }
    setEntrando(true); setMsgLogin(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMsgLogin(error
      ? { tipo: 'erro', texto: 'Não foi possível enviar o link. Confira o e-mail digitado.' }
      : { tipo: 'ok', texto: 'Enviamos um link para o seu e-mail. Abra e toque nele para entrar, sem senha.' });
    setEntrando(false);
  };
  const entrarCom = async (provider: 'google' | 'apple') => {
    setEntrando(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) { setMsgLogin({ tipo: 'erro', texto: `Não foi possível entrar com ${provider === 'google' ? 'o Google' : 'a Apple'}.` }); setEntrando(false); }
  };
  const sair = async () => { await supabase.auth.signOut(); setAviso(null); };

  const cabecalhos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  // o preço é definido pelo servidor; aqui só vai o nome do plano
  const assinar = async (plano: string) => {
    setAviso(null);
    if (!user) { abrirLogin('Entre na sua conta do Maply para assinar.'); return; }
    if (!isPrestador) { setAviso({ tipo: 'erro', texto: 'Os planos são para prestadores. Cadastre seu negócio no app Maply e volte aqui com a mesma conta.' }); return; }
    if (isPremium) { setAviso({ tipo: 'ok', texto: 'Você já é Premium. Seus benefícios estão ativos.' }); return; }
    setProcessando(plano);
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: await cabecalhos(), body: JSON.stringify({ plano }) });
      const j = await r.json();
      if (j.init_point) { window.location.assign(j.init_point); return; }
      setAviso({ tipo: 'erro', texto: j.error || 'Não foi possível abrir o pagamento. Tente de novo em instantes.' });
    } catch {
      setAviso({ tipo: 'erro', texto: 'Sem conexão com o servidor. Confira sua internet e tente de novo.' });
    }
    setProcessando(null);
  };

  // cancela só a renovação do mensal; o Premium continua até a data paga
  const cancelarRenovacao = async () => {
    const ate = expiraEm ? ` até ${formatarData(expiraEm)}` : ' até o fim do mês já pago';
    if (!confirm(`Cancelar a renovação automática? Nada mais será cobrado e você continua Premium${ate}.`)) return;
    setProcessando('cancelar');
    try {
      const r = await fetch('/api/cancelar', { method: 'POST', headers: await cabecalhos() });
      if (r.ok) { setTipoPlano('mensal_cancelado'); setAviso({ tipo: 'ok', texto: `Renovação cancelada. Você continua Premium${ate}.` }); }
      else setAviso({ tipo: 'erro', texto: 'Não foi possível cancelar agora. Tente de novo em instantes.' });
    } catch {
      setAviso({ tipo: 'erro', texto: 'Sem conexão com o servidor. Confira sua internet e tente de novo.' });
    }
    setProcessando(null);
  };

  const elite = ELITE[periodo];
  const mostrarFundador = vagasOcupadas === null || vagasOcupadas < LIMITE_VAGAS;
  const textoVagas = estado && vagasOcupadas !== null
    ? `Restam ${LIMITE_VAGAS - vagasOcupadas} de ${LIMITE_VAGAS} vagas em ${estado}`
    : `${LIMITE_VAGAS} vagas por estado`;

  return (
    <>
      <span data-sc-progress></span>

      <div className="divisor" id="divisor" aria-hidden="true">
        <span className="divisor__linha"><span className="divisor__fill"></span></span>
        <span className="divisor__rotulos"><span className="divisor__rotulo divisor__rotulo--g">Grátis</span><span className="divisor__rotulo divisor__rotulo--p">Premium</span></span>
      </div>

      <main id="topo" style={{ width: '100%' }}>

        {/* 1 · ABERTURA: as duas metades no primeiro olhar */}
        <section className="abertura" id="abertura" data-sc-act="flow" aria-label="Grátis e Premium lado a lado">
          <div className="split" style={{ position: 'relative' }}>
            <div className="lado claro">
              <a className="marca" href="#topo">Maply</a>
              <button type="button" className="entrar-cel so-celular" onClick={() => (user ? document.getElementById('planos')?.scrollIntoView() : abrirLogin())}>{user ? 'Minha conta' : 'Entrar'}</button>
              <h1>Hoje, {nomeTexto} é mais um pino no mapa.</h1>
              <div className="cena" aria-hidden="true">
                <div className="cena__chao" data-sc-parallax="-0.06"></div>
                <div className="cena__rua" style={{ top: '30%' }}></div>
                <span className="pino-outro" style={{ left: '12%', top: '18%' }}></span>
                <span className="pino-outro" style={{ left: '70%', top: '14%' }}></span>
                <span className="pino-outro" style={{ left: '38%', top: '62%' }}></span>
                <span className="pino-outro" style={{ left: '84%', top: '58%' }}></span>
                <span className="pino-outro" style={{ left: '20%', top: '78%' }}></span>
                <div className="voce" style={{ left: '50%', top: '40%', transform: 'translateX(-50%)' }} data-sc-parallax="-0.14">
                  <div className="voce__tag"><span>{nomeTexto}</span></div>
                  <div className="voce__haste"></div>
                  <div className="voce__ponto"></div>
                </div>
              </div>
            </div>
            <div className="lado escuro">
              <button type="button" className="entrar entrar-botao" onClick={() => (user ? document.getElementById('planos')?.scrollIntoView() : abrirLogin())}>{user ? 'Minha conta' : 'Já sou assinante'}</button>
              <p className="manchete">Com o Premium, é o primeiro que o cliente vê.</p>
              <div className="cena" aria-hidden="true">
                <div className="cena__chao" data-sc-parallax="-0.06"></div>
                <div className="cena__rua" style={{ top: '30%' }}></div>
                <span className="pino-outro" style={{ left: '12%', top: '18%' }}></span>
                <span className="pino-outro" style={{ left: '70%', top: '14%' }}></span>
                <span className="pino-outro" style={{ left: '38%', top: '72%' }}></span>
                <span className="pino-outro" style={{ left: '84%', top: '58%' }}></span>
                <div className="voce" style={{ left: '50%', top: '4%' }} data-sc-parallax="-0.3">
                  <div data-sc-tilt="7" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
                    <div className="voce__tag"><IconeDiamante cor="#C98A12" /><span>{nomeTexto}</span></div>
                    <div className="voce__haste"></div>
                    <div className="voce__ponto"></div>
                  </div>
                </div>
              </div>
            </div>
            <form className="ficha" onSubmit={(e) => { e.preventDefault(); document.getElementById('busca')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>
              <label htmlFor="nome-negocio">Como se chama o seu negócio?</label>
              <div className="ficha__linha">
                <input id="nome-negocio" name="nome" type="text" maxLength={36} autoComplete="organization" placeholder="Ex.: Elétrica Ponto Certo" value={nome} onChange={(e) => setNome(e.target.value)} />
                <select id="ramo" name="ramo" aria-label="Ramo do negócio" value={ramo} onChange={(e) => setRamo(e.target.value)}>
                  {RAMOS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <button className="botao botao--azul" type="submit">Ver na busca</button>
              </div>
            </form>
          </div>
        </section>

        {/* 2 · BUSCA: o pico. O nome do visitante sobe do 6º ao 1º, só no Premium */}
        <section className="ato--busca" id="busca" data-sc-act="pin" data-sc-span="2.8">
          <div data-sc-stage="" className="split">
            <div className="lado claro">
              <h2>A busca do cliente, hoje.</h2>
              <p className="texto">Você aparece, mas depois de quem chegou antes.</p>
              <div className="busca">
                <div className="busca__campo"><IconeBusca /><span>{ramo} perto de mim</span></div>
                <ol className="lista" aria-label="Resultados no plano grátis">
                  {OUTROS.map((o, i) => (
                    <li key={o.ini}><span className="pos">{i + 1}º</span><span className="ini">{o.ini}</span><span className="nome">{o.nome}</span><span className="meta">{o.km}</span></li>
                  ))}
                  <li className="eu"><span className="pos">6º</span><span className="ini">{inicial}</span><span className="nome">{nomeTexto}</span><span className="meta">1,0 km</span></li>
                </ol>
              </div>
              <p className="exemplo">Busca de exemplo.</p>
            </div>
            <div className="lado escuro">
              <h2>A mesma busca, com o Premium.</h2>
              <p className="texto">Prioridade máxima nas buscas e no &quot;Precisa para agora&quot;, com o Selo Diamante.</p>
              <p className="estado-busca so-celular" id="estado-busca" aria-live="polite">Sem Premium, você aparece em 6º.</p>
              <div className="busca">
                <div className="busca__campo"><IconeBusca /><span>{ramo} perto de mim</span></div>
                <ol className="lista lista--viva" id="lista-viva" aria-label="Resultados no Premium">
                  {OUTROS.map((o, i) => (
                    <li key={o.ini} data-k={i}><span className="pos">{i + 1}º</span><span className="ini">{o.ini}</span><span className="nome">{o.nome}</span><span className="meta">{o.km}</span></li>
                  ))}
                  <li className="eu" data-eu=""><span className="pos">6º</span><span className="ini">{inicial}</span><span className="nome">{nomeTexto}</span><span className="selo"><IconeDiamante tam={14} />Diamante</span></li>
                </ol>
              </div>
              <p className="exemplo">Busca de exemplo.</p>
            </div>
          </div>
        </section>

        {/* 3 · CONTATOS: um mês com 14 clientes novos, nas regras reais */}
        <section className="ato--contatos" data-sc-act="flow">
          <div className="split">
            <div className="lado claro">
              <h2>10 clientes novos grátis por mês. Depois, crédito.</h2>
              <p className="texto">Num mês com 14 clientes novos, do 11º em diante cada um custa 1 crédito.</p>
              <div className="pontos" data-sc-in="" data-sc-stagger="40" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => <span key={i} className={i < 10 ? 'ponto' : 'ponto ponto--credito'}>{i + 1}</span>)}
              </div>
              <p className="total"><span data-sc-count="0 4">4</span><small>créditos gastos</small></p>
              <p className="exemplo">Exemplo com 14 clientes no mês.</p>
            </div>
            <div className="lado escuro">
              <h2>Com o Premium, clientes novos sem limite.</h2>
              <p className="texto">Os mesmos 14 clientes, e nenhum crédito. Pode chegar o 15º, o 50º.</p>
              <div className="pontos" data-sc-in="" data-sc-stagger="40" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => <span key={i} className="ponto">{i + 1}</span>)}
              </div>
              <p className="total"><span data-sc-count="0 14">14</span><small>clientes, 0 créditos</small></p>
              <p className="exemplo">Exemplo com 14 clientes no mês.</p>
            </div>
          </div>
        </section>

        {/* 4 · INTELIGÊNCIA: o mapa de calor acende com a rolagem */}
        <section className="ato--inteligencia" data-sc-act="pin" data-sc-span="2">
          <div data-sc-stage="" className="split">
            <div className="lado claro">
              <h2>Você não sabe de onde vem o cliente.</h2>
              <p className="texto">No grátis, o mapa mostra só o seu pino.</p>
              <div className="mapinha" aria-hidden="true">
                <div className="cena__chao"></div>
                <span className="pino-outro" style={{ left: '46%', top: '44%' }}></span>
              </div>
            </div>
            <div className="lado escuro">
              <h2>Central de Inteligência.</h2>
              <p className="texto">Veja onde se concentram os clientes do seu ramo, quantos concorrentes há por perto e quem salvou o seu perfil.</p>
              <p className="estado-busca so-celular">No grátis, você não vê nada disso.</p>
              <div className="mapinha" role="img" aria-label="Mapa de calor de exemplo com três áreas de procura">
                <div className="cena__chao"></div>
                <span className="calor" style={{ left: '8%', top: '12%', width: '46%', height: '70%' }}></span>
                <span className="calor" style={{ left: '52%', top: '40%', width: '38%', height: '58%' }}></span>
                <span className="calor" style={{ left: '62%', top: '-6%', width: '26%', height: '40%' }}></span>
                <span className="pino-outro" style={{ left: '46%', top: '44%', background: '#0066FF', borderColor: '#FFFFFF' }}></span>
              </div>
              <ul className="salvos" aria-label="Quem salvou seu perfil, exemplo">
                <li data-sc-cue="0.3 1"><span>Cliente no Setor Bueno salvou seu perfil</span><span>há 2 h</span></li>
                <li data-sc-cue="0.44 1"><span>Cliente no Jardim Goiás salvou seu perfil</span><span>ontem</span></li>
                <li data-sc-cue="0.58 1"><span>4 concorrentes do seu ramo a até 2 km</span><span>hoje</span></li>
              </ul>
              <p className="exemplo">Dados de exemplo.</p>
            </div>
          </div>
        </section>

        {/* 5 · PERFIL: a faixa de anúncio é varrida */}
        <section className="ato--perfil" data-sc-act="flow">
          <div className="split">
            <div className="lado claro">
              <h2>No grátis, o anúncio aparece antes de você.</h2>
              <div className="perfil" aria-label="Perfil no plano grátis, exemplo">
                <div className="perfil__topo"><span className="ini">{inicial}</span><div style={{ minWidth: 0 }}><p className="perfil__nome">{nomeTexto}</p><p className="perfil__ramo">{ramo} · 1,0 km</p></div></div>
                <div className="anuncio">Publicidade</div>
                <span className="zap">WhatsApp</span>
              </div>
            </div>
            <div className="lado escuro">
              <h2>No Premium, o cliente vai direto para o seu WhatsApp.</h2>
              <div className="perfil" data-sc-reveal="up" data-sc-reveal-at="0.22 0.5" aria-label="Perfil no Premium, exemplo">
                <div className="perfil__topo"><span className="ini">{inicial}</span><div style={{ minWidth: 0 }}><p className="perfil__nome">{nomeTexto}</p><p className="perfil__ramo">{ramo} · 1,0 km · Selo Diamante</p></div></div>
                <p className="bolha">Olá! Vi {nomeTexto} no Maply e queria um orçamento.</p>
                <span className="zap"><IconeZap />Chamar no WhatsApp</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6 · COLAPSO: o divisor corre para a borda; o Premium fica com a tela */}
        <section className="ato--colapso" id="colapso" data-sc-act="pin" data-sc-span="1.6">
          <div data-sc-stage="" className="colapso">
            <div className="colapso__escuro escuro">
              <div className="bloco">
                <div data-sc-cue="0 1 0 0" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sc-5)' }}>
                  <h2>{nomeInicio} no topo do mapa.</h2>
                  <p className="texto" style={{ margin: 0, maxWidth: '46ch' }}>Primeiro nas buscas, clientes novos sem limite, a inteligência do bairro e o cliente direto no seu WhatsApp.</p>
                  <a className="botao botao--claro" href="#planos" style={{ alignSelf: 'flex-start' }}>Ver planos</a>
                </div>
              </div>
            </div>
            <div className="colapso__claro claro" aria-hidden="true">
              <div className="bloco"><p className="texto" style={{ fontSize: 'var(--sc-t-lg)' }}>O grátis continua no mapa. Só não chega primeiro.</p></div>
            </div>
          </div>
        </section>

        {/* 7 · PLANOS: a coluna vencedora, agora a tela inteira */}
        <section className="planos escuro" id="planos" data-sc-act="flow">
          <div className="miolo">

            {user && (
              <div className={`situacao${isPremium ? ' situacao--premium' : ''}`} role="status">
                <div>
                  {isPremium ? (
                    <>
                      <h3>Você é Premium{tipoPlano && NOME_PLANO[tipoPlano] ? ` · ${NOME_PLANO[tipoPlano]}` : ''}</h3>
                      <p>
                        {tipoPlano === 'mensal' && 'Renova sozinho todo mês. Você pode cancelar quando quiser.'}
                        {tipoPlano === 'mensal_cancelado' && `Renovação cancelada. Você continua Premium${expiraEm ? ` até ${formatarData(expiraEm)}` : ' até o fim do mês já pago'}.`}
                        {(tipoPlano === 'anual' || tipoPlano === 'fundador') && `Pagamento único, sem renovação automática.${expiraEm ? ` Válido até ${formatarData(expiraEm)}.` : ''}`}
                        {!tipoPlano && 'Sua assinatura foi feita pelo app. Para gerenciar ou cancelar, use a loja do celular: no iPhone, Ajustes › seu nome › Assinaturas; no Android, Play Store › Pagamentos e assinaturas.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>{isPrestador ? 'Seu perfil está no plano grátis' : 'Os planos são para prestadores'}</h3>
                      <p>{isPrestador ? 'Escolha um plano abaixo para subir na busca.' : 'Cadastre seu negócio no app Maply e volte aqui com a mesma conta para assinar.'}</p>
                    </>
                  )}
                  <p className="conta">Conectado como {user.email}</p>
                </div>
                <div className="situacao__acoes">
                  {isPremium && tipoPlano === 'mensal' && (
                    <button type="button" className="botao botao--cancelar" onClick={cancelarRenovacao} disabled={processando === 'cancelar'}>
                      {processando === 'cancelar' ? 'Cancelando...' : 'Cancelar renovação'}
                    </button>
                  )}
                  <button type="button" className="botao botao--sair" onClick={sair}>Sair</button>
                </div>
              </div>
            )}

            {aviso && <p className={`mensagem mensagem--${aviso.tipo}`} role="alert" style={{ marginBottom: 'var(--sc-5)' }}>{aviso.texto}</p>}

            <div className="planos__topo" data-sc-in="">
              <h2>Escolha como subir.</h2>
              <div className="alternar" role="group" aria-label="Cobrança do plano Elite">
                <button type="button" aria-pressed={periodo === 'mensal'} onClick={() => setPeriodo('mensal')}>Mensal</button>
                <button type="button" aria-pressed={periodo === 'anual'} onClick={() => setPeriodo('anual')}>Anual</button>
              </div>
            </div>

            <div className="planos__grade" data-sc-in="" data-sc-stagger="70" style={mostrarFundador ? undefined : { gridTemplateColumns: 'minmax(0, 1fr)' }}>
              <article className="plano plano--elite" aria-labelledby="t-elite">
                <h3 id="t-elite">Elite {periodo}</h3>
                <p className="preco"><b>{elite.preco}</b><span>{elite.unidade}</span></p>
                <p className="ganho">{elite.ganho}</p>
                <p className="regra">{elite.regra}</p>
                <ul>
                  {['Prioridade máxima nas buscas e no "Precisa para agora"', 'Clientes novos sem limite, sem gastar créditos', 'Selo Diamante e destaque nas listas', 'Central de Inteligência e quem salvou seu perfil', 'Perfil sem propaganda, direto no seu WhatsApp', 'Card personalizado e suporte VIP no WhatsApp'].map((b) => (
                    <li key={b}><IconeCheck cor="#0052CC" />{b}</li>
                  ))}
                </ul>
                <button type="button" className="botao botao--azul" onClick={() => assinar(elite.plano)} disabled={processando !== null || isPremium}>
                  {isPremium ? 'Você já é Premium' : processando === elite.plano ? 'Abrindo pagamento...' : 'Assinar o Elite'}
                </button>
                <p className="para">para {nomeTexto}</p>
              </article>

              {mostrarFundador && (
                <article className="plano plano--fundador" aria-labelledby="t-fundador">
                  <h3 id="t-fundador">Fundador</h3>
                  <p className="preco"><b>R$ 149,99</b><span>por 2 anos</span></p>
                  <p className="ganho">Equivale a R$ 6,25 por mês.</p>
                  <p className="regra">Tudo do Elite por 24 meses, com um pagamento só, no Pix ou no cartão. Lote de lançamento: {textoVagas}.</p>
                  <ul>
                    {['Todos os benefícios do Elite', 'Sem mensalidade', 'Não renova sozinho'].map((b) => (
                      <li key={b}><IconeCheck cor="#F5B83D" />{b}</li>
                    ))}
                  </ul>
                  <button type="button" className="botao botao--ouro" onClick={() => assinar('Plano Fundador')} disabled={processando !== null || isPremium}>
                    {isPremium ? 'Você já é Premium' : processando === 'Plano Fundador' ? 'Abrindo pagamento...' : 'Garantir vaga de Fundador'}
                  </button>
                  <p className="para">para {nomeTexto}</p>
                </article>
              )}
            </div>

            <p className="aviso">
              Pagamento pelo Mercado Pago, com Pix ou cartão. Já assina pelo app? O Premium é da sua conta e vale aqui também{user ? '.' : <>: <a href="#planos" onClick={(e) => { e.preventDefault(); abrirLogin(); }}>entrar</a>.</>}
            </p>

            <div className="duvidas">
              <h2>Dúvidas</h2>
              <div>
                {[
                  ['Como eu cancelo?', 'No mensal, entre com sua conta aqui e toque em Cancelar renovação. Nada mais é cobrado e você continua Premium até o fim do mês já pago. Se assinou pelo app, o cancelamento é feito na loja do celular.'],
                  ['O anual renova sozinho?', 'Não. O anual e o Fundador são pagos uma vez só. Três dias antes de vencer, avisamos você no app.'],
                  ['Posso pagar com Pix?', 'Sim, no anual e no Fundador, que são pagamento único. O mensal é cobrado no cartão todo mês, de forma automática. O pagamento é feito no Mercado Pago e o Maply não vê os dados do seu cartão.'],
                  ['Quem pode assinar?', 'Prestadores de serviço e negócios cadastrados no app Maply. Crie seu perfil de prestador no app e entre aqui com a mesma conta.'],
                  ['Quando o Premium começa a valer?', 'Assim que o Mercado Pago confirmar o pagamento: no cartão e no Pix, normalmente em poucos minutos. Os benefícios aparecem no app.'],
                  ['E quando o plano acaba?', 'Seu perfil volta para o grátis: continua no mapa, com 10 clientes novos grátis por mês. Nada do seu perfil é apagado.'],
                ].map(([q, a]) => (
                  <details key={q}><summary>{q}<IconeMais /></summary><p>{a}</p></details>
                ))}
                <details>
                  <summary>Preciso de ajuda. Com quem falo?<IconeMais /></summary>
                  <p>Fale com o suporte do Maply no WhatsApp: <a className="suporte" href={WHATSAPP_SUPORTE} target="_blank" rel="noopener noreferrer">{WHATSAPP_TEXTO}</a>.</p>
                </details>
              </div>
            </div>

            <footer className="rodape">
              <span className="marca-rodape">Maply</span>
              <a className="suporte" href={WHATSAPP_SUPORTE} target="_blank" rel="noopener noreferrer"><IconeZap />Suporte: {WHATSAPP_TEXTO}</a>
              <a href={TERMOS} target="_blank" rel="noopener noreferrer">Termos de uso e privacidade</a>
              <span>Pagamentos processados pelo Mercado Pago.</span>
              <span>© 2026 Maply</span>
            </footer>
          </div>
        </section>
      </main>

      {/* LOGIN: mesma conta do app */}
      <dialog ref={dialogo} className="login" aria-labelledby="login-titulo" onClick={(e) => { if (e.target === dialogo.current) dialogo.current?.close(); }}>
        <div className="login__corpo">
          <div className="login__topo">
            <div>
              <h2 id="login-titulo">Entrar no Maply</h2>
              <p>{motivoLogin}</p>
            </div>
            <button type="button" className="login__fechar" aria-label="Fechar" onClick={() => dialogo.current?.close()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <form onSubmit={entrarComSenha} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label htmlFor="login-email">E-mail</label>
              <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <label htmlFor="login-senha">Senha</label>
              <div className="login__senha">
                <input id="login-senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
                <button type="button" className="login__ver" onClick={() => setMostrarSenha(!mostrarSenha)} aria-pressed={mostrarSenha}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </div>
            {msgLogin && <p className={`mensagem mensagem--${msgLogin.tipo}`} role="alert">{msgLogin.texto}</p>}
            <button className="botao botao--azul" type="submit" disabled={entrando}>{entrando ? 'Entrando...' : 'Entrar'}</button>
            <button className="botao botao--fantasma" type="button" onClick={entrarComLink} disabled={entrando}>Receber link de acesso no e-mail</button>
          </form>
          <p className="login__ou">ou</p>
          <button type="button" className="botao botao--branco" onClick={() => entrarCom('google')} disabled={entrando}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 10 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com o Google
          </button>
          <button type="button" className="botao botao--preto" onClick={() => entrarCom('apple')} disabled={entrando}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: 10 }}>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.17 2.31-.93 3.57-.84 1.51.15 2.65.72 3.4 1.8-3.04 1.75-2.5 5.92.51 7.14-.65 1.55-1.57 3-2.56 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continuar com a Apple
          </button>
          <p style={{ fontSize: '0.85rem' }}>Ainda não tem conta? Crie pelo app Maply.</p>
        </div>
      </dialog>
    </>
  );
}
