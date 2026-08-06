"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import Nav from "@/components/Nav";
import MonthSwitcher from "@/components/MonthSwitcher";
import CategoryRing, { formatEuro } from "@/components/CategoryRing";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { DEFAULT_MACRO_CATEGORIES } from "@/lib/defaultCategories";
import type { Category, Expense, MacroCategory } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [macroCategories, setMacroCategories] = useState<MacroCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const ensureDefaultCategories = useCallback(async (userId: string) => {
    const { data } = await supabase.from("macro_categories").select("*").eq("user_id", userId);
    if (data && data.length === 0) {
      await supabase
        .from("macro_categories")
        .insert(DEFAULT_MACRO_CATEGORIES.map((c) => ({ ...c, user_id: userId })));
    }
  }, []);

  const loadStatic = useCallback(async (userId: string) => {
    await ensureDefaultCategories(userId);
    const [{ data: macros }, { data: cats }, { data: settings }] = await Promise.all([
      supabase.from("macro_categories").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("categories").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setMacroCategories(macros ?? []);
    setCategories(cats ?? []);
    setBudget(settings?.monthly_budget ?? null);
  }, [ensureDefaultCategories]);

  const loadExpenses = useCallback(async (userId: string, y: number, m: number) => {
    const start = new Date(y, m, 1).toISOString().slice(0, 10);
    const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .is("moment_id", null)
      .gte("due_date", start)
      .lte("due_date", end)
      .order("due_date");
    setExpenses(data ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // fallback: processa gastos cuja data ja chegou (o cron do Supabase trata disto tambem)
      await supabase.rpc("process_due_expenses");
      await loadStatic(user.id);
      await loadExpenses(user.id, year, month);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || !ready) return;
    loadExpenses(user.id, year, month);
  }, [year, month, user, ready, loadExpenses]);

  async function saveBudget() {
    if (!user) return;
    const value = budgetInput.trim() === "" ? null : parseFloat(budgetInput.replace(",", "."));
    await supabase.from("user_settings").upsert({ user_id: user.id, monthly_budget: value });
    setBudget(value);
    setEditingBudget(false);
  }

  if (loading || !user) return null;

  const total = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const segments = macroCategories.map((mc) => {
    const subIds = new Set(categories.filter((c) => c.macro_category_id === mc.id).map((c) => c.id));
    const value = expenses
      .filter((e) => e.category_id === mc.id || (e.category_id && subIds.has(e.category_id)))
      .reduce((a, e) => a + Number(e.amount), 0);
    return { name: mc.name, value, color: mc.color };
  });

  const firstName = user.email?.split("@")[0] ?? "";

  return (
    <div className="phone-shell px-5 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-ink/50 font-body text-sm">Ola,</p>
          <h1 className="font-display text-2xl font-semibold capitalize">{firstName}</h1>
        </div>
        <button
          onClick={() => {
            setBudgetInput(budget?.toString() ?? "");
            setEditingBudget(true);
          }}
          className="w-10 h-10 rounded-full bg-white border border-ink/10 flex items-center justify-center text-ink/50"
        >
          <Settings2 size={18} />
        </button>
      </div>

      <MonthSwitcher year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      <div className="mt-6 bg-white rounded-xl2 p-6 border border-ink/5">
        <CategoryRing segments={segments} total={total} budget={budget} centerLabel="Total do mes" />
      </div>

      <div className="mt-8 flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold">Gastos do mes</h2>
        <span className="text-xs font-body text-ink/40">{expenses.length} lancamentos</span>
      </div>
      <ExpenseList
        expenses={expenses}
        categories={categories}
        macroCategories={macroCategories}
        onChanged={() => loadExpenses(user.id, year, month)}
      />

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-1/2 translate-x-[9.5rem] w-14 h-14 rounded-full bg-plum text-paper flex items-center justify-center shadow-xl z-40"
      >
        <Plus size={26} />
      </button>

      {showForm && (
        <ExpenseForm
          userId={user.id}
          macroCategories={macroCategories}
          categories={categories}
          moments={[]}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadExpenses(user.id, year, month);
          }}
        />
      )}

      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={() => setEditingBudget(false)}>
          <div className="bg-paper rounded-xl2 p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold mb-1">Limite mensal</h3>
            <p className="text-xs text-ink/50 font-body mb-4">
              Define um objetivo de gasto para veres o progresso no anel. Deixa vazio para nao usar limite.
            </p>
            <input
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              inputMode="decimal"
              placeholder="Ex: 1500"
              className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />
            <button
              onClick={saveBudget}
              className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <Nav />
    </div>
  );
}
