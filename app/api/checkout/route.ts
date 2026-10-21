import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';
import { PLANOS, usuarioLogado } from '../_lib/seguranca';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });

export async function POST(request: Request) {
  try {
    // Quem está comprando vem do login conferido, nunca do que o navegador diz
    const user = await usuarioLogado(request);
    if (!user) return NextResponse.json({ error: 'Faça login para assinar' }, { status: 401 });

    const { plano } = await request.json();

    // O preço vem da tabela do servidor (o navegador só informa o nome do plano)
    const planoEscolhido = PLANOS[plano];
    if (!planoEscolhido) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });

    const planIdInterno = planoEscolhido.id;
    const userId = user.id;

    // 1. SE FOR O PLANO MENSAL -> GERA ASSINATURA (DÉBITO AUTOMÁTICO)
    if (planIdInterno === 'mensal') {
      const preApproval = new PreApproval(client);
      const resposta = await preApproval.create({
        body: {
          reason: plano,
          external_reference: userId,
          payer_email: user.email as string,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: planoEscolhido.preco,
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
              title: plano,
              quantity: 1,
              unit_price: planoEscolhido.preco,
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