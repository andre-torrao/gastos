"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import Nav from "@/components/Nav";
import { formatEuro } from "@/components/CategoryRing";
import type { Expense, Moment } from "@/lib/types";
import { PALETTE } from "@/lib/types";

export default function MomentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function load(userId: string) {
    const [{ data: m }, { data: e }] = await Promise.all([
      supabase.from("moments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").eq("user_id", userId).not("moment_id", "is", null),
    ]);
    setMoments(m ?? []);
    setExpenses(e ?? []);
  }

  useEffect(() => {
    if (user) load(user.id);
  }, [user]);

  async function createMoment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    const color = PALETTE[moments.length % PALETTE.length].hex;
    await supabase.from("moments").insert({
      user_id: user.id,
      name: name.trim(),
      icon: "",
      color,
      start_date: new Date().toISOString().slice(0, 10),
      budget: budgetInput.trim() ? parseFloat(budgetInput.replace(",", ".")) : null,
    });
    setSaving(false);
    setShowForm(false);
    setName("");
    setBudgetInput("");
    load(user.id);
  }

  if (loading || !user) return null;

  return (
    <div className="phone-shell px-5" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Momentos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-10 h-10 rounded-full bg-plum text-paper flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="text-ink/50 font-body text-sm mb-6">
        Cria objetivos ou eventos (uma viagem, uma obra) e acompanha o total gasto, fora do resumo mensal.
      </p>

      {moments.length === 0 && (
        <p className="text-center text-ink/40 font-body text-sm py-10">
          Ainda sem momentos. Cria o primeiro, por exemplo "Viagem de fim de ano".
        </p>
      )}

      <div className="space-y-3">
        {moments.map((m) => {
          const total = expenses
            .filter((e) => e.moment_id === m.id)
            .reduce((a, e) => a + Number(e.amount), 0);
          const pct = m.budget ? Math.min(100, (total / m.budget) * 100) : null;
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
                  <p className="font-body font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-ink/40 font-body">
                    desde {new Date(m.start_date + "T00:00:00").toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold">{formatEuro(total)}</p>
                  {m.budget && <p className="text-xs text-ink/40 font-body">de {formatEuro(m.budget)}</p>}
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={createMoment}
            className="bg-paper w-full max-w-[30rem] rounded-t-xl2 p-6 pb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold">Novo momento</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 text-ink/50">
                <X size={20} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-body text-ink/60 mb-1">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Viagem de fim de ano"
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
              />
            </div>
            <label className="block text-xs font-body text-ink/60 mb-1">Orcamento (opcional)</label>
            <input
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              inputMode="decimal"
              placeholder="Ex: 2000"
              className="w-full mb-5 rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3.5 disabled:opacity-60"
            >
              Criar momento
            </button>
          </form>
        </div>
      )}

      <Nav />
    </div>
  );
}
