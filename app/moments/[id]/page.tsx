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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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
    if (!user || !moment) return;
    const noun = moment.type === "credit" ? "este crédito" : "este momento";
    if (!confirm(`Apagar ${noun}? Os gastos associados também serão apagados.`)) return;
    await supabase.from("moments").delete().eq("id", momentId);
    router.push("/moments");
  }

  if (loading || !user || !moment) return null;

  const isCredit = moment.type === "credit";
  const totalSpent = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const totalPaid = expenses.filter((e) => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const displayValue = isCredit ? totalPaid : totalSpent;
  const remaining = isCredit && moment.budget ? Math.max(0, moment.budget - totalPaid) : null;
  const pct = moment.budget
    ? Math.min(100, ((isCredit ? totalPaid : totalSpent) / moment.budget) * 100)
    : null;

  return (
    <div className="phone-shell px-5" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
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
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: moment.color + "22" }}
        >
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: moment.color }} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            {moment.name}
            {isCredit && (
              <span className="text-[10px] font-body bg-gold/25 text-ink/70 px-2 py-0.5 rounded-full">
                Crédito
              </span>
            )}
          </h1>
          <p className="text-xs text-ink/40 font-body">
            desde {new Date(moment.start_date + "T00:00:00").toLocaleDateString("pt-PT")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl2 p-6 border border-ink/5 mb-8 text-center">
        <p className="text-[11px] uppercase tracking-wide text-ink/50 font-body">
          {isCredit ? "Já pago" : "Já gasto"}
        </p>
        <p className="font-display text-4xl font-semibold mt-1">{formatEuro(displayValue)}</p>
        {moment.budget && (
          <>
            <p className="text-xs text-ink/40 font-body mt-1">
              {isCredit ? `de ${formatEuro(moment.budget)} do crédito total` : `de ${formatEuro(moment.budget)} planeados`}
            </p>
            <div className="h-2 rounded-full bg-ink/5 overflow-hidden mt-3">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: moment.color }}
              />
            </div>
            {isCredit && (
              <p className="text-xs text-ink/50 font-body mt-3">
                Ainda em falta: <span className="font-semibold text-ink">{formatEuro(remaining ?? 0)}</span>
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold">{isCredit ? "Prestações" : "Gastos"}</h2>
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
        onEdit={(exp) => setEditingExpense(exp)}
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

      {editingExpense && (
        <ExpenseForm
          userId={user.id}
          macroCategories={macroCategories}
          categories={categories}
          moments={[moment]}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={() => {
            setEditingExpense(null);
            load(user.id);
          }}
        />
      )}
    </div>
  );
}
