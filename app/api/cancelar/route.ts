import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { supabaseAdmin as supabase, usuarioLogado } from '../_lib/seguranca';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });

export async function POST(request: Request) {
  try {
    // Só o próprio usuário logado pode cancelar a assinatura dele
    const user = await usuarioLogado(request);
    if (!user) return NextResponse.json({ error: 'Faça login para cancelar' }, { status: 401 });

    const userId = user.id;
    const userEmail = user.email;

    // 1. PROCURA E CANCELA A ASSINATURA NO MERCADO PAGO
    if (userEmail) {
      const preApproval = new PreApproval(client);
      
      // Busca se o usuário tem alguma assinatura com débito automático ativa
      const busca = await preApproval.search({ 
        options: { payer_email: userEmail, status: 'authorized' } 
      });

      // Se encontrar a assinatura rolando no cartão, envia o comando de cancelamento
      if (busca.results && busca.results.length > 0) {
        for (const assinatura of busca.results) {
          if (assinatura.id) {
            await preApproval.update({ 
              id: assinatura.id, 
              body: { status: 'cancelled' } 
            });
            console.log(`Cobrança automática cancelada no MP para a assinatura ${assinatura.id}`);
          }
        }
      }
    }

    // 2. REMOVE O PREMIUM NO SUPABASE
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: false, 
        tipo_plano: null, 
        data_expiracao_premium: null 
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ sucesso: true, mensagem: 'Assinatura cancelada com sucesso' });

  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json({ error: 'Falha ao processar cancelamento' }, { status: 500 });
  }
}