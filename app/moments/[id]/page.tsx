"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { formatEuro } from "@/components/CategoryRing";
import type { Category, Expense, MacroCategory, Moment } from "@/lib/types";

export default function MomentDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const momentId = params?.id as string;

  const [moment, setMoment] = useState<Moment | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [macroCategories, setMacroCategories] = useState<MacroCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function load(userId: string) {
    const [{ data: m }, { data: e }, { data: macros }, { data: cats }] = await Promise.all([
      supabase.from("moments").select("*").eq("id", momentId).eq("user_id", userId).single(),
      supabase.from("expenses").select("*").eq("moment_id", momentId).order("due_date", { ascending: false }),
      supabase.from("macro_categories").select("*").eq("user_id", userId),
      supabase.from("categories").select("*").eq("user_id", userId),
    ]);
    setMoment(m ?? null);
    setExpenses(e ?? []);
    setMacroCategories(macros ?? []);
    setCategories(cats ?? []);
  }

  useEffect(() => {
    if (user && momentId) load(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, momentId]);

  async function deleteMoment() {
    if (!user) return;
    if (!confirm("Apagar este momento? Os gastos associados tambem serao apagados.")) return;
    await supabase.from("moments").delete().eq("id", momentId);
    router.push("/moments");
  }

  if (loading || !user || !moment) return null;

  const total = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const pct = moment.budget ? Math.min(100, (total / moment.budget) * 100) : null;

  return (
    <div className="phone-shell px-5 pt-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/moments")} className="p-2 -ml-2 text-ink/60">
          <ArrowLeft size={20} />
        </button>
        <button onClick={deleteMoment} className="p-2 text-coral/70">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: moment.color + "22" }}
        >
          {moment.icon}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{moment.name}</h1>
          <p className="text-xs text-ink/40 font-body">
            desde {new Date(moment.start_date + "T00:00:00").toLocaleDateString("pt-PT")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl2 p-6 border border-ink/5 mb-8 text-center">
        <p className="text-[11px] uppercase tracking-wide text-ink/50 font-body">Ja gasto</p>
        <p className="font-display text-4xl font-semibold mt-1">{formatEuro(total)}</p>
        {moment.budget && (
          <>
            <p className="text-xs text-ink/40 font-body mt-1">de {formatEuro(moment.budget)} planeados</p>
            <div className="h-2 rounded-full bg-ink/5 overflow-hidden mt-3">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: moment.color }}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold">Gastos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-xs font-body text-plum font-medium"
        >
          <Plus size={14} /> adicionar
        </button>
      </div>

      <ExpenseList
        expenses={expenses}
        categories={categories}
        macroCategories={macroCategories}
        onChanged={() => load(user.id)}
      />

      {showForm && (
        <ExpenseForm
          userId={user.id}
          macroCategories={macroCategories}
          categories={categories}
          moments={[moment]}
          defaultMomentId={moment.id}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load(user.id);
          }}
        />
      )}
    </div>
  );
}
