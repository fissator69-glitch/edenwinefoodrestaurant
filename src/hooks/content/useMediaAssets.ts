import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MediaAsset = {
  id: string;
  bucket: string;
  path: string;
  alt: string | null;
  tags: string[];
  created_at: string;
  page: string | null;
};

async function fetchMediaAssets() {
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,bucket,path,alt,tags,created_at,page")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export function useMediaAssets() {
  return useQuery({
    queryKey: ["media_assets"],
    queryFn: fetchMediaAssets,
    staleTime: 10_000,
  });
}
