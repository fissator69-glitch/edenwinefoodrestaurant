import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteFooterContent = {
  brandName?: string;
  description?: string;
  designBy?: string;
  sections?: Array<{ label: string; href: string }>;
};

async function fetchSiteFooter() {
  const { data, error } = await supabase.from("site_footer").select("content").limit(1).maybeSingle();
  if (error) throw error;
  return (data?.content ?? null) as SiteFooterContent | null;
}

export function useSiteFooter() {
  return useQuery({
    queryKey: ["site_footer"],
    queryFn: fetchSiteFooter,
    staleTime: 30_000,
  });
}
