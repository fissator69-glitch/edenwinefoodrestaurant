import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/hooks/content/useMediaAssets";
import { buildMediaAssetMap, publicUrl } from "@/lib/media";

export type MediaPickerValue = { assetId: string } | null;

export default function MediaPickerDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assets: MediaAsset[];
  value: MediaPickerValue;
  onPick: (v: MediaPickerValue) => void;
}) {
  const { open, onOpenChange, assets, value, onPick } = props;
  const [q, setQ] = useState("");

  const assetsById = useMemo(() => buildMediaAssetMap(assets), [assets]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return assets;
    return assets.filter((a) => {
      const hay = `${a.path} ${(a.alt ?? "")} ${(a.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [assets, q]);

  const selectedId = value?.assetId ?? "";
  const selected = selectedId ? assetsById[selectedId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scegli immagine da Media</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome file, alt o tag…" />

          {selected ? (
            <div className="rounded-md border bg-card p-3">
              <div className="text-xs text-muted-foreground mb-2 break-all">Selezionata: {selected.bucket}/{selected.path}</div>
              <img
                src={publicUrl(selected.bucket, selected.path)}
                alt={selected.alt ?? "Anteprima media"}
                className="h-40 w-full object-cover rounded"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-auto pr-1">
            {filtered.map((a) => {
              const isActive = a.id === selectedId;
              const src = publicUrl(a.bucket, a.path);
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`rounded-md border text-left overflow-hidden ${isActive ? "ring-2 ring-ring" : ""}`.trim()}
                  onClick={() => onPick({ assetId: a.id })}
                >
                  <img src={src} alt={a.alt ?? a.path} className="h-28 w-full object-cover" loading="lazy" />
                  <div className="p-2">
                    <div className="text-xs break-all">{a.path}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onPick(null)}>
              Rimuovi selezione
            </Button>
            <Button onClick={() => onOpenChange(false)}>Fatto</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
