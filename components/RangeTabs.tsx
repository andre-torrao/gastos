"use client";

export type RangeMode = "dia" | "semana" | "mes";

const OPTIONS: { value: RangeMode; label: string }[] = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

export default function RangeTabs({
  value,
  onChange,
}: {
  value: RangeMode;
  onChange: (v: RangeMode) => void;
}) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium border transition-colors ${
              active
                ? "bg-gold border-gold text-ink"
                : "bg-transparent border-ink/15 text-ink/50"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
