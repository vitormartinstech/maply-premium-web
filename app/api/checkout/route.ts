import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, plano, preco } = body;

    if (!userId) return NextResponse.json({ error: 'Usuário não identificado' }, { status: 400 });

    let planIdInterno = 'mensal';
    if (plano.includes('Fundador')) planIdInterno = 'fundador';
    else if (plano.includes('Anual')) planIdInterno = 'anual';

    // 1. SE FOR O PLANO MENSAL -> GERA ASSINATURA (DÉBITO AUTOMÁTICO)
    if (plano.includes('Mensal')) {
      const preApproval = new PreApproval(client);
      const resposta = await preApproval.create({
        body: {
          reason: plano || 'Maply Premium - Assinatura Mensal',
          external_reference: userId,
          payer_email: userEmail || 'email@teste.com',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: Number(preco) || 29.99,
            currency_id: 'BRL'
          },
          back_url: 'https://maply.com.br/sucesso',
          status: 'pending'
        }
      });
      return NextResponse.json({ init_point: resposta.init_point });
    } 
    
    // 2. SE FOR FUNDADOR OU ANUAL -> GERA PAGAMENTO ÚNICO
    else {
      const preference = new Preference(client);
      const resposta = await preference.create({
        body: {
          items: [
            {
              id: planIdInterno,
              title: plano || 'Maply Premium',
              quantity: 1,
              unit_price: Number(preco),
              currency_id: 'BRL',
            }
          ],
          external_reference: userId,
          back_urls: {
            success: 'https://maply.com.br/sucesso',
            failure: 'https://maply.com.br/erro',
            pending: 'https://maply.com.br/pendente'
          },
          auto_return: 'approved',
          // Lembre-se de trocar pela URL oficial da Vercel depois
          // notification_url: 'https://sua-url-na-vercel.com/api/webhook'
        }
      });
      return NextResponse.json({ init_point: resposta.init_point });
    }

  } catch (error) {
    console.error("Erro no checkout:", error);
    return NextResponse.json({ error: 'Falha ao processar o checkout' }, { status: 500 });
  }
}