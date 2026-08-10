"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { ensureDefaultCategories } from "@/lib/ensureCategories";
import { monthRange } from "@/lib/dateRanges";
import Nav from "@/components/Nav";
import ExpenseForm from "@/components/ExpenseForm";
import CategoryRing, { formatEuro } from "@/components/CategoryRing";
import type { Category, Expense, MacroCategory, Moment } from "@/lib/types";
import { PALETTE } from "@/lib/types";

type Chooser = null | "menu" | "expense" | "moment" | "credit";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [displayName, setDisplayName] = useState("");
  const [macroCategories, setMacroCategories] = useState<MacroCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [momentExpenses, setMomentExpenses] = useState<Expense[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [chooser, setChooser] = useState<Chooser>(null);

  const [name, setName] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [alreadyPaidInput, setAlreadyPaidInput] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setChooser("menu");
      router.replace("/");
    }
  }, [searchParams, router]);

  const load = useCallback(async (userId: string) => {
    await ensureDefaultCategories(userId);
    const now = new Date();
    const { start, end } = monthRange(now.getFullYear(), now.getMonth());
    const [{ data: macros }, { data: cats }, { data: settings }, { data: m }, { data: me }, { data: mo }] =
      await Promise.all([
        supabase.from("macro_categories").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("categories").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("user_settings").select("display_name").eq("user_id", userId).maybeSingle(),
        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", userId)
          .is("moment_id", null)
          .gte("due_date", start)
          .lte("due_date", end),
        supabase.from("expenses").select("*").eq("user_id", userId).not("moment_id", "is", null),
        supabase.from("moments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
    setMacroCategories(macros ?? []);
    setCategories(cats ?? []);
    setDisplayName(settings?.display_name ?? "");
    setMonthExpenses(m ?? []);
    setMomentExpenses(me ?? []);
    setMoments(mo ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("process_due_expenses").then(() => load(user.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function resetForm() {
    setName("");
    setBudgetInput("");
    setAlreadyPaidInput("");
    setStartDate(new Date().toISOString().slice(0, 10));
  }

  async function createMoment(type: "moment" | "credit") {
    if (!user || !name.trim()) return;
    if (type === "credit" && !budgetInput.trim()) return;
    setSaving(true);
    const color = PALETTE[moments.length % PALETTE.length].hex;
    const budgetValue = budgetInput.trim() ? parseFloat(budgetInput.replace(",", ".")) : null;

    const { data: created } = await supabase
      .from("moments")
      .insert({
        user_id: user.id,
        name: name.trim(),
        icon: "",
        color,
        type,
        start_date: startDate,
        budget: budgetValue,
      })
      .select()
      .single();

    const already = alreadyPaidInput.trim() ? parseFloat(alreadyPaidInput.replace(",", ".")) : 0;
    if (type === "credit" && created && already > 0) {
      await supabase.from("expenses").insert({
        user_id: user.id,
        moment_id: created.id,
        description: "Saldo pago até início",
        amount: already,
        due_date: startDate,
        paid: true,
        paid_date: startDate,
        account: "principal",
        recurring: false,
      });
    }

    setSaving(false);
    setChooser(null);
    resetForm();
    load(user.id);
  }

  if (loading || !user) return null;

  const monthTotal = monthExpenses.reduce((a, e) => a + Number(e.amount), 0);
  const monthPaid = monthExpenses.filter((e) => e.paid).reduce((a, e) => a + Number(e.amount), 0);
  const monthPending = monthTotal - monthPaid;
  const greetingName = displayName || user.email?.split("@")[0] || "";

  const segments = macroCategories.map((mc) => {
    const subIds = new Set(categories.filter((c) => c.macro_category_id === mc.id).map((c) => c.id));
    const inCategory = monthExpenses.filter(
      (e) => e.category_id === mc.id || (e.category_id && subIds.has(e.category_id))
    );
    const paid = inCategory.filter((e) => e.paid).reduce((a, e) => a + Number(e.amount), 0);
    const pending = inCategory.filter((e) => !e.paid).reduce((a, e) => a + Number(e.amount), 0);
    return { name: mc.name, paid, pending, color: mc.color };
  });

  return (
    <div className="phone-shell px-5" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
      <div className="mb-6">
        <p className="text-ink/50 font-body text-sm">Olá,</p>
        <h1 className="font-display text-2xl font-semibold capitalize">{greetingName}</h1>
      </div>

      <button
        onClick={() => router.push("/mes")}
        className="w-full text-left bg-white rounded-xl2 p-5 border border-ink/5 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-lg font-semibold">Este mês</span>
          <span className="flex items-center gap-1 text-xs font-body text-plum font-medium">
            Ver detalhes <ArrowRight size={13} />
          </span>
        </div>
        <CategoryRing segments={segments} total={monthTotal} budget={null} centerLabel="gastos do mês" />
        {monthExpenses.length === 0 && (
          <p className="text-center text-ink/40 font-body text-xs mt-4">
            Ainda sem gastos este mês.
          </p>
        )}
      </button>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-semibold">Momentos</h2>
        <button
          onClick={() => setChooser("menu")}
          className="w-9 h-9 rounded-full bg-plum text-paper flex items-center justify-center"
        >
          <Plus size={16} />
        </button>
      </div>
      <p className="text-ink/50 font-body text-sm mb-5">
        Viagens, objetivos ou créditos — acompanha tudo fora do resumo mensal.
      </p>

      {moments.length === 0 && (
        <p className="text-center text-ink/40 font-body text-sm py-10">
          Ainda sem momentos. Cria o primeiro, por exemplo "Viagem de fim de ano" ou um crédito que estejas a pagar.
        </p>
      )}

      <div className="space-y-3">
        {moments.map((m) => {
          const linked = momentExpenses.filter((e) => e.moment_id === m.id);
          const isCredit = m.type === "credit";
          const totalSpent = linked.reduce((a, e) => a + Number(e.amount), 0);
          const totalPaidCredit = linked.filter((e) => e.paid).reduce((a, e) => a + Number(e.amount), 0);
          const displayValue = isCredit ? totalPaidCredit : totalSpent;
          const remaining = isCredit && m.budget ? Math.max(0, m.budget - totalPaidCredit) : null;
          const pct = m.budget
            ? Math.min(100, ((isCredit ? totalPaidCredit : totalSpent) / m.budget) * 100)
            : null;
          return (
            <button
              key={m.id}
              onClick={() => router.push(`/moments/${m.id}`)}
              className="w-full text-left bg-white rounded-xl2 p-5 border border-ink/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: m.color + "22" }}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: m.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-body font-medium text-sm flex items-center gap-1.5">
                    {m.name}
                    {isCredit && (
                      <span className="text-[9px] font-body bg-gold/25 text-ink/70 px-1.5 py-0.5 rounded-full">
                        Crédito
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/40 font-body">
                    desde {new Date(m.start_date + "T00:00:00").toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold">{formatEuro(displayValue)}</p>
                  {m.budget && (
                    <p className="text-xs text-ink/40 font-body">
                      {isCredit ? `em falta ${formatEuro(remaining ?? 0)}` : `de ${formatEuro(m.budget)}`}
                    </p>
                  )}
                </div>
              </div>
              {pct !== null && (
                <div className="h-1.5 rounded-full bg-ink/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Menu de escolha do que adicionar */}
      {chooser === "menu" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setChooser(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-paper w-full max-w-[30rem] rounded-t-xl2 p-6"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold">O que queres adicionar?</h2>
              <button onClick={() => setChooser(null)} className="w-9 h-9 flex items-center justify-center text-ink/50">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => setChooser("expense")}
                className="w-full text-left bg-white rounded-xl2 p-4 border border-ink/5 font-body text-sm font-medium"
              >
                Gasto do mês
                <p className="text-xs text-ink/40 font-normal mt-0.5">Uma despesa normal, dentro do teu orçamento mensal.</p>
              </button>
              <button
                onClick={() => { setChooser("moment"); }}
                className="w-full text-left bg-white rounded-xl2 p-4 border border-ink/5 font-body text-sm font-medium"
              >
                Novo momento
                <p className="text-xs text-ink/40 font-normal mt-0.5">Uma viagem, uma obra, um objetivo com vários gastos.</p>
              </button>
              <button
                onClick={() => { setChooser("credit"); setStartDate(new Date().toISOString().slice(0, 10)); }}
                className="w-full text-left bg-white rounded-xl2 p-4 border border-ink/5 font-body text-sm font-medium"
              >
                Novo crédito
                <p className="text-xs text-ink/40 font-normal mt-0.5">Um empréstimo — acompanha o valor em falta à medida que pagas.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de gasto do mes */}
      {chooser === "expense" && (
        <ExpenseForm
          userId={user.id}
          macroCategories={macroCategories}
          categories={categories}
          moments={[]}
          onClose={() => setChooser(null)}
          onSaved={() => {
            setChooser(null);
            load(user.id);
          }}
        />
      )}

      {/* Formulario de novo momento / credito */}
      {(chooser === "moment" || chooser === "credit") && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setChooser(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-paper w-full max-w-[30rem] rounded-t-xl2 p-6"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold">
                {chooser === "credit" ? "Novo crédito" : "Novo momento"}
              </h2>
              <button onClick={() => setChooser(null)} className="w-9 h-9 flex items-center justify-center text-ink/50">
                <X size={20} />
              </button>
            </div>

            <label className="block text-xs font-body text-ink/60 mb-1">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={chooser === "credit" ? "Ex: Crédito automóvel" : "Ex: Viagem de fim de ano"}
              className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />

            <label className="block text-xs font-body text-ink/60 mb-1">
              {chooser === "credit" ? "Valor total do crédito" : "Orçamento (opcional)"}
            </label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-body text-sm pointer-events-none">
                €
              </span>
              <input
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-full rounded-xl border border-ink/10 bg-white pl-8 pr-4 py-3 font-body text-sm outline-none focus:border-plum"
              />
            </div>

            <label className="block text-xs font-body text-ink/60 mb-1">
              {chooser === "credit" ? "Data em que contraíste o crédito" : "Data de início"}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />

            {chooser === "credit" && (
              <>
                <label className="block text-xs font-body text-ink/60 mb-1">Já pago até agora (opcional)</label>
                <div className="relative mb-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-body text-sm pointer-events-none">
                    €
                  </span>
                  <input
                    value={alreadyPaidInput}
                    onChange={(e) => setAlreadyPaidInput(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                    className="w-full rounded-xl border border-ink/10 bg-white pl-8 pr-4 py-3 font-body text-sm outline-none focus:border-plum"
                  />
                </div>
                <p className="text-[11px] text-ink/40 font-body mb-4">
                  Se já vinhas a pagar este crédito, indica quanto já liquidaste para o valor em falta ficar certo.
                </p>
              </>
            )}

            <button
              onClick={() => createMoment(chooser === "credit" ? "credit" : "moment")}
              disabled={saving}
              className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3.5 disabled:opacity-60 mt-2"
            >
              {saving ? "A guardar..." : chooser === "credit" ? "Criar crédito" : "Criar momento"}
            </button>
          </div>
        </div>
      )}

      <Nav onAdd={() => setChooser("menu")} />
    </div>
  );
}
