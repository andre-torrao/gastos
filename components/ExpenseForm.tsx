"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Category, Expense, MacroCategory, Moment } from "@/lib/types";

type Account = "principal" | "poupanca" | "subsidio_refeicao";

const ACCOUNT_LABEL: Record<Account, string> = {
  principal: "Conta principal",
  poupanca: "Conta poupança",
  subsidio_refeicao: "Subsídio de Refeição",
};

export default function ExpenseForm({
  userId,
  macroCategories,
  categories,
  moments,
  defaultMomentId,
  expense,
  lockMoment,
  onClose,
  onSaved,
}: {
  userId: string;
  macroCategories: MacroCategory[];
  categories: Category[];
  moments: Moment[];
  defaultMomentId?: string | null;
  expense?: Expense | null;
  lockMoment?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!expense;

  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [dueDate, setDueDate] = useState(expense?.due_date ?? new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>(expense?.category_id ?? categories[0]?.id ?? "");
  const [momentId, setMomentId] = useState<string>(expense?.moment_id ?? defaultMomentId ?? "");
  const [account, setAccount] = useState<Account>(expense?.account ?? "principal");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [recurring, setRecurring] = useState(expense?.recurring ?? false);
  const [recurringUntil, setRecurringUntil] = useState(expense?.recurring_until ?? "");
  const [paidNow, setPaidNow] = useState(expense?.paid ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = macroCategories.map((mc) => ({
    macro: mc,
    subs: categories.filter((c) => c.macro_category_id === mc.id),
  }));

  // Soma um mes a uma data "YYYY-MM-DD" sem passar por fuso horario
  // (evita o Date/toISOString desviarem o dia por causa do UTC).
  function addMonth(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    let ny = y;
    let nm = m + 1;
    if (nm > 12) {
      nm = 1;
      ny += 1;
    }
    const lastDay = new Date(ny, nm, 0).getDate();
    const nd = Math.min(d, lastDay);
    return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
  }

  async function ensureNextOccurrence(payload: {
    description: string;
    amount: number;
    due_date: string;
    category_id: string | null;
    moment_id: string | null;
    account: Account;
    notes: string | null;
    recurring_until: string | null;
  }) {
    const nextDue = addMonth(payload.due_date);
    if (payload.recurring_until && nextDue > payload.recurring_until) return;

    let query = supabase
      .from("expenses")
      .select("id")
      .eq("user_id", userId)
      .eq("description", payload.description)
      .eq("due_date", nextDue);
    query = payload.moment_id
      ? query.eq("moment_id", payload.moment_id)
      : query.is("moment_id", null);
    const { data: existing } = await query.maybeSingle();

    if (!existing) {
      await supabase.from("expenses").insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        due_date: nextDue,
        category_id: payload.category_id,
        moment_id: payload.moment_id,
        account: payload.account,
        notes: payload.notes,
        recurring: true,
        recurring_until: payload.recurring_until,
        paid: false,
        paid_date: null,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim() || isNaN(value) || value <= 0 || !dueDate) {
      setError("Preenche a descricao, o valor e a data.");
      return;
    }
    setSaving(true);

    const payload = {
      description: description.trim(),
      amount: value,
      due_date: dueDate,
      category_id: categoryId || null,
      moment_id: momentId || null,
      account,
      notes: notes.trim() || null,
      recurring_until: recurring && recurringUntil ? recurringUntil : null,
    };

    if (isEditing && expense) {
      const { error: updateError } = await supabase
        .from("expenses")
        .update({
          ...payload,
          recurring,
          paid: paidNow,
          paid_date: paidNow ? expense.paid_date ?? dueDate : null,
        })
        .eq("id", expense.id);

      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("expenses").insert({
        user_id: userId,
        ...payload,
        recurring,
        paid: paidNow,
        paid_date: paidNow ? dueDate : null,
      });

      if (insertError) {
        setSaving(false);
        setError(insertError.message);
        return;
      }
    }

    // Se e recorrente, garante que o lancamento do mes seguinte existe,
    // para ja apareceres nessa vista sem esperar que este seja pago.
    if (recurring) {
      await ensureNextOccurrence(payload);
    }

    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!expense) return;
    if (!confirm("Apagar este gasto?")) return;
    setDeleting(true);
    await supabase.from("expenses").delete().eq("id", expense.id);
    setDeleting(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-paper w-full max-w-[30rem] rounded-t-xl2 p-6 pb-8 max-h-[90dvh] overflow-y-auto"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">
            {isEditing ? "Editar gasto" : "Novo gasto"}
          </h2>
          <div className="flex items-center gap-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-9 h-9 flex items-center justify-center text-coral/70"
                title="Apagar gasto"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center text-ink/50">
              <X size={20} />
            </button>
          </div>
        </div>

        <label className="block text-xs font-body text-ink/60 mb-1">Descricao</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Conta da agua"
          className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
        />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-body text-ink/60 mb-1">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-body text-sm pointer-events-none">
                €
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-full rounded-xl border border-ink/10 bg-white pl-8 pr-4 py-3 font-body text-sm outline-none focus:border-plum"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-body text-ink/60 mb-1">Data</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />
          </div>
        </div>

        <label className="block text-xs font-body text-ink/60 mb-1">Categoria</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
        >
          <option value="">Sem categoria</option>
          {grouped.map(({ macro, subs }) => (
            <optgroup key={macro.id} label={macro.name}>
              {subs.length === 0 && <option value={macro.id}>{macro.name} (geral)</option>}
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {!lockMoment && moments.length > 0 && (
          <>
            <label className="block text-xs font-body text-ink/60 mb-1">Momento (opcional)</label>
            <select
              value={momentId}
              onChange={(e) => setMomentId(e.target.value)}
              className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            >
              <option value="">Nenhum — gasto do mes</option>
              {moments.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </>
        )}

        {lockMoment && moments.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-body text-ink/60 mb-1">Momento</label>
            <p className="w-full rounded-xl border border-ink/5 bg-plum-soft px-4 py-3 font-body text-sm text-plum font-medium">
              {moments[0]?.name}
            </p>
          </div>
        )}

        <label className="block text-xs font-body text-ink/60 mb-1">Conta</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.keys(ACCOUNT_LABEL) as Account[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAccount(a)}
              className={`rounded-xl border py-2.5 text-xs font-body leading-tight transition-colors ${
                account === a ? "bg-plum text-paper border-plum" : "border-ink/10 bg-white text-ink/70"
              }`}
            >
              {ACCOUNT_LABEL[a]}
            </button>
          ))}
        </div>

        <label className="block text-xs font-body text-ink/60 mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alguma nota sobre este gasto..."
          rows={2}
          className="w-full mb-4 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum resize-none"
        />

        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center gap-2 text-sm font-body text-ink/80">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Repete todos os meses
          </label>
          <label className="flex items-center gap-2 text-sm font-body text-ink/80">
            <input type="checkbox" checked={paidNow} onChange={(e) => setPaidNow(e.target.checked)} />
            Ja esta pago
          </label>
        </div>

        {recurring && (
          <div className="mb-6">
            <label className="block text-xs font-body text-ink/60 mb-1">
              Repetir até (opcional — deixa vazio para repetir sempre)
            </label>
            <input
              type="date"
              value={recurringUntil}
              onChange={(e) => setRecurringUntil(e.target.value)}
              min={dueDate}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />
          </div>
        )}

        {error && <p className="text-coral text-sm font-body mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3.5 disabled:opacity-60"
        >
          {saving ? "A guardar..." : isEditing ? "Guardar alterações" : "Guardar gasto"}
        </button>
      </form>
    </div>
  );
}
