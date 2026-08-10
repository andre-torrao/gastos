"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, LayoutGrid, Tags, User, Plus } from "lucide-react";

const LEFT_ITEMS = [
  { href: "/", label: "Mês", icon: LayoutGrid },
  { href: "/moments", label: "Momentos", icon: Sparkles },
];

const RIGHT_ITEMS = [
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/profile", label: "Perfil", icon: User },
];

export default function Nav({ onAdd }: { onAdd?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleCenterTap() {
    if (onAdd) {
      onAdd();
    } else {
      router.push("/?new=1");
    }
  }

  function renderItem({ href, label, icon: Icon }: (typeof LEFT_ITEMS)[number]) {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl transition-colors ${
          active ? "text-paper" : "text-paper/50"
        }`}
      >
        <Icon size={18} />
        <span className="text-[10px] font-body">{label}</span>
      </Link>
    );
  }

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[27rem] z-40"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
    >
      <div className="relative bg-ink rounded-xl2 shadow-xl px-2 py-1.5 flex items-center justify-between">
        {LEFT_ITEMS.map(renderItem)}

        <div className="w-16 shrink-0" />

        {RIGHT_ITEMS.map(renderItem)}

        <button
          onClick={handleCenterTap}
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-gold text-ink flex items-center justify-center shadow-lg border-4 border-paper"
          aria-label="Adicionar gasto"
        >
          <Plus size={24} />
        </button>
      </div>
    </nav>
  );
}
