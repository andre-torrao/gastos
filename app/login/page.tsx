"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Conta criada. Verifica o teu email para confirmar (se a confirmacao estiver ativa) e depois inicia sessao.");
    }
    setBusy(false);
  }

  return (
    <div className="phone-shell px-6 pt-24">
      <h1 className="font-display text-3xl font-semibold mb-1">Gastos</h1>
      <p className="text-ink/50 font-body text-sm mb-8">A tua gestao pessoal de despesas.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-body text-ink/60 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="block text-xs font-body text-ink/60 mb-1">Palavra-passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-body text-sm outline-none focus:border-plum"
          />
        </div>

        {error && <p className="text-coral text-sm font-body">{error}</p>}
        {info && <p className="text-sage text-sm font-body">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-plum text-paper font-body font-medium rounded-xl py-3.5 disabled:opacity-60"
        >
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="w-full text-center text-sm font-body text-ink/50 mt-5"
      >
        {mode === "signin" ? "Ainda nao tens conta? Cria uma" : "Ja tens conta? Inicia sessao"}
      </button>
    </div>
  );
}
