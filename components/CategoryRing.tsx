"use client";

export type RingSegment = {
  name: string;
  value: number;
  color: string;
};

function formatEuro(n: number) {
  return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

const SIZE = 240;
const STROKE = 20;
const RADIUS = (SIZE - STROKE) / 2;
const GAP = 5.5; // percentagem da circunferencia reservada como espaco entre segmentos

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
  const active = segments.filter((s) => s.value > 0);
  const sum = active.reduce((a, s) => a + s.value, 0);
  const gapTotal = GAP * Math.max(active.length, 1);
  const available = Math.max(0, 100 - gapTotal);

  let cursor = 0;
  const arcs = active.map((s) => {
    const length = sum > 0 ? (s.value / sum) * available : 0;
    const offset = cursor;
    cursor += length + GAP;
    return { ...s, length, offset };
  });

  const overBudget = budget !== null && total > budget;
  const center = SIZE / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke="#EDE3CC"
            strokeWidth={STROKE}
          />
          {arcs.length === 0 ? null : (
            <g transform={`rotate(-90 ${center} ${center})`}>
              {arcs.map((a) => (
                <circle
                  key={a.name}
                  cx={center}
                  cy={center}
                  r={RADIUS}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${a.length} ${100 - a.length}`}
                  strokeDashoffset={-a.offset}
                />
              ))}
            </g>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className={`font-body text-[2.6rem] leading-none font-extrabold tracking-tight ${overBudget ? "text-coral" : "text-ink"}`}>
            {formatEuro(total)}
          </span>
          <span className="text-xs text-ink/50 font-body mt-2">{centerLabel}</span>
          {budget !== null && (
            <span className="text-[11px] text-ink/40 font-body mt-0.5">de {formatEuro(budget)}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 w-full">
        {active
          .sort((a, b) => b.value - a.value)
          .map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-sm font-body">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate flex-1 text-ink/80">{s.name}</span>
              <span className="text-ink/50 text-xs">{formatEuro(s.value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export { formatEuro };
