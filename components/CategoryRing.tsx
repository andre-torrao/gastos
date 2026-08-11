"use client";

export type RingSegment = {
  name: string;
  paid: number;
  pending: number;
  color: string;
};

function formatEuro(n: number) {
  return n.toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const RING_BOX = 240; // tamanho do proprio anel (mantem o espaco interior do texto igual)
const STROKE = 20;
const PADDING = 26; // moldura a volta do anel, dentro do seu quadro
const SIZE = RING_BOX + PADDING * 2;
const RADIUS = (RING_BOX - STROKE) / 2;
const GAP = 5.5; // percentagem da circunferencia reservada como espaco entre categorias
const PENDING_ALPHA = "4D"; // ~30% opacidade para a parte "por pagar"

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
  const active = segments.filter((s) => s.paid + s.pending > 0);
  const sum = active.reduce((a, s) => a + s.paid + s.pending, 0);
  const gapTotal = GAP * Math.max(active.length, 1);
  const available = Math.max(0, 100 - gapTotal);

  let cursor = 0;
  const arcs = active.map((s) => {
    const catTotal = s.paid + s.pending;
    const length = sum > 0 ? (catTotal / sum) * available : 0;
    const paidLength = catTotal > 0 ? (s.paid / catTotal) * length : 0;
    const pendingLength = length - paidLength;
    const paidOffset = cursor;
    const pendingOffset = cursor + paidLength;
    cursor += length + GAP;
    return { ...s, catTotal, paidLength, pendingLength, paidOffset, pendingOffset };
  });

  const overBudget = budget !== null && total > budget;
  const center = SIZE / 2;
  const totalPaid = active.reduce((a, s) => a + s.paid, 0);
  const totalPending = active.reduce((a, s) => a + s.pending, 0);

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
                <g key={a.name}>
                  {a.paidLength > 0 && (
                    <circle
                      cx={center}
                      cy={center}
                      r={RADIUS}
                      fill="none"
                      stroke={a.color}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={`${a.paidLength} ${100 - a.paidLength}`}
                      strokeDashoffset={-a.paidOffset}
                    />
                  )}
                  {a.pendingLength > 0 && (
                    <circle
                      cx={center}
                      cy={center}
                      r={RADIUS}
                      fill="none"
                      stroke={a.color + PENDING_ALPHA}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={`${a.pendingLength} ${100 - a.pendingLength}`}
                      strokeDashoffset={-a.pendingOffset}
                    />
                  )}
                </g>
              ))}
            </g>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className={`font-body text-[2.2rem] leading-none font-extrabold tracking-tight ${overBudget ? "text-coral" : "text-ink"}`}>
            {formatEuro(total)}
          </span>
          <span className="text-xs text-ink/50 font-body mt-2">{centerLabel}</span>
          {budget !== null && (
            <span className="text-[11px] text-ink/40 font-body mt-0.5">de {formatEuro(budget)}</span>
          )}
          <div className="flex flex-col items-center gap-0.5 mt-3">
            <span className="flex items-center gap-1 text-[10px] font-body text-ink/50">
              <span className="w-2 h-2 rounded-full bg-ink/70" /> Pago {formatEuro(totalPaid)}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-body text-ink/50">
              <span className="w-2 h-2 rounded-full bg-ink/20" /> Por pagar {formatEuro(totalPending)}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 w-full">
        {active
          .sort((a, b) => b.paid + b.pending - (a.paid + a.pending))
          .map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-sm font-body">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate flex-1 text-ink/80">{s.name}</span>
              <span className="text-ink/50 text-xs">{formatEuro(s.paid + s.pending)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export { formatEuro };
