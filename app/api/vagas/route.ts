import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../_lib/seguranca';

// Vagas do Lote Fundador por estado. Mesma regra do app (planos-assinatura.tsx):
// conta todos os prestadores Premium do estado, venham do site ou da loja,
// para o site e o app mostrarem o mesmo número.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'GO';

    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_premium', true)
      .eq('estado', estado);

    if (error) throw error;

    return NextResponse.json({ vagasOcupadas: count || 0 });

  } catch (error) {
    console.error("Erro ao contar vagas:", error);
    return NextResponse.json({ vagasOcupadas: 0 }); // Em caso de erro, não bloqueia a tela
  }
}
