import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { supabaseAdmin as supabase, usuarioLogado } from '../_lib/seguranca';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });

// Cancela só a cobrança automática do plano mensal comprado no site.
// O Premium continua até a data já paga; quem tira o Premium depois é a rotina diária
// do banco (expirar_premium_vencido). Anual e Fundador são pagamento único: não há o
// que cancelar. Assinaturas feitas pelo app são canceladas na loja (Apple/Google).
export async function POST(request: Request) {
  try {
    const user = await usuarioLogado(request);
    if (!user) return NextResponse.json({ error: 'Faça login para cancelar' }, { status: 401 });

    const { data: perfil, error: erroPerfil } = await supabase
      .from('profiles')
      .select('tipo_plano, data_expiracao_premium')
      .eq('id', user.id)
      .single();
    if (erroPerfil) throw erroPerfil;

    if (perfil?.tipo_plano !== 'mensal') {
      return NextResponse.json({ error: 'Não há cobrança mensal ativa para cancelar' }, { status: 400 });
    }

    // Procura a assinatura com débito automático ativa e manda cancelar no Mercado Pago
    if (user.email) {
      const preApproval = new PreApproval(client);
      const busca = await preApproval.search({
        options: { payer_email: user.email, status: 'authorized' }
      });

      for (const assinatura of busca.results ?? []) {
        const referencia = assinatura.external_reference ? String(assinatura.external_reference) : '';
        const ehDesteUsuario = !referencia || referencia === user.id;
        if (assinatura.id && ehDesteUsuario) {
          await preApproval.update({ id: assinatura.id, body: { status: 'cancelled' } });
          console.log(`Cobrança automática cancelada no MP para a assinatura ${assinatura.id}`);
        }
      }
    }

    // Marca como cancelada, mas mantém o Premium e a data de vencimento
    const { error } = await supabase
      .from('profiles')
      .update({ tipo_plano: 'mensal_cancelado' })
      .eq('id', user.id);
    if (error) throw error;

    return NextResponse.json({ sucesso: true, ativoAte: perfil.data_expiracao_premium });

  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json({ error: 'Falha ao processar cancelamento' }, { status: 500 });
  }
}
