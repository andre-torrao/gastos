import { supabase } from "./supabaseClient";
import { DEFAULT_MACRO_CATEGORIES } from "./defaultCategories";

export async function ensureDefaultCategories(userId: string) {
  const { data } = await supabase.from("macro_categories").select("*").eq("user_id", userId);
  if (data && data.length === 0) {
    await supabase
      .from("macro_categories")
      .insert(DEFAULT_MACRO_CATEGORIES.map((c) => ({ ...c, user_id: userId })));
  }
}
