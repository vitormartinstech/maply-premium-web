import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Pega a sigla do estado que vai vir na URL (ex: ?estado=GO)
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'GO'; // Se não vier nada, assume GO por padrão

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Vai na tabela profiles e conta quantos usuários daquele estado têm o plano fundador
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_plano', 'fundador')
      .eq('estado', estado); // Certifique-se de que a coluna de estado no seu banco se chama 'estado'

    if (error) throw error;

    return NextResponse.json({ vagasOcupadas: count || 0 });
    
  } catch (error) {
    console.error("Erro ao contar vagas:", error);
    return NextResponse.json({ vagasOcupadas: 0 }); // Em caso de erro, não bloqueia a tela
  }
}