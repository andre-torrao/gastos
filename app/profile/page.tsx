"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import Nav from "@/components/Nav";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name ?? ""));
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_settings").upsert({ user_id: user.id, display_name: name.trim() || null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !user) return null;

  return (
    <div className="phone-shell px-5" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
      <h1 className="font-display text-2xl font-semibold mb-6">Perfil</h1>

      <div className="bg-white rounded-xl2 p-6 border border-ink/5 mb-4">
        <div className="w-16 h-16 rounded-full bg-plum-soft flex items-center justify-center mb-4">
          <span className="font-display text-2xl font-semibold text-plum">
            {(name || user.email || "?").charAt(0).toUpperCase()}
          </span>
        </div>

        <label className="block text-xs font-body text-ink/60 mb-1">O teu nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como queres ser chamado"
          className="w-full mb-4 rounded-xl border border-ink/10 bg-paper px-4 py-3 font-body text-sm outline-none focus:border-plum"
        />

        <label className="block text-xs font-body text-ink/60 mb-1">Email</label>
        <p className="w-full rounded-xl border border-ink/5 bg-paper/60 px-4 py-3 font-body text-sm text-ink/50 mb-5">
          {user.email}
        </p>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3.5 disabled:opacity-60"
        >
          {saving ? "A guardar..." : saved ? "Guardado ✓" : "Guardar"}
        </button>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 bg-white rounded-xl2 p-4 border border-ink/5 text-coral font-body text-sm font-medium"
      >
        <LogOut size={16} /> Terminar sessão
      </button>

      <Nav />
    </div>
  );
}
