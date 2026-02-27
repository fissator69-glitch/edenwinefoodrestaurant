import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageBlock = {
  id: string;
  page: string;
  section: string;
  order: number;
  content: any;
};

async function fetchPageBlocks(page: string) {
  const { data, error } = await supabase
    .from("page_content")
    .select("id,page,section,order,content")
    .eq("page", page)
    .order("section", { ascending: true })
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PageBlock[];
}

export function usePageBlocks(page: "home" | "locanda" | "masseria") {
  return useQuery({
    queryKey: ["page_content", page],
    queryFn: () => fetchPageBlocks(page),
    staleTime: 10_000,
  });
}

export function pickSection<T>(blocks: PageBlock[] | undefined, section: string, fallback: T): T {
  if (!blocks) return fallback;
  const row = blocks.find((b) => b.section === section);
  return (row?.content as T) ?? fallback;
}
