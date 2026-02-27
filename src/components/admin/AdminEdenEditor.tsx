import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "@/hooks/use-toast";
import { pickSection, usePageBlocks } from "@/hooks/content/usePageContent";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";

import { buildMediaAssetMap, resolveMediaRef } from "@/lib/media";
import { upsertSingletonPageSection } from "@/lib/pageContent";

import {
  EDEN_HOME_FALLBACK,
  type EdenGalleryCategory,
  type EdenGalleryItem,
  type EdenGallerySizeClass,
  type EdenMenuPercorso,
} from "@/content/fallbackEdenHome";

function moveInArray<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

const CATEGORY_OPTIONS: Array<{ value: EdenGalleryCategory; label: string }> = [
  { value: "food", label: "Food" },
  { value: "location", label: "Location" },
  { value: "events", label: "Eventi" },
];

const SIZE_OPTIONS: Array<{ value: EdenGallerySizeClass; label: string }> = [
  { value: "item-large", label: "Large" },
  { value: "item-wide", label: "Wide" },
  { value: "item-tall", label: "Tall" },
];

export default function AdminEdenEditor() {
  const qc = useQueryClient();
  const blocks = usePageBlocks("home");
  const media = useMediaAssets();
  const assetsById = useMemo(() => buildMediaAssetMap(media.data), [media.data]);

  const fallbackMenu = EDEN_HOME_FALLBACK.eden_menu;
  const fallbackGallery = EDEN_HOME_FALLBACK.eden_gallery;

  const [menu, setMenu] = useState<{ percorsi: EdenMenuPercorso[] }>(() => pickSection(blocks.data, "eden_menu", fallbackMenu));
  const [gallery, setGallery] = useState<{ items: EdenGalleryItem[] }>(() => pickSection(blocks.data, "eden_gallery", fallbackGallery));

  // Hydrate best-effort (senza schiacciare le modifiche locali)
  useMemo(() => {
    if (!blocks.data) return;
    setMenu((prev) => (prev === fallbackMenu ? pickSection(blocks.data, "eden_menu", prev) : prev));
    setGallery((prev) => (prev === fallbackGallery ? pickSection(blocks.data, "eden_gallery", prev) : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks.data]);

  const [picker, setPicker] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  const canSave = !blocks.isPending;

  async function saveAll() {
    try {
      await upsertSingletonPageSection("home", "eden_menu", menu);
      await upsertSingletonPageSection("home", "eden_gallery", gallery);
      await qc.invalidateQueries({ queryKey: ["page_content", "home"] });
      toast({ title: "EDEN salvato" });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Salvataggio fallito", variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">EDEN (Home)</h2>
          <p className="text-sm text-muted-foreground">Percorsi cucina + Gallery, collegati al backend (con fallback).</p>
        </div>
        <Button disabled={!canSave} onClick={saveAll}>
          Salva
        </Button>
      </div>

      <Tabs defaultValue="menu">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="menu">Percorsi cucina</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Percorsi</div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setMenu((p) => ({
                  ...p,
                  percorsi: [
                    ...p.percorsi,
                    { key: "terra", label: "Nuovo percorso", title: "TITOLO", price: 0, sections: [{ title: "Sezione", items: [] }], notes: [] },
                  ],
                }))
              }
            >
              + Percorso
            </Button>
          </div>

          <div className="space-y-4">
            {menu.percorsi.map((p, idx) => (
              <div key={`${p.key}-${idx}`} className="rounded-md border p-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-2 sm:grid-cols-4 flex-1">
                    <div className="sm:col-span-1">
                      <div className="text-xs text-muted-foreground mb-1">Key</div>
                      <Select value={p.key} onValueChange={(v) => setMenu((s) => ({ ...s, percorsi: s.percorsi.map((x, i) => (i === idx ? { ...x, key: v as any } : x)) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="terra">terra</SelectItem>
                          <SelectItem value="mare">mare</SelectItem>
                          <SelectItem value="scoperta">scoperta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-1">
                      <div className="text-xs text-muted-foreground mb-1">Label</div>
                      <Input value={p.label} onChange={(e) => setMenu((s) => ({ ...s, percorsi: s.percorsi.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)) }))} />
                    </div>
                    <div className="sm:col-span-1">
                      <div className="text-xs text-muted-foreground mb-1">Titolo</div>
                      <Input value={p.title} onChange={(e) => setMenu((s) => ({ ...s, percorsi: s.percorsi.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)) }))} />
                    </div>
                    <div className="sm:col-span-1">
                      <div className="text-xs text-muted-foreground mb-1">Prezzo</div>
                      <Input
                        inputMode="numeric"
                        value={String(p.price)}
                        onChange={(e) => setMenu((s) => ({ ...s, percorsi: s.percorsi.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value || 0) } : x)) }))}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <div className="text-xs text-muted-foreground mb-1">Extra prezzo (opzionale)</div>
                      <Input value={p.priceExtra ?? ""} onChange={(e) => setMenu((s) => ({ ...s, percorsi: s.percorsi.map((x, i) => (i === idx ? { ...x, priceExtra: e.target.value || undefined } : x)) }))} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <ReorderButtons index={idx} total={menu.percorsi.length} onMove={(from, to) => setMenu((s) => ({ ...s, percorsi: moveInArray(s.percorsi, from, to) }))} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => setMenu((s) => ({ ...s, percorsi: s.percorsi.filter((_, i) => i !== idx) }))}>
                      Elimina
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Sezioni</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMenu((s) => ({
                          ...s,
                          percorsi: s.percorsi.map((x, i) =>
                            i === idx ? { ...x, sections: [...x.sections, { title: "Nuova sezione", items: [] }] } : x,
                          ),
                        }))
                      }
                    >
                      + Sezione
                    </Button>
                  </div>

                  {p.sections.map((sec, sIdx) => (
                    <div key={`${sec.title}-${sIdx}`} className="rounded-md border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={sec.title}
                          onChange={(e) =>
                            setMenu((s) => ({
                              ...s,
                              percorsi: s.percorsi.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      sections: x.sections.map((ss, j) => (j === sIdx ? { ...ss, title: e.target.value } : ss)),
                                    }
                                  : x,
                              ),
                            }))
                          }
                          placeholder="Titolo sezione"
                        />
                        <div className="flex items-center gap-2">
                          <ReorderButtons
                            index={sIdx}
                            total={p.sections.length}
                            onMove={(from, to) =>
                              setMenu((s) => ({
                                ...s,
                                percorsi: s.percorsi.map((x, i) =>
                                  i === idx ? { ...x, sections: moveInArray(x.sections, from, to) } : x,
                                ),
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setMenu((s) => ({
                                ...s,
                                percorsi: s.percorsi.map((x, i) =>
                                  i === idx ? { ...x, sections: x.sections.filter((_, j) => j !== sIdx) } : x,
                                ),
                              }))
                            }
                          >
                            X
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Items (uno per riga)</div>
                      <Textarea
                        value={(sec.items ?? []).join("\n")}
                        onChange={(e) =>
                          setMenu((s) => ({
                            ...s,
                            percorsi: s.percorsi.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    sections: x.sections.map((ss, j) =>
                                      j === sIdx
                                        ? { ...ss, items: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean) }
                                        : ss,
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                        className="min-h-[90px]"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-sm font-medium">Note (opzionale)</div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setMenu((s) => ({
                          ...s,
                          percorsi: s.percorsi.map((x, i) =>
                            i === idx ? { ...x, notes: [...(x.notes ?? []), { label: "Nuova nota", items: [] }] } : x,
                          ),
                        }))
                      }
                    >
                      + Nota
                    </Button>
                  </div>

                  {(p.notes ?? []).map((n, nIdx) => (
                    <div key={`${n.label}-${nIdx}`} className="rounded-md border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={n.label}
                          onChange={(e) =>
                            setMenu((s) => ({
                              ...s,
                              percorsi: s.percorsi.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      notes: (x.notes ?? []).map((nn, j) => (j === nIdx ? { ...nn, label: e.target.value } : nn)),
                                    }
                                  : x,
                              ),
                            }))
                          }
                          placeholder="Label nota"
                        />
                        <div className="flex items-center gap-2">
                          <ReorderButtons
                            index={nIdx}
                            total={(p.notes ?? []).length}
                            onMove={(from, to) =>
                              setMenu((s) => ({
                                ...s,
                                percorsi: s.percorsi.map((x, i) =>
                                  i === idx ? { ...x, notes: moveInArray(x.notes ?? [], from, to) } : x,
                                ),
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setMenu((s) => ({
                                ...s,
                                percorsi: s.percorsi.map((x, i) =>
                                  i === idx ? { ...x, notes: (x.notes ?? []).filter((_, j) => j !== nIdx) } : x,
                                ),
                              }))
                            }
                          >
                            X
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Items (uno per riga, opzionale)</div>
                      <Textarea
                        value={(n.items ?? []).join("\n")}
                        onChange={(e) =>
                          setMenu((s) => ({
                            ...s,
                            percorsi: s.percorsi.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    notes: (x.notes ?? []).map((nn, j) =>
                                      j === nIdx
                                        ? { ...nn, items: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean) }
                                        : nn,
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                        className="min-h-[80px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Items</div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setGallery((p) => ({
                  ...p,
                  items: [
                    ...p.items,
                    { category: "food", title: "Nuova", tag: "Food", alt: "", sizeClass: undefined, src: "" },
                  ],
                }))
              }
            >
              + Item
            </Button>
          </div>

          <div className="space-y-4">
            {gallery.items.map((it, idx) => {
              const src = resolveMediaRef(it.assetId ? ({ assetId: it.assetId } as any) : it.src ? ({ src: it.src } as any) : null, assetsById);
              return (
                <div key={`${it.title}-${idx}`} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-2 sm:grid-cols-12 flex-1">
                      <div className="sm:col-span-3">
                        <div className="text-xs text-muted-foreground mb-1">Categoria</div>
                        <Select
                          value={it.category}
                          onValueChange={(v) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, category: v as any } : x)) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-3">
                        <div className="text-xs text-muted-foreground mb-1">Size</div>
                        <Select
                          value={it.sizeClass ?? ""}
                          onValueChange={(v) =>
                            setGallery((s) => ({
                              ...s,
                              items: s.items.map((x, i) => (i === idx ? { ...x, sizeClass: (v || undefined) as any } : x)),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Default</SelectItem>
                            {SIZE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-3">
                        <div className="text-xs text-muted-foreground mb-1">Tag</div>
                        <Input value={it.tag} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, tag: e.target.value } : x)) }))} />
                      </div>

                      <div className="sm:col-span-3">
                        <div className="text-xs text-muted-foreground mb-1">Titolo</div>
                        <Input value={it.title} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)) }))} />
                      </div>

                      <div className="sm:col-span-8">
                        <div className="text-xs text-muted-foreground mb-1">Alt</div>
                        <Input value={it.alt} onChange={(e) => setGallery((s) => ({ ...s, items: s.items.map((x, i) => (i === idx ? { ...x, alt: e.target.value } : x)) }))} />
                      </div>

                      <div className="sm:col-span-4">
                        <div className="text-xs text-muted-foreground mb-1">Src esterno (opzionale)</div>
                        <Input
                          value={it.src ?? ""}
                          onChange={(e) =>
                            setGallery((s) => ({
                              ...s,
                              items: s.items.map((x, i) => (i === idx ? { ...x, src: e.target.value, assetId: undefined } : x)),
                            }))
                          }
                          placeholder="https://..."
                        />
                      </div>

                      <div className="sm:col-span-12">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <Button type="button" variant="outline" onClick={() => setPicker({ open: true, index: idx })}>
                            Scegli immagine da Media
                          </Button>
                          {src ? (
                            <div className="flex-1 rounded-md border bg-card p-2">
                              <img src={src} alt={it.alt || it.title} className="h-28 w-full object-cover rounded" loading="lazy" />
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
        </TabsContent>
      </Tabs>

      <MediaPickerDialog
        open={picker.open}
        onOpenChange={(v) => setPicker((p) => ({ ...p, open: v }))}
        assets={media.data ?? []}
        pageFilter="eden"
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
    </div>
  );
}
