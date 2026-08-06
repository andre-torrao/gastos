"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function MonthSwitcher({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    onChange(y, m);
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button onClick={() => shift(-1)} className="p-2 text-ink/50">
        <ChevronLeft size={20} />
      </button>
      <span className="font-display text-lg font-medium min-w-[9rem] text-center">
        {MONTHS[month]} {year}
      </span>
      <button onClick={() => shift(1)} className="p-2 text-ink/50">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
