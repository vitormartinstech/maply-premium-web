'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const premiumFeatures = [
  'Contatos Ilimitados (Sem teto de 10 leads/mês)',
  'Prioridade Máxima nas buscas e "Precisa para agora"',
  'Selo Diamante e destaques visuais nas listas',
  'Central de Inteligência (Heatmap e Concorrência)',
  'Monitor de Favoritos (Descubra quem te salvou)',
  'Suporte VIP priorizado via WhatsApp',
  'Remova as propagandas do seu perfil',
  'Direito ao card personalizado'
];

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(true); 

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [vagasOcupadas, setVagasOcupadas] = useState(0);
  const [estadoUsuario, setEstadoUsuario] = useState('GO');
  const limiteVagas = 50;
  
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      async function carregarDadosDoUsuario() {
        const { data } = await supabase.from('profiles').select('estado').eq('id', user.id).single();
        const uf = data?.estado || 'GO';
        setEstadoUsuario(uf);

        try {
          const response = await fetch(`/api/vagas?estado=${uf}`);
          const resData = await response.json();
          setVagasOcupadas(resData.vagasOcupadas);
        } catch (error) {
          console.error("Erro ao buscar vagas");
        }
      }
      carregarDadosDoUsuario();
    }
  }, [user]);

  // LOGIN POR EMAIL/SENHA
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: senhaLogin });
    if (error) alert("E-mail ou senha incorretos.");
    setLoadingAuth(false);
  };

  // LOGIN COM GOOGLE
  const handleGoogleLogin = async () => {
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert("Erro ao conectar com o Google.");
    setLoadingAuth(false);
  };

  // LOGIN COM APPLE
  const handleAppleLogin = async () => {
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert("Erro ao conectar com a Apple.");
    setLoadingAuth(false);
  };

  // LINK MÁGICO (SALVA-VIDAS)
  const handleMagicLink = async () => {
    if (!emailLogin.trim()) {
      alert("Por favor, digite seu e-mail no campo acima primeiro.");
      return;
    }
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: emailLogin,
      options: { emailRedirectTo: window.location.origin }
    });
    
    if (error) {
      alert("Erro ao enviar o link. Verifique o e-mail digitado.");
    } else {
      alert("Enviamos um Link Mágico para o seu e-mail! Clique nele para entrar sem senha.");
    }
    setLoadingAuth(false);
  };

  const handleSubscribe = async (planName: string, preco: number) => {
    setProcessingPlan(planName);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planName, preco: preco, userId: user.id, userEmail: user.email })
      });

      const data = await response.json();
      if (data.init_point) window.location.href = data.init_point; 
      else alert("Erro ao gerar link de pagamento.");
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuAberto(false);
  };

  const mostrarPlanoFundador = vagasOcupadas < limiteVagas;

  const CheckIcon = ({ color }: { color: string }) => (
    <svg className={`w-5 h-5 flex-shrink-0 ${color}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  const MinusIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // --- TELA DE CARREGAMENTO ---
  if (loadingAuth && !user) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- TELA DE LOGIN MAPLY CLARA ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center px-4 font-sans py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0066FF]">Maply</h1>
            <p className="text-gray-500 mt-2 text-sm">Faça login com sua conta profissional para assinar o Premium.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail Profissional</label>
              <input 
                type="email" 
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#0066FF] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Senha</label>
              </div>
              <input 
                type="password" 
                value={senhaLogin}
                onChange={(e) => setSenhaLogin(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#0066FF] transition-colors"
                placeholder="••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loadingAuth}
              className="w-full bg-[#0066FF] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              {loadingAuth ? 'Entrando...' : 'Entrar na Conta'}
            </button>
            
            <button 
              type="button" 
              onClick={handleMagicLink}
              disabled={loadingAuth}
              className="w-full bg-white text-[#0066FF] font-bold py-3.5 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors"
            >
              Receber Link Mágico (Sem Senha)
            </button>

          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-xs font-bold text-gray-400">OU</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleGoogleLogin}
              disabled={loadingAuth}
              className="w-full bg-white border border-gray-200 text-gray-800 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com o Google
            </button>

            <button 
              onClick={handleAppleLogin}
              disabled={loadingAuth}
              className="w-full bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.17 2.31-.93 3.57-.84 1.51.15 2.65.72 3.4 1.8-3.04 1.75-2.5 5.92.51 7.14-.65 1.55-1.57 3-2.56 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continuar com a Apple
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA DE PLANOS MAPLY (ESTRUTURA HORIZONTAL) ---
  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans selection:bg-[#0066FF] selection:text-white pb-16">
      
      {/* HEADER FIXO - GRADIENTE MAPLY */}
      <header className="bg-gradient-to-r from-[#0066FF] to-[#0052CC] py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold tracking-tighter text-white">Maply</h1>
          <nav className="hidden md:flex gap-6 font-bold text-sm text-blue-100">
            <a href="#" className="text-white transition-colors">Planos de Crescimento</a>
          </nav>
        </div>

        <div className="relative">
          <button 
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full p-1 pr-3 transition-colors border border-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-[#0066FF]">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-bold text-sm text-white hidden sm:block">Perfil</span>
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 16 16"><path d="M14 6l-6 6-6-6h12z"></path></svg>
          </button>

          {/* DROPDOWN CLARO (ESTILO MAPLY) */}
          {menuAberto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Conectado como</p>
                <p className="text-sm font-bold truncate text-gray-900">{user.email}</p>
              </div>
              <div className="py-1">
                 <button 
                   onClick={handleLogout}
                   className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                 >
                   Sair da Conta
                 </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-[1200px] mx-auto px-4 pt-12">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Evolua o seu negócio</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Escolha como deseja aparecer para os seus futuros clientes em {estadoUsuario} e destrave o seu potencial.</p>
        </div>

        <div className="flex flex-col lg:flex-row flex-wrap justify-center gap-6 items-stretch">
          
          {/* CARD FUNDADOR */}
          {mostrarPlanoFundador && (
            <div className="bg-gradient-to-b from-[#3B0764] to-[#1E1B4B] border border-amber-500/40 rounded-3xl p-6 flex flex-col w-full lg:max-w-[360px] shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-center bg-amber-500/15 border border-amber-500/40 py-1.5 px-3 rounded-xl mb-6 w-max">
                <span className="text-[11px] font-bold text-[#FCD34D] uppercase tracking-wider">
                  Lote • {vagasOcupadas} de {limiteVagas} vagas em {estadoUsuario}
                </span>
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#FCD34D] font-bold text-xs tracking-widest">🚀 PLANO FUNDADOR</p>
                  <h3 className="text-white font-bold text-2xl mt-1">Elite 2 Anos</h3>
                </div>
                <span className="text-3xl">👑</span>
              </div>

              <div className="flex items-baseline mt-5">
                <span className="text-[#FCD34D] font-bold text-xl mr-1">R$</span>
                <span className="text-white font-bold text-4xl">149,99</span>
                <span className="text-slate-400 text-base ml-1">/2 anos</span>
              </div>

              <div className="h-px bg-white/10 my-6" />
              
              <ul className="space-y-3 mb-8 flex-1">
                {premiumFeatures.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckIcon color="text-[#FCD34D]" />
                    <span className="text-slate-300 text-sm leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleSubscribe('Plano Fundador', 149.99)}
                disabled={processingPlan !== null}
                className="w-full bg-[#FCD34D] hover:bg-amber-300 text-[#3B0764] font-bold py-4 rounded-2xl transition-all shadow-lg mt-auto"
              >
                {processingPlan === 'Plano Fundador' ? 'Processando...' : 'Garantir Minha Vaga'}
              </button>
            </div>
          )}

          {/* CARD ELITE ANUAL */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 flex flex-col w-full lg:max-w-[360px] shadow-2xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
              Melhor Custo-Benefício
            </div>

            <div className="flex justify-between items-start mt-4">
              <div>
                <p className="text-[#F59E0B] font-bold text-xs tracking-widest">💎 PLANO ELITE</p>
                <h3 className="text-white font-bold text-2xl mt-1">Anual</h3>
              </div>
              <span className="text-3xl">💎</span>
            </div>

            <div className="flex items-baseline mt-5">
              <span className="text-[#F59E0B] font-bold text-xl mr-1">R$</span>
              <span className="text-white font-bold text-4xl">282,50</span>
              <span className="text-slate-400 text-base ml-1">/ano</span>
            </div>
            
            <p className="text-xs mt-1 text-emerald-400 font-bold">Economia de R$ 77,38 ao ano</p>

            <div className="h-px bg-white/10 my-6" />
            
            <ul className="space-y-3 mb-8 flex-1">
              {premiumFeatures.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon color="text-[#F59E0B]" />
                  <span className="text-slate-300 text-sm leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => handleSubscribe('Plano Elite Anual', 282.50)}
              disabled={processingPlan !== null}
              className="w-full bg-[#F59E0B] hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-2xl transition-all shadow-lg mt-auto"
            >
               {processingPlan === 'Plano Elite Anual' ? 'Processando...' : 'Assinar Elite Anual'}
            </button>
          </div>

          {/* CARD ELITE MENSAL */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 flex flex-col w-full lg:max-w-[360px] shadow-2xl">
            <div className="flex justify-between items-start mt-4">
              <div>
                <p className="text-[#F59E0B] font-bold text-xs tracking-widest">💎 PLANO ELITE</p>
                <h3 className="text-white font-bold text-2xl mt-1">Mensal</h3>
              </div>
            </div>

            <div className="flex items-baseline mt-5">
              <span className="text-[#F59E0B] font-bold text-xl mr-1">R$</span>
              <span className="text-white font-bold text-4xl">29,99</span>
              <span className="text-slate-400 text-base ml-1">/mês</span>
            </div>
            
            <p className="text-xs mt-1 text-slate-400">cobrado a cada 30 dias</p>

            <div className="h-px bg-white/10 my-6" />
            
            <ul className="space-y-3 mb-8 flex-1">
              {premiumFeatures.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon color="text-[#F59E0B]" />
                  <span className="text-slate-300 text-sm leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => handleSubscribe('Plano Elite Mensal', 29.99)}
              disabled={processingPlan !== null}
              className="w-full bg-[#F59E0B] hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-2xl transition-all shadow-lg mt-auto"
            >
               {processingPlan === 'Plano Elite Mensal' ? 'Processando...' : 'Assinar Elite Mensal'}
            </button>
          </div>

        </div>

        {/* PLANO GRATUITO */}
        <div className="mt-8 mx-auto max-w-3xl bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1">
            <h3 className="text-gray-900 font-bold text-xl">Plano Gratuito</h3>
            <div className="mt-1 mb-6">
              <span className="text-gray-900 font-bold text-3xl">R$ 0,00</span>
              <span className="text-gray-500 text-sm font-medium"> /sempre</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              <div className="flex items-start gap-3"><CheckIcon color="text-emerald-500" /><span className="text-gray-600 text-sm">Até 10 contatos de clientes</span></div>
              <div className="flex items-start gap-3"><CheckIcon color="text-emerald-500" /><span className="text-gray-600 text-sm">Cadastro simples no mapa</span></div>
              <div className="flex items-start gap-3"><MinusIcon /><span className="text-gray-400 text-sm">Visibilidade nas Buscas</span></div>
              <div className="flex items-start gap-3"><MinusIcon /><span className="text-gray-400 text-sm">Central de Inteligência</span></div>
            </div>
          </div>
          <div className="w-full md:w-auto">
             <div className="w-full md:w-48 bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-center text-sm border border-gray-200">
               Plano Padrão Atual
             </div>
          </div>
        </div>

        {/* SELOS DE SEGURANÇA */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            🔒 <span className="mt-0.5">Pagamento 100% Seguro via Mercado Pago</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            ✅ <span className="mt-0.5">Cancele a qualquer momento sem taxas</span>
          </div>
        </div>

      </main>
    </div>
  );
} 