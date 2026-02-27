import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettingRow = { key: string; value: any };

async function fetchSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const map: Record<string, any> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: fetchSiteSettings,
    staleTime: 30_000,
  });
}

export function getSetting<T>(settings: Record<string, any> | undefined, key: string, fallback: T): T {
  if (!settings) return fallback;
  return (settings[key] as T) ?? fallback;
}
