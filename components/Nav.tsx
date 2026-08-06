"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Sparkles, Tags, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

const items = [
  { href: "/", label: "Mes", icon: LayoutGrid },
  { href: "/moments", label: "Momentos", icon: Sparkles },
  { href: "/categories", label: "Categorias", icon: Tags },
];

export default function Nav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[27rem] bg-ink text-paper rounded-xl2 shadow-xl px-2 py-2 flex items-center justify-between z-40">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
              active ? "bg-paper text-ink" : "text-paper/70"
            }`}
          >
            <Icon size={18} />
            <span className="text-[10px] font-body">{label}</span>
          </Link>
        );
      })}
      <button
        onClick={signOut}
        className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-paper/70"
      >
        <LogOut size={18} />
        <span className="text-[10px] font-body">Sair</span>
      </button>
    </nav>
  );
}
