import { createClient, User } from '@supabase/supabase-js';

// Preços oficiais: o navegador só escolhe o plano, quem define o valor é o servidor.
// Se mudar um preço aqui, atualize também o texto exibido em app/page.tsx.
export const PLANOS: Record<string, { id: 'fundador' | 'anual' | 'mensal'; preco: number }> = {
  'Plano Fundador': { id: 'fundador', preco: 149.99 },
  'Plano Elite Anual': { id: 'anual', preco: 282.50 },
  'Plano Elite Mensal': { id: 'mensal', preco: 29.99 },
};

export const PRECO_POR_ID: Record<string, number> = Object.fromEntries(
  Object.values(PLANOS).map((p) => [p.id, p.preco])
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Confere o "crachá" (token de login do Supabase) enviado pela página.
// Retorna o usuário dono do token, ou null se não houver login válido.
export async function usuarioLogado(request: Request): Promise<User | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user;
}
