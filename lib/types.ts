export type MacroCategory = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  macro_category_id: string;
  name: string;
  created_at: string;
};

export type Moment = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  category_id: string | null;
  moment_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  recurring: boolean;
  created_at: string;
};

export const PALETTE = [
  { name: "plum", hex: "#4B2E56" },
  { name: "sage", hex: "#7C9473" },
  { name: "gold", hex: "#D9A441" },
  { name: "coral", hex: "#D9704F" },
  { name: "teal", hex: "#3E7C7B" },
  { name: "slate", hex: "#5A6B7A" },
];
