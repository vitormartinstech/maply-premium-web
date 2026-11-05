import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pagamento | Maply',
  robots: { index: false },
};

// Para onde o Mercado Pago devolve o cliente depois do checkout (ver app/api/checkout).
// Quem liga o Premium é o webhook, não esta página: aqui só explicamos o que acontece agora.
const RESULTADOS = {
  sucesso: {
    icone: '🎉',
    cor: 'bg-emerald-50 text-emerald-600',
    titulo: 'Pagamento aprovado!',
    texto: 'Seu Premium será ativado em instantes. Abra o app Maply para aproveitar os benefícios. Se ainda aparecer o plano grátis, feche e abra o app de novo.',
  },
  assinatura: {
    icone: '💎',
    cor: 'bg-blue-50 text-[#0066FF]',
    titulo: 'Assinatura registrada!',
    texto: 'Assim que o Mercado Pago confirmar a primeira cobrança, seu Premium é ativado automaticamente. Isso costuma levar poucos minutos.',
  },
  pendente: {
    icone: '⏳',
    cor: 'bg-amber-50 text-amber-600',
    titulo: 'Pagamento em análise',
    texto: 'Pagamentos por PIX ou boleto podem levar um pouco para serem confirmados. Assim que o Mercado Pago aprovar, seu Premium é ativado automaticamente. Não precisa pagar de novo.',
  },
  erro: {
    icone: '⚠️',
    cor: 'bg-red-50 text-red-600',
    titulo: 'Pagamento não concluído',
    texto: 'Nenhum valor foi cobrado. Você pode tentar de novo com outra forma de pagamento.',
  },
} as const;

type Resultado = keyof typeof RESULTADOS;

export default async function PaginaPagamento({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const { resultado } = await searchParams;
  const chave: Resultado = resultado && resultado in RESULTADOS ? (resultado as Resultado) : 'pendente';
  const info = RESULTADOS[chave];

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center px-4 py-12 font-sans">
      <h1 className="text-4xl font-bold text-[#0066FF] mb-8 tracking-tight">Maply</h1>

      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl ${info.cor}`}>
          {info.icone}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-5">{info.titulo}</h2>
        <p className="text-gray-600 mt-3 leading-relaxed">{info.texto}</p>

        <Link
          href="/"
          className="block w-full bg-[#0066FF] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-8"
        >
          {chave === 'erro' ? 'Tentar novamente' : 'Ver meu plano'}
        </Link>
      </div>

      <p className="text-gray-400 text-xs mt-6">Pagamento processado com segurança pelo Mercado Pago</p>
    </div>
  );
}
