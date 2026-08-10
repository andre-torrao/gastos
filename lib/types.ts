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
  type: "moment" | "credit";
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
  recurring_until: string | null;
  account: "principal" | "poupanca" | "subsidio_refeicao";
  notes: string | null;
  created_at: string;
};

export const PALETTE = [
  { name: "butter", hex: "#EFC94C" },
  { name: "sage", hex: "#9CB380" },
  { name: "sky", hex: "#A9C2E0" },
  { name: "blush", hex: "#EFAFC4" },
  { name: "lilac", hex: "#B9A8D6" },
  { name: "clay", hex: "#D9A98A" },
];
