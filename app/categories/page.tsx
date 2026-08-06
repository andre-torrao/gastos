"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import Nav from "@/components/Nav";
import type { Category, MacroCategory } from "@/lib/types";
import { PALETTE } from "@/lib/types";

export default function CategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [macroCategories, setMacroCategories] = useState<MacroCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newMacroName, setNewMacroName] = useState("");
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function load(userId: string) {
    const [{ data: macros }, { data: cats }] = await Promise.all([
      supabase.from("macro_categories").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("categories").select("*").eq("user_id", userId).order("created_at"),
    ]);
    setMacroCategories(macros ?? []);
    setCategories(cats ?? []);
  }

  useEffect(() => {
    if (user) load(user.id);
  }, [user]);

  async function addMacro() {
    if (!user || !newMacroName.trim()) return;
    const color = PALETTE[macroCategories.length % PALETTE.length].hex;
    await supabase.from("macro_categories").insert({
      user_id: user.id,
      name: newMacroName.trim(),
      icon: "",
      color,
    });
    setNewMacroName("");
    load(user.id);
  }

  async function addSub(macroId: string) {
    if (!user) return;
    const value = subInputs[macroId]?.trim();
    if (!value) return;
    await supabase.from("categories").insert({
      user_id: user.id,
      macro_category_id: macroId,
      name: value,
    });
    setSubInputs((s) => ({ ...s, [macroId]: "" }));
    load(user.id);
  }

  async function removeMacro(id: string) {
    if (!user) return;
    if (!confirm("Apagar esta categoria-macro e todas as subcategorias?")) return;
    await supabase.from("macro_categories").delete().eq("id", id);
    load(user.id);
  }

  async function removeSub(id: string) {
    if (!user) return;
    await supabase.from("categories").delete().eq("id", id);
    load(user.id);
  }

  if (loading || !user) return null;

  return (
    <div className="phone-shell px-5 pt-8">
      <h1 className="font-display text-2xl font-semibold mb-1">Categorias</h1>
      <p className="text-ink/50 font-body text-sm mb-6">
        Organiza os teus gastos em categorias-macro (ex: Casa) e subcategorias (ex: Renda, Eletricidade).
      </p>

      <div className="space-y-4 mb-6">
        {macroCategories.map((mc) => (
          <div key={mc.id} className="bg-white rounded-xl2 p-4 border border-ink/5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: mc.color + "22" }}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mc.color }} />
              </div>
              <span className="font-body font-medium text-sm flex-1">{mc.name}</span>
              <button onClick={() => removeMacro(mc.id)} className="text-ink/20">
                <Trash2 size={15} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 ml-1">
              {categories
                .filter((c) => c.macro_category_id === mc.id)
                .map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-1.5 bg-paper border border-ink/10 rounded-full px-3 py-1 text-xs font-body"
                  >
                    {c.name}
                    <button onClick={() => removeSub(c.id)} className="text-ink/30">
                      ×
                    </button>
                  </span>
                ))}
            </div>

            <div className="flex gap-2">
              <input
                value={subInputs[mc.id] ?? ""}
                onChange={(e) => setSubInputs((s) => ({ ...s, [mc.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addSub(mc.id)}
                placeholder="Nova subcategoria"
                className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-xs font-body outline-none focus:border-plum"
              />
              <button
                onClick={() => addSub(mc.id)}
                className="w-8 h-8 rounded-lg bg-plum text-paper flex items-center justify-center shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl2 p-4 border border-ink/5">
        <p className="font-body text-sm font-medium mb-3">Nova categoria-macro</p>
        <div className="grid grid-cols-[1fr_2.5rem] gap-2">
          <input
            value={newMacroName}
            onChange={(e) => setNewMacroName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMacro()}
            placeholder="Ex: Educacao"
            className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm font-body outline-none focus:border-plum"
          />
          <button
            onClick={addMacro}
            className="rounded-lg bg-plum text-paper flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <Nav />
    </div>
  );
}
