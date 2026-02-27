import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  order: number;
  enabled: boolean;
};

async function fetchSocialLinks(includeDisabled = false) {
  let q = supabase.from("social_links").select("id,platform,url,order,enabled").order("order", { ascending: true });
  if (!includeDisabled) q = q.eq("enabled", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SocialLink[];
}

export function useSocialLinks(opts?: { includeDisabled?: boolean }) {
  return useQuery({
    queryKey: ["social_links", { includeDisabled: Boolean(opts?.includeDisabled) }],
    queryFn: () => fetchSocialLinks(Boolean(opts?.includeDisabled)),
    staleTime: 15_000,
  });
}
