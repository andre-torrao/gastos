import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Evita que o Next tente pre-renderizar/otimizar esta rota como estatica.
export const dynamic = "force-dynamic";

// Pedido minimo e inofensivo ao Supabase: pede apenas a contagem de
// linhas de uma tabela pequena, sem devolver quaisquer dados (head: true).
// Isto gera atividade na API do Supabase (util em planos que pausam
// projetos por inatividade) sem expor informacao de ninguem.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Nao autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase
    .from("macro_categories")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
