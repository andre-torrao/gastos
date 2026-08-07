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
    <div className="flex bg-white border border-ink/10 rounded-full p-1 gap-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 text-xs font-body py-2 rounded-full transition-colors ${
            value === o.value ? "bg-plum text-paper" : "text-ink/50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
