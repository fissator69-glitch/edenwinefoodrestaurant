import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { MediaAsset } from "@/hooks/content/useMediaAssets";
import { buildMediaAssetMap, publicUrl } from "@/lib/media";

export type MediaPickerValue = { assetId: string } | null;

export type MediaPickerPageFilter = "eden" | "locanda" | "masseria" | null;

export default function MediaPickerDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assets: MediaAsset[];
  value: MediaPickerValue;
  onPick: (v: MediaPickerValue) => void;
  pageFilter?: MediaPickerPageFilter;
  showAllToggle?: boolean;
}) {
  const { open, onOpenChange, assets, value, onPick, pageFilter, showAllToggle = true } = props;
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState<boolean>(() => pageFilter === undefined);

  const assetsById = useMemo(() => buildMediaAssetMap(assets), [assets]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let base = assets;
    if (pageFilter !== undefined && !showAll) {
      base = base.filter((a) => (a.page ?? null) === pageFilter);
    }

    if (!qq) return base;
    return base.filter((a) => {
      const hay = `${a.path} ${(a.alt ?? "")} ${(a.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [assets, pageFilter, q, showAll]);

  const selectedId = value?.assetId ?? "";
  const selected = selectedId ? assetsById[selectedId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scegli immagine da Media</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome file, alt o tag…" />

            {pageFilter !== undefined && showAllToggle ? (
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <Checkbox checked={showAll} onCheckedChange={(v) => setShowAll(Boolean(v))} />
                Mostra tutti
              </label>
            ) : null}
          </div>

          {selected ? (
            <div className="rounded-md border bg-card p-3">
              <div className="text-xs text-muted-foreground mb-2 break-all">
                Selezionata: {selected.bucket}/{selected.path}
              </div>
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
                    {a.page ? <div className="text-[11px] text-muted-foreground">{a.page}</div> : <div className="text-[11px] text-muted-foreground">non assegnata</div>}
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
