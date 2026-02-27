import { supabase } from "@/integrations/supabase/client";

/**
 * Admin helper: salva una section come singleton.
 * Strategia semplice e robusta: delete + insert.
 */
export async function upsertSingletonPageSection(page: string, section: string, content: any) {
  const { error: delErr } = await supabase.from("page_content").delete().eq("page", page).eq("section", section);
  if (delErr) throw delErr;
  const { error: insErr } = await supabase.from("page_content").insert({ page, section, order: 0, content });
  if (insErr) throw insErr;
}
