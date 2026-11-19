import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabaseAdmin as supabase, PRECO_POR_ID } from '../_lib/seguranca';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    
    // O Mercado Pago pode enviar o ID de duas formas dependendo se é PIX ou Assinatura: "data.id" ou "id"
    const idPagamento = url.searchParams.get('data.id') || url.searchParams.get('id');
    const tipoAviso = url.searchParams.get('type') || url.searchParams.get('topic');

    // Escutamos os eventos de PAGAMENTO (seja avulso ou a renovação automática da assinatura)
    if (tipoAviso === 'payment' && idPagamento) {
      const payment = new Payment(client);
      const detalhesDoPagamento = await payment.get({ id: idPagamento });
      
      // Pegamos o ID do usuário que guardamos na referência externa na hora da compra
      const userId = detalhesDoPagamento.external_reference;

      // CENÁRIO 1: PAGAMENTO APROVADO (Sua lógica original)
      if (detalhesDoPagamento.status === 'approved') {
        
        // Pagamentos únicos têm 'items'. Assinaturas (PreApproval) vêm sem essa lista.
        const itensComprados = detalhesDoPagamento.additional_info?.items;
        
        // Se tiver itens, pega a etiqueta (anual ou fundador). Se for nulo/vazio, é a assinatura mensal recorrente!
        const planoCompradoId = (itensComprados && itensComprados.length > 0) 
          ? itensComprados[0].id 
          : 'mensal';

        // Segunda trava: só libera o Premium se o valor pago cobrir o preço oficial do plano
        const precoOficial = PRECO_POR_ID[planoCompradoId as string];
        const valorPago = detalhesDoPagamento.transaction_amount ?? 0;
        if (!precoOficial || valorPago < precoOficial - 0.01) {
          console.warn(`Pagamento ${idPagamento} ignorado: plano "${planoCompradoId}", pago R$ ${valorPago}, esperado R$ ${precoOficial}`);
          return NextResponse.json({ recebido: true }, { status: 200 });
        }

        // Motor de tempo
        let mesesParaAdicionar = 1; // Mensal (Débito automático renova por +30 dias a cada cobrança)
        if (planoCompradoId === 'fundador') mesesParaAdicionar = 24; 
        if (planoCompradoId === 'anual') mesesParaAdicionar = 12; 

        // Calcula a nova data de expiração com base no dia do pagamento
        const dataExpiracao = new Date();
        dataExpiracao.setMonth(dataExpiracao.getMonth() + mesesParaAdicionar);

        if (userId) {
          const { error } = await supabase
            .from('profiles')
            .update({ 
              is_premium: true, 
              tipo_plano: planoCompradoId, 
              data_expiracao_premium: dataExpiracao.toISOString() 
            })
            .eq('id', userId);

          if (error) throw error;
          console.log(`Sucesso: Pagamento processado para o usuário ${userId}. Plano: ${planoCompradoId}`);
        }
      } 
      
      // CENÁRIO 2: DINHEIRO DEVOLVIDO (reembolso ou estorno no cartão)
      // Só isso tira o Premium. Pagamento recusado, cancelado ou Pix vencido nunca ligou nada,
      // então não desliga nada: a pessoa pode ter gerado um Pix, desistido e pago no cartão.
      // E só mexe em Premium comprado no site (tipo_plano preenchido); o da loja é do RevenueCat.
      else if (['refunded', 'charged_back'].includes(detalhesDoPagamento.status || '')) {
        if (userId) {
          const { data: removidos, error } = await supabase
            .from('profiles')
            .update({
              is_premium: false,
              tipo_plano: null,
              data_expiracao_premium: null
            })
            .eq('id', userId)
            .not('tipo_plano', 'is', null)
            .select('id');

          if (error) throw error;
          if (removidos?.length) {
            console.log(`Atenção: Premium removido do usuário ${userId}. Motivo: pagamento ${idPagamento} ${detalhesDoPagamento.status}`);
          }
        }
      }
    }
    
    return NextResponse.json({ recebido: true }, { status: 200 });

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ error: 'Falha no processamento' }, { status: 500 });
  }
}