import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

      if (detalhesDoPagamento.status === 'approved') {
        const userId = detalhesDoPagamento.external_reference;
        
        // Pagamentos únicos têm 'items'. Assinaturas (PreApproval) vêm sem essa lista.
        const itensComprados = detalhesDoPagamento.additional_info?.items;
        
        // Se tiver itens, pega a etiqueta (anual ou fundador). Se for nulo/vazio, é a assinatura mensal recorrente!
        const planoCompradoId = (itensComprados && itensComprados.length > 0) 
          ? itensComprados[0].id 
          : 'mensal';

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
    }
    
    return NextResponse.json({ recebido: true }, { status: 200 });

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ error: 'Falha no processamento' }, { status: 500 });
  }
}