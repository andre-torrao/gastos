"use client";

import { Check, Trash2, Repeat } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Category, Expense, MacroCategory } from "@/lib/types";
import { formatEuro } from "./CategoryRing";

function categoryFor(exp: Expense, categories: Category[], macros: MacroCategory[]) {
  const cat = categories.find((c) => c.id === exp.category_id);
  if (cat) {
    const macro = macros.find((m) => m.id === cat.macro_category_id);
    return { label: cat.name, color: macro?.color ?? "#999" };
  }
  const macro = macros.find((m) => m.id === exp.category_id);
  if (macro) return { label: macro.name, color: macro.color };
  return { label: "Sem categoria", color: "#999" };
}

export default function ExpenseList({
  expenses,
  categories,
  macroCategories,
  onChanged,
}: {
  expenses: Expense[];
  categories: Category[];
  macroCategories: MacroCategory[];
  onChanged: () => void;
}) {
  async function togglePaid(exp: Expense) {
    await supabase
      .from("expenses")
      .update({ paid: !exp.paid, paid_date: !exp.paid ? new Date().toISOString().slice(0, 10) : null })
      .eq("id", exp.id);
    onChanged();
  }

  async function remove(exp: Expense) {
    await supabase.from("expenses").delete().eq("id", exp.id);
    onChanged();
  }

  if (expenses.length === 0) {
    return (
      <p className="text-center text-ink/40 font-body text-sm py-10">
        Ainda sem gastos aqui. Toca em + para adicionar o primeiro.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((exp) => {
        const cat = categoryFor(exp, categories, macroCategories);
        return (
          <div
            key={exp.id}
            className="flex items-center gap-3 bg-white rounded-xl2 px-4 py-3 border border-ink/5"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: cat.color + "22" }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-ink truncate flex items-center gap-1.5">
                {exp.description}
                {exp.recurring && <Repeat size={12} className="text-ink/30 shrink-0" />}
                {exp.account === "poupanca" && (
                  <span className="text-[9px] font-body bg-sage-soft text-sage px-1.5 py-0.5 rounded-full shrink-0">
                    Poupança
                  </span>
                )}
              </p>
              <p className="text-xs text-ink/50 font-body truncate">
                {cat.label} ·{" "}
                {new Date(exp.due_date + "T00:00:00").toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "short",
                })}
                {exp.notes && <> · {exp.notes}</>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-body text-sm font-semibold ${exp.paid ? "text-ink/40" : "text-ink"}`}>
                {formatEuro(exp.amount)}
              </p>
              <p className="text-[10px] font-body text-sage">{exp.paid ? "Pago" : "Por pagar"}</p>
            </div>
            <button
              onClick={() => togglePaid(exp)}
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                exp.paid ? "bg-sage border-sage text-white" : "border-ink/20 text-ink/20"
              }`}
              title="Marcar como pago"
            >
              <Check size={14} />
            </button>
            <button onClick={() => remove(exp)} className="text-ink/20 shrink-0" title="Apagar">
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
