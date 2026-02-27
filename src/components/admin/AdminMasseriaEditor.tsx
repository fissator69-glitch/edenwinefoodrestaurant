import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "@/hooks/use-toast";
import { pickSection, usePageBlocks } from "@/hooks/content/usePageContent";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";

import MediaPickerDialog from "@/components/admin/MediaPickerDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";

import { buildMediaAssetMap, resolveMediaRef } from "@/lib/media";
import { upsertSingletonPageSection } from "@/lib/pageContent";
import { MASSERIA_FALLBACK, type MasseriaHeroContent, type MasseriaPolaroidItem } from "@/content/fallbackMasseria";

function moveInArray<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

export default function AdminMasseriaEditor() {
  const qc = useQueryClient();
  const blocks = usePageBlocks("masseria");
  const media = useMediaAssets();
  const assetsById = useMemo(() => buildMediaAssetMap(media.data), [media.data]);

  const [hero, setHero] = useState<MasseriaHeroContent>(() => pickSection(blocks.data, "hero", MASSERIA_FALLBACK.hero));
  const [gallery, setGallery] = useState<{ items: MasseriaPolaroidItem[] }>(() => pickSection(blocks.data, "gallery", MASSERIA_FALLBACK.gallery));
  const [note, setNote] = useState<{ text: string }>(() => pickSection(blocks.data, "note", MASSERIA_FALLBACK.note));

  // Hydrate best-effort
  useMemo(() => {
    if (!blocks.data) return;
    setHero((prev) => (prev === MASSERIA_FALLBACK.hero ? pickSection(blocks.data, "hero", prev) : prev));
    setGallery((prev) => (prev === MASSERIA_FALLBACK.gallery ? pickSection(blocks.data, "gallery", prev) : prev));
    setNote((prev) => (prev === MASSERIA_FALLBACK.note ? pickSection(blocks.data, "note", prev) : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks.data]);

  const [picker, setPicker] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  const canSave = !blocks.isPending;

  async function saveAll() {
    try {
      await upsertSingletonPageSection("masseria", "hero", hero);
      await upsertSingletonPageSection("masseria", "gallery", gallery);
      await upsertSingletonPageSection("masseria", "note", note);
      await qc.invalidateQueries({ queryKey: ["page_content", "masseria"] });
      toast({ title: "Masseria salvata" });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Salvataggio fallito", variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Masseria</h2>
          <p className="text-sm text-muted-foreground">Hero + Gallery (polaroid) + Nota.</p>
        </div>
        <Button disabled={!canSave} onClick={saveAll}>
          Salva
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="note">Nota</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Descrizione</div>
            <Textarea value={hero.description} onChange={(e) => setHero((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="text-xs text-muted-foreground">
            CTA: in pagina sono gestite da Link &amp; CTA (Sito → Link &amp; CTA).
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Polaroid</div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setGallery((p) => ({
                  ...p,
                  items: [
                    ...p.items,
                    { alt: "", caption: "", tiltClass: "tilt-1", src: "" },
                  ],
                }))
              }
            >
              + Polaroid
            </Button>
          </div>

          <div className="space-y-4">
            {gallery.items.map((it, idx) => {
              const src = resolveMediaRef(it.assetId ? ({ assetId: it.assetId } as any) : it.src ? ({ src: it.src } as any) : null, assetsById);
              return (
                <div key={`${it.alt}-${idx}`} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-2 sm:grid-cols-12 flex-1">
                      <div className="sm:col-span-4">
                        <div className="text-xs text-muted-foreground mb-1">Tilt class</div>
                        <Input value={it.tiltClass} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, tiltClass: e.target.value } : x)) }))} />
                      </div>
                      <div className="sm:col-span-8">
                        <div className="text-xs text-muted-foreground mb-1">Alt</div>
                        <Input value={it.alt} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, alt: e.target.value } : x)) }))} />
                      </div>
                      <div className="sm:col-span-8">
                        <div className="text-xs text-muted-foreground mb-1">Caption (opzionale)</div>
                        <Input value={it.caption ?? ""} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, caption: e.target.value || undefined } : x)) }))} />
                      </div>
                      <div className="sm:col-span-4">
                        <div className="text-xs text-muted-foreground mb-1">Src esterno (opzionale)</div>
                        <Input value={it.src ?? ""} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, src: e.target.value, assetId: undefined } : x)) }))} placeholder="https://..." />
                      </div>

                      <div className="sm:col-span-12">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <Button type="button" variant="outline" onClick={() => setPicker({ open: true, index: idx })}>
                            Scegli immagine da Media
                          </Button>
                          {src ? (
                            <div className="flex-1 rounded-md border bg-card p-2">
                              <img src={src} alt={it.alt || "Anteprima"} className="h-28 w-full object-cover rounded" loading="lazy" />
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Nessuna immagine selezionata.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <ReorderButtons index={idx} total={gallery.items.length} onMove={(from, to) => setGallery((s) => ({ ...s, items: moveInArray(s.items, from, to) }))} />
                      <Button type="button" variant="destructive" size="sm" onClick={() => setGallery((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }))}>
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <MediaPickerDialog
            open={picker.open}
            onOpenChange={(v) => setPicker((p) => ({ ...p, open: v }))}
            assets={media.data ?? []}
            pageFilter="masseria"
            value={picker.index === null ? null : gallery.items[picker.index]?.assetId ? { assetId: gallery.items[picker.index]!.assetId! } : null}
            onPick={(v) => {
              const i = picker.index;
              if (i === null) return;
              setGallery((p) => ({
                ...p,
                items: p.items.map((x, idx) => (idx === i ? { ...x, assetId: v?.assetId, src: v?.assetId ? undefined : x.src } : x)),
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="note" className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Testo</div>
            <Textarea value={note.text} onChange={(e) => setNote({ text: e.target.value })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
