import type { MediaAsset } from "@/hooks/content/useMediaAssets";
import { supabase } from "@/integrations/supabase/client";

export type MediaRef =
  | { assetId: string }
  | { bucket: string; path: string }
  | { src: string };

export function publicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function buildMediaAssetMap(assets: MediaAsset[] | undefined) {
  const map: Record<string, MediaAsset> = {};
  for (const a of assets ?? []) map[a.id] = a;
  return map;
}

export function resolveMediaRef(ref: MediaRef | null | undefined, assetsById?: Record<string, MediaAsset>) {
  if (!ref) return "";
  if ("src" in ref && ref.src) return ref.src;
  if ("bucket" in ref && ref.bucket && ref.path) return publicUrl(ref.bucket, ref.path);
  if ("assetId" in ref && assetsById?.[ref.assetId]) {
    const a = assetsById[ref.assetId];
    return publicUrl(a.bucket, a.path);
  }
  return "";
}
