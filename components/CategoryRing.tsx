"use client";

export type RingSegment = {
  name: string;
  value: number;
  color: string;
};

function formatEuro(n: number) {
  return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default function CategoryRing({
  segments,
  total,
  budget,
  centerLabel,
}: {
  segments: RingSegment[];
  total: number;
  budget: number | null;
  centerLabel: string;
}) {
  const sum = segments.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = sum > 0 ? (acc / sum) * 360 : 0;
      acc += s.value;
      const end = sum > 0 ? (acc / sum) * 360 : 0;
      return `${s.color} ${start}deg ${end}deg`;
    });

  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "#E7E2DD";

  const overBudget = budget !== null && total > budget;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-56 h-56 rounded-full flex items-center justify-center"
        style={{ background: gradient }}
      >
        <div className="absolute w-40 h-40 rounded-full bg-paper flex flex-col items-center justify-center text-center shadow-inner">
          <span className="text-[11px] uppercase tracking-wide text-ink/50 font-body">
            {centerLabel}
          </span>
          <span className={`font-display text-3xl font-semibold ${overBudget ? "text-coral" : "text-ink"}`}>
            {formatEuro(total)}
          </span>
          {budget !== null && (
            <span className="text-[11px] text-ink/50 font-body mt-0.5">
              de {formatEuro(budget)}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-5 w-full">
        {segments
          .filter((s) => s.value > 0)
          .sort((a, b) => b.value - a.value)
          .map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-sm font-body">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate flex-1 text-ink/80">{s.name}</span>
              <span className="text-ink/60 text-xs">{formatEuro(s.value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export { formatEuro };
