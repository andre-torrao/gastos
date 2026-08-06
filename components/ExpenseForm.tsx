"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Category, MacroCategory, Moment } from "@/lib/types";

export default function ExpenseForm({
  userId,
  macroCategories,
  categories,
  moments,
  defaultMomentId,
  onClose,
  onSaved,
}: {
  userId: string;
  macroCategories: MacroCategory[];
  categories: Category[];
  moments: Moment[];
  defaultMomentId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [momentId, setMomentId] = useState<string>(defaultMomentId ?? "");
  const [recurring, setRecurring] = useState(false);
  const [paidNow, setPaidNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = macroCategories.map((mc) => ({
    macro: mc,
    subs: categories.filter((c) => c.macro_category_id === mc.id),
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim() || isNaN(value) || value <= 0 || !dueDate) {
      setError("Preenche a descricao, o valor e a data.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("expenses").insert({
      user_id: userId,
      description: description.trim(),
      amount: value,
      due_date: dueDate,
      category_id: categoryId || null,
      moment_id: momentId || null,
      recurring,
      paid: paidNow,
      paid_date: paidNow ? dueDate : null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-paper w-full max-w-[30rem] rounded-t-xl2 p-6 pb-8 max-h-[88dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">Novo gasto</h2>
          <button type="button" onClick={onClose} className="p-1 text-ink/50">
            <X size={20} />
          </button>
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
            <label className="block text-xs font-body text-ink/60 mb-1">Valor (€)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />
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
            <optgroup key={macro.id} label={`${macro.icon} ${macro.name}`}>
              {subs.length === 0 && <option value={macro.id}>{macro.name} (geral)</option>}
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {moments.length > 0 && (
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
                  {m.icon} {m.name}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="flex items-center gap-6 mb-6">
          <label className="flex items-center gap-2 text-sm font-body text-ink/80">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Repete todos os meses
          </label>
          <label className="flex items-center gap-2 text-sm font-body text-ink/80">
            <input type="checkbox" checked={paidNow} onChange={(e) => setPaidNow(e.target.checked)} />
            Ja esta pago
          </label>
        </div>

        {error && <p className="text-coral text-sm font-body mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3.5 disabled:opacity-60"
        >
          {saving ? "A guardar..." : "Guardar gasto"}
        </button>
      </form>
    </div>
  );
}
