"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { ensureDefaultCategories } from "@/lib/ensureCategories";
import Nav from "@/components/Nav";
import MonthSwitcher from "@/components/MonthSwitcher";
import RangeTabs, { RangeMode } from "@/components/RangeTabs";
import CategoryRing from "@/components/CategoryRing";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { dayRange, weekRange, monthRange } from "@/lib/dateRanges";
import type { Category, Expense, MacroCategory } from "@/lib/types";

const RANGE_LABEL: Record<RangeMode, string> = {
  dia: "Gastos de hoje",
  semana: "Gastos desta semana",
  mes: "Gastos do mes",
};

export default function MesPage() {
  return (
    <Suspense fallback={null}>
      <MesInner />
    </Suspense>
  );
}

function MesInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [rangeMode, setRangeMode] = useState<RangeMode>("mes");
  const [macroCategories, setMacroCategories] = useState<MacroCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
      router.replace("/mes");
    }
  }, [searchParams, router]);

  const loadStatic = useCallback(async (userId: string) => {
    await ensureDefaultCategories(userId);
    const [{ data: macros }, { data: cats }] = await Promise.all([
      supabase.from("macro_categories").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("categories").select("*").eq("user_id", userId).order("created_at"),
    ]);
    setMacroCategories(macros ?? []);
    setCategories(cats ?? []);
  }, []);

  const loadExpenses = useCallback(
    async (userId: string, mode: RangeMode, y: number, m: number) => {
      const { start, end } =
        mode === "dia" ? dayRange() : mode === "semana" ? weekRange() : monthRange(y, m);
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .is("moment_id", null)
        .gte("due_date", start)
        .lte("due_date", end)
        .order("due_date");
      setExpenses(data ?? []);
    },
    []
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      // fallback: processa gastos cuja data ja chegou (o cron do Supabase trata disto tambem)
      await supabase.rpc("process_due_expenses");
      await loadStatic(user.id);
      await loadExpenses(user.id, rangeMode, year, month);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || !ready) return;
    loadExpenses(user.id, rangeMode, year, month);
  }, [year, month, rangeMode, user, ready, loadExpenses]);

  if (loading || !user) return null;

  const total = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const segments = macroCategories.map((mc) => {
    const subIds = new Set(categories.filter((c) => c.macro_category_id === mc.id).map((c) => c.id));
    const inCategory = expenses.filter(
      (e) => e.category_id === mc.id || (e.category_id && subIds.has(e.category_id))
    );
    const paid = inCategory.filter((e) => e.paid).reduce((a, e) => a + Number(e.amount), 0);
    const pending = inCategory.filter((e) => !e.paid).reduce((a, e) => a + Number(e.amount), 0);
    return { name: mc.name, paid, pending, color: mc.color };
  });

  return (
    <div className="phone-shell px-5" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
      <h1 className="font-display text-2xl font-semibold mb-6">Gastos do mês</h1>

      <RangeTabs value={rangeMode} onChange={setRangeMode} />

      {rangeMode === "mes" && (
        <div className="mt-4">
          <MonthSwitcher year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl2 p-6 border border-ink/5">
        <CategoryRing
          segments={segments}
          total={total}
          budget={null}
          centerLabel={RANGE_LABEL[rangeMode]}
        />
      </div>

      <div className="mt-8 mb-3">
        <h2 className="font-display text-lg font-semibold">{RANGE_LABEL[rangeMode]}</h2>
      </div>
      <ExpenseList
        expenses={expenses}
        categories={categories}
        macroCategories={macroCategories}
        onChanged={() => loadExpenses(user.id, rangeMode, year, month)}
        onEdit={(exp) => setEditingExpense(exp)}
      />

      {showForm && (
        <ExpenseForm
          userId={user.id}
          macroCategories={macroCategories}
          categories={categories}
          moments={[]}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadExpenses(user.id, rangeMode, year, month);
          }}
        />
      )}

      {editingExpense && (
        <ExpenseForm
          userId={user.id}
          macroCategories={macroCategories}
          categories={categories}
          moments={[]}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={() => {
            setEditingExpense(null);
            loadExpenses(user.id, rangeMode, year, month);
          }}
        />
      )}

      <Nav onAdd={() => setShowForm(true)} />
    </div>
  );
}
