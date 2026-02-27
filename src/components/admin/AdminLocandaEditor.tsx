import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

import { usePageBlocks } from "@/hooks/content/usePageContent";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";

import {
  LOCANDA_FALLBACK,
  type LocandaMenuSection,
  type LocandaGalleryItem,
  type LocandaHeroContent,
  pickLocandaSection,
} from "@/content/fallbackLocanda";
import { buildMediaAssetMap, resolveMediaRef } from "@/lib/media";

function moveInArray<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

async function upsertSingletonPageSection(page: string, section: string, content: any) {
  // Robust: replace all rows for (page, section)
  const { error: delErr } = await supabase.from("page_content").delete().eq("page", page).eq("section", section);
  if (delErr) throw delErr;
  const { error: insErr } = await supabase.from("page_content").insert({ page, section, order: 0, content });
  if (insErr) throw insErr;
}

export default function AdminLocandaEditor() {
  const qc = useQueryClient();
  const blocks = usePageBlocks("locanda");
  const media = useMediaAssets();
  const assetsById = useMemo(() => buildMediaAssetMap(media.data), [media.data]);

  const [hero, setHero] = useState<LocandaHeroContent>(() => pickLocandaSection(blocks.data, "hero", LOCANDA_FALLBACK.hero));
  const [menu, setMenu] = useState<{ sections: LocandaMenuSection[] }>(() =>
    pickLocandaSection(blocks.data, "menu", LOCANDA_FALLBACK.menu),
  );
  const [wines, setWines] = useState<{ sections: LocandaMenuSection[] }>(() =>
    pickLocandaSection(blocks.data, "wines", LOCANDA_FALLBACK.wines),
  );
  const [gallery, setGallery] = useState<{ items: LocandaGalleryItem[] }>(() =>
    pickLocandaSection(blocks.data, "gallery", LOCANDA_FALLBACK.gallery),
  );

  // Hydrate when backend arrives (best-effort, keep local edits)
  useMemo(() => {
    if (!blocks.data) return;
    setHero((prev) => (prev === LOCANDA_FALLBACK.hero ? pickLocandaSection(blocks.data, "hero", prev) : prev));
    setMenu((prev) => (prev === LOCANDA_FALLBACK.menu ? pickLocandaSection(blocks.data, "menu", prev) : prev));
    setWines((prev) => (prev === LOCANDA_FALLBACK.wines ? pickLocandaSection(blocks.data, "wines", prev) : prev));
    setGallery((prev) => (prev === LOCANDA_FALLBACK.gallery ? pickLocandaSection(blocks.data, "gallery", prev) : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks.data]);

  const [picker, setPicker] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  const canSave = !blocks.isPending;

  async function saveAll() {
    try {
      await upsertSingletonPageSection("locanda", "hero", hero);
      await upsertSingletonPageSection("locanda", "menu", menu);
      await upsertSingletonPageSection("locanda", "wines", wines);
      await upsertSingletonPageSection("locanda", "gallery", gallery);
      await qc.invalidateQueries({ queryKey: ["page_content", "locanda"] });
      toast({ title: "Locanda salvata" });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Salvataggio fallito", variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Locanda</h2>
          <p className="text-sm text-muted-foreground">Editor guidato (menu, vini e galleria) con preview.</p>
        </div>
        <Button disabled={!canSave} onClick={saveAll}>
          Salva
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="wines">Vini</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Descrizione</div>
            <Textarea value={hero.description} onChange={(e) => setHero((p) => ({ ...p, description: e.target.value }))} />
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Sezioni menù</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMenu((p) => ({ ...p, sections: [...p.sections, { title: "Nuova sezione", items: [] }] }))}
            >
              + Sezione
            </Button>
          </div>

          <div className="space-y-4">
            {menu.sections.map((sec, sIdx) => (
              <div key={`${sec.title}-${sIdx}`} className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Input
                    value={sec.title}
                    onChange={(e) =>
                      setMenu((p) => ({
                        ...p,
                        sections: p.sections.map((s, i) => (i === sIdx ? { ...s, title: e.target.value } : s)),
                      }))
                    }
                    placeholder="Titolo sezione"
                  />
                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      index={sIdx}
                      total={menu.sections.length}
                      onMove={(from, to) => setMenu((p) => ({ ...p, sections: moveInArray(p.sections, from, to) }))}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setMenu((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== sIdx) }))}
                    >
                      Elimina
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {sec.items.map((it, iIdx) => (
                    <div key={`${it.name}-${iIdx}`} className="grid gap-2 sm:grid-cols-12 items-start">
                      <div className="sm:col-span-4">
                        <Input
                          value={it.name}
                          onChange={(e) =>
                            setMenu((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx
                                  ? {
                                      ...s,
                                      items: s.items.map((x, xi) => (xi === iIdx ? { ...x, name: e.target.value } : x)),
                                    }
                                  : s,
                              ),
                            }))
                          }
                          placeholder="Nome"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <Input
                          value={it.desc}
                          onChange={(e) =>
                            setMenu((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx
                                  ? {
                                      ...s,
                                      items: s.items.map((x, xi) => (xi === iIdx ? { ...x, desc: e.target.value } : x)),
                                    }
                                  : s,
                              ),
                            }))
                          }
                          placeholder="Descrizione"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          value={it.price}
                          onChange={(e) =>
                            setMenu((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx
                                  ? {
                                      ...s,
                                      items: s.items.map((x, xi) => (xi === iIdx ? { ...x, price: e.target.value } : x)),
                                    }
                                  : s,
                              ),
                            }))
                          }
                          placeholder="Prezzo"
                        />
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-end gap-2">
                        <ReorderButtons
                          index={iIdx}
                          total={sec.items.length}
                          onMove={(from, to) =>
                            setMenu((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx ? { ...s, items: moveInArray(s.items, from, to) } : s,
                              ),
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setMenu((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx ? { ...s, items: s.items.filter((_, xi) => xi !== iIdx) } : s,
                              ),
                            }))
                          }
                        >
                          X
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setMenu((p) => ({
                        ...p,
                        sections: p.sections.map((s, si) =>
                          si === sIdx
                            ? { ...s, items: [...s.items, { name: "", desc: "", price: "" }] }
                            : s,
                        ),
                      }))
                    }
                  >
                    + Piatto
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="locanda-menu-grid">
              {menu.sections.map((section) => (
                <article key={section.title} className="locanda-card reveal-card-fantasy" aria-label={section.title}>
                  <h3 className="locanda-card-title">{section.title}</h3>
                  <div className="locanda-list" role="list">
                    {section.items.map((it) => (
                      <div key={it.name + it.price} className="locanda-item" role="listitem">
                        <div className="locanda-item-main">
                          <div className="locanda-item-name">{it.name}</div>
                          <div className="locanda-item-desc">{it.desc}</div>
                        </div>
                        <div className="locanda-item-price">{it.price}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wines" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Sezioni vini</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWines((p) => ({ ...p, sections: [...p.sections, { title: "Nuova sezione", items: [] }] }))}
            >
              + Sezione
            </Button>
          </div>

          <div className="space-y-4">
            {wines.sections.map((sec, sIdx) => (
              <div key={`${sec.title}-${sIdx}`} className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Input
                    value={sec.title}
                    onChange={(e) =>
                      setWines((p) => ({
                        ...p,
                        sections: p.sections.map((s, i) => (i === sIdx ? { ...s, title: e.target.value } : s)),
                      }))
                    }
                    placeholder="Titolo sezione"
                  />
                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      index={sIdx}
                      total={wines.sections.length}
                      onMove={(from, to) => setWines((p) => ({ ...p, sections: moveInArray(p.sections, from, to) }))}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setWines((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== sIdx) }))}
                    >
                      Elimina
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {sec.items.map((it, iIdx) => (
                    <div key={`${it.name}-${iIdx}`} className="grid gap-2 sm:grid-cols-12 items-start">
                      <div className="sm:col-span-4">
                        <Input
                          value={it.name}
                          onChange={(e) =>
                            setWines((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx
                                  ? {
                                      ...s,
                                      items: s.items.map((x, xi) => (xi === iIdx ? { ...x, name: e.target.value } : x)),
                                    }
                                  : s,
                              ),
                            }))
                          }
                          placeholder="Nome"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <Input
                          value={it.desc}
                          onChange={(e) =>
                            setWines((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx
                                  ? {
                                      ...s,
                                      items: s.items.map((x, xi) => (xi === iIdx ? { ...x, desc: e.target.value } : x)),
                                    }
                                  : s,
                              ),
                            }))
                          }
                          placeholder="Descrizione"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          value={it.price}
                          onChange={(e) =>
                            setWines((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx
                                  ? {
                                      ...s,
                                      items: s.items.map((x, xi) => (xi === iIdx ? { ...x, price: e.target.value } : x)),
                                    }
                                  : s,
                              ),
                            }))
                          }
                          placeholder="Prezzo"
                        />
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-end gap-2">
                        <ReorderButtons
                          index={iIdx}
                          total={sec.items.length}
                          onMove={(from, to) =>
                            setWines((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx ? { ...s, items: moveInArray(s.items, from, to) } : s,
                              ),
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setWines((p) => ({
                              ...p,
                              sections: p.sections.map((s, si) =>
                                si === sIdx ? { ...s, items: s.items.filter((_, xi) => xi !== iIdx) } : s,
                              ),
                            }))
                          }
                        >
                          X
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setWines((p) => ({
                        ...p,
                        sections: p.sections.map((s, si) =>
                          si === sIdx
                            ? { ...s, items: [...s.items, { name: "", desc: "", price: "" }] }
                            : s,
                        ),
                      }))
                    }
                  >
                    + Vino
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="locanda-menu-grid">
              {wines.sections.map((section) => (
                <article key={section.title} className="locanda-card reveal-card-fantasy" aria-label={section.title}>
                  <h3 className="locanda-card-title">{section.title}</h3>
                  <div className="locanda-list" role="list">
                    {section.items.map((it) => (
                      <div key={it.name + it.price} className="locanda-item" role="listitem">
                        <div className="locanda-item-main">
                          <div className="locanda-item-name">{it.name}</div>
                          <div className="locanda-item-desc">{it.desc}</div>
                        </div>
                        <div className="locanda-item-price">{it.price}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Items galleria</div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setGallery((p) => ({
                  ...p,
                  items: [...p.items, { assetId: undefined, src: "", alt: "", tag: "", title: "", sizeClass: "" }],
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
                    <div className="text-sm font-medium">Item #{idx + 1}</div>
                    <div className="flex items-center gap-2">
                      <ReorderButtons index={idx} total={gallery.items.length} onMove={(from, to) => setGallery((p) => ({ ...p, items: moveInArray(p.items, from, to) }))} />
                      <Button variant="destructive" size="sm" type="button" onClick={() => setGallery((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>
                        Elimina
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-12 items-start">
                    <div className="sm:col-span-4">
                      <div className="text-xs text-muted-foreground mb-2">Immagine</div>
                      {src ? <img src={src} alt={it.alt || "Anteprima"} className="h-28 w-full object-cover rounded" loading="lazy" /> : <div className="h-28 rounded border bg-muted" />}
                      <div className="mt-2 flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setPicker({ open: true, index: idx })}>
                          Scegli da Media
                        </Button>
                      </div>
                    </div>
                    <div className="sm:col-span-8 grid gap-2">
                      <Input value={it.title} onChange={(e) => setGallery((p) => ({ ...p, items: p.items.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)) }))} placeholder="Titolo" />
                      <Input value={it.tag} onChange={(e) => setGallery((p) => ({ ...p, items: p.items.map((x, i) => (i === idx ? { ...x, tag: e.target.value } : x)) }))} placeholder="Tag" />
                      <Input value={it.alt} onChange={(e) => setGallery((p) => ({ ...p, items: p.items.map((x, i) => (i === idx ? { ...x, alt: e.target.value } : x)) }))} placeholder="Alt" />
                      <Input value={it.sizeClass ?? ""} onChange={(e) => setGallery((p) => ({ ...p, items: p.items.map((x, i) => (i === idx ? { ...x, sizeClass: e.target.value || undefined } : x)) }))} placeholder="sizeClass (es. gallery-item--wide)" />
                      <Input value={it.src ?? ""} onChange={(e) => setGallery((p) => ({ ...p, items: p.items.map((x, i) => (i === idx ? { ...x, src: e.target.value || undefined } : x)) }))} placeholder="(Fallback) URL immagine" />
                      <div className="text-xs text-muted-foreground">Consiglio: usa 'Scegli da Media' (assetId) e lascia vuoto l'URL.</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="gallery-grid">
              {gallery.items.map((item, idx) => {
                const src = resolveMediaRef(item.assetId ? ({ assetId: item.assetId } as any) : item.src ? ({ src: item.src } as any) : null, assetsById);
                return (
                  <div key={`${item.title}-${idx}`} className={`gallery-item ${item.sizeClass ?? ""}`.trim()} style={{ ["--i" as any]: idx }}>
                    {src ? <img src={src} alt={item.alt} loading="lazy" /> : null}
                    <div className="gallery-overlay">
                      <div className="overlay-content">
                        <span className="overlay-tag">{item.tag}</span>
                        <h3>{item.title}</h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <MediaPickerDialog
        open={picker.open}
        onOpenChange={(v) => setPicker((p) => ({ ...p, open: v }))}
        assets={media.data ?? []}
        pageFilter="locanda"
        value={
          picker.index === null
            ? null
            : gallery.items[picker.index]?.assetId
              ? { assetId: gallery.items[picker.index]!.assetId! }
              : null
        }
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
