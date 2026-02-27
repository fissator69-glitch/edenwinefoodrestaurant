
Contesto (dove siamo)
- Mi confermi che **Leaked Password Protection** è già attivo: perfetto, quindi riparto con il refactor di **/admin** e l’organizzazione **Media per pagina** (EDEN/Locanda/Masseria) + editor EDEN (Percorsi + Gallery) e Masseria.
- Nel database la colonna `media_assets.page` risulta già presente (nullable) e le tabelle `page_content` e `media_assets` hanno RLS corretta (scrivono solo admin, lettura pubblica).

Obiettivo della prossima implementazione (in codice)
1) /admin “catalogato” in tab/pagine chiare:
   - Sito (Globale): contatti/privacy/footer/social + Link&CTA (editor già esistente)
   - EDEN (Home): Percorsi cucina + Gallery EDEN (nuovi editor)
   - Locanda: usare `AdminLocandaEditor` (già esistente)
   - Masseria: nuovo editor dedicato (hero/gallery/note)
   - Media: libreria con filtro `page` + assegnazione pagina + upload con scelta pagina
   - Utenti: lasciare la gestione utenti già presente

2) MediaPicker “intelligente”
- `MediaPickerDialog` deve poter filtrare i media per `page` (di default mostra quelli della pagina corrente, con toggle “Mostra tutti”).

3) Home EDEN collegata a backend (con fallback)
- Spostare:
  - Percorsi cucina: in `page_content` con `page="home"`, `section="eden_menu"`
  - Gallery EDEN: in `page_content` con `page="home"`, `section="eden_gallery"`
- `EdenLanding.tsx` leggerà dal backend se presente, altrimenti continuerà ad usare gli hardcoded attuali (fallback), così non rompiamo nulla.

---

Esplorazione rapida del codice attuale (cosa cambia)
- `src/pages/admin/AdminDashboard.tsx` oggi contiene tutto “misto” (contatti/privacy/footer/social/media/users) e l’upload media inserisce solo `{bucket,path,alt,tags}` senza `page`.
- `src/hooks/content/useMediaAssets.ts` non seleziona `page` (quindi in UI non possiamo filtrare/assegnare bene).
- `src/components/admin/MediaPickerDialog.tsx` oggi filtra solo con search string; nessun filtro per pagina.
- `AdminLocandaEditor.tsx` è già fatto bene e usa `usePageBlocks("locanda")` + `MediaPickerDialog`.
- Le pagine `LocandaEden.tsx` e `MasseriaPetrullo.tsx` già leggono `page_content` e risolvono immagini via `assetId` con `resolveMediaRef`.
- `EdenLanding.tsx` ha `CUCINA_PERCORSI` hardcoded e `galleryItems` hardcoded (pexels): dobbiamo aggiungere lettura da `page_content` + media assets.

---

Progettazione dati (concreto)
A) media_assets
- Useremo `media_assets.page` con valori:
  - `"eden" | "locanda" | "masseria" | null`
- `null` = “Non assegnati” (utile per i media già caricati)

B) page_content (EDEN)
- `page="home"`
- `section="eden_menu"` con struttura tipo:
  ```ts
  { percorsi: Array<{
      key: "terra" | "mare" | "scoperta",
      label: string,
      title: string,
      price: number,
      priceExtra?: string,
      sections: Array<{ title: string, items?: string[] }>,
      notes?: Array<{ label: string, items?: string[] }>
    }> }
  ```
- `section="eden_gallery"` con struttura tipo:
  ```ts
  { items: Array<{
      assetId?: string,
      src?: string,
      category: "food" | "location" | "events",
      sizeClass?: "item-large" | "item-wide" | "item-tall",
      alt: string,
      tag: string,
      title: string
  }> }
  ```

---

Cambiamenti pianificati (sequenza di implementazione)
1) Hook + tipizzazione Media (base per tutto)
- Aggiornare `useMediaAssets.ts`:
  - estendere `MediaAsset` con `page?: string | null`
  - includere `page` nella select: `select("id,bucket,path,alt,tags,created_at,page")`
- Questo sblocca subito: filtro per pagina, assegnazione pagina, e MediaPicker filtrabile.

2) MediaPickerDialog: filtro per `page` + toggle “Mostra tutti”
- Estendere props di `MediaPickerDialog`:
  - `pageFilter?: "eden" | "locanda" | "masseria" | null` (opzionale)
  - `showAllToggle?: boolean` (default true)
- Logica:
  - se `pageFilter` è passato e “Mostra tutti” è OFF:
    - mostra solo asset con `asset.page === pageFilter`
  - search continua a funzionare come ora (si applica dopo il filtro pagina).

3) AdminDashboard: nuova “catalogazione” tab
- Rifattorizzare `AdminDashboard.tsx` in tab principali:
  - `site` (Globale): contatti/privacy/footer/social + embed `AdminLinkCtaEditor`
  - `eden`: embed nuovo `AdminEdenEditor`
  - `locanda`: embed `AdminLocandaEditor`
  - `masseria`: embed nuovo `AdminMasseriaEditor`
  - `media`: nuova libreria media (vedi step 4)
  - `users`: mantenere sezione utenti (quasi invariata)
- Obiettivo UX: l’admin apre e capisce dove andare in 3 secondi.

4) Tab “Media”: libreria vera
- Aggiungere filtro select: EDEN / Locanda / Masseria / Non assegnati / Tutti
- Mostrare cards con:
  - preview immagine (usando `publicUrl(bucket, path)`)
  - bucket/path
  - select “Pagina” per cambiare `media_assets.page` con update immediato
- Upload:
  - prima scegli pagina (eden/locanda/masseria) o “non assegnata”
  - dopo upload in storage, l’insert su `media_assets` includerà `page`
- (Opzionale ma consigliato) campo alt editabile in-place.

5) Nuovo AdminEdenEditor (Percorsi + Gallery)
- Creare `src/components/admin/AdminEdenEditor.tsx`:
  - Legge `usePageBlocks("home")` e `useMediaAssets()`
  - Ha 2 sotto-tab:
    - “Percorsi cucina” (Terra/Mare/Scoperta) con UI edit (reorder/add/remove) simile allo stile già usato in `AdminLocandaEditor`
    - “Gallery” con lista items + reorder + bottone “Scegli immagine” che apre `MediaPickerDialog` con `pageFilter="eden"`
  - Salvataggio:
    - `upsertSingletonPageSection("home","eden_menu", ...)`
    - `upsertSingletonPageSection("home","eden_gallery", ...)`
  - Invalidazione react-query su `["page_content","home"]`

6) Nuovo AdminMasseriaEditor
- Creare `src/components/admin/AdminMasseriaEditor.tsx`:
  - Simile a Locanda editor, ma con sezioni:
    - hero (descrizione)
    - gallery (polaroid items con `assetId` e tiltClass/caption/alt)
    - note (testo)
  - MediaPicker filtrato `pageFilter="masseria"`
  - Salvataggio su `page="masseria"` sections `hero/gallery/note`

7) EdenLanding.tsx: leggere `eden_menu` + `eden_gallery` dal backend con fallback
- Integrare:
  - `usePageBlocks("home")`
  - `useMediaAssets()` + `assetsById`
  - `pickSection` per `eden_menu` e `eden_gallery`
- Collegare:
  - Percorsi cucina: se backend presente, usare quelli; altrimenti usare `CUCINA_PERCORSI` attuale
  - Gallery: se backend presente, usare items dal backend; altrimenti usare `galleryItems` attuale
- Per la gallery, quando un item ha `assetId`, risolvere con `resolveMediaRef` (come già in Locanda/Masseria), altrimenti usare `src`.

---

Rischi/attenzioni (per non rompere l’app)
- Retrocompatibilità: EdenLanding deve rimanere ok anche senza dati in `page_content` (fallback).
- Media già caricati: essendo `page` nullable, appariranno in “Non assegnati” finché non li classifichi.
- Performance: evitare di renderizzare 1000 preview; nel tab media manterrò paginazione semplice o un `.slice(0, N)` con “Carica altro” (decidiamo in implementazione in base a quanti asset hai).

---

Cosa mi serve da te (solo se necessario)
Niente di bloccante. Al massimo, durante l’implementazione potrei chiederti una preferenza minima:
- Nel tab Media: vuoi default filtro su “EDEN” oppure “Tutti”?

---

Verifica end-to-end (dopo implementazione)
1) /admin:
- Vedi tab: Sito / EDEN / Locanda / Masseria / Media / Utenti
2) Media:
- Upload scegliendo pagina “Locanda” → in lista con filtro Locanda lo vedi
- Cambi “Pagina” su un asset → sparisce/compare correttamente nei filtri
3) Locanda/Masseria editor:
- In “Scegli immagine” vedi di default media della stessa pagina (toggle “Mostra tutti” funziona)
4) EDEN editor:
- Cambi una voce Percorso → Salva → refresh home → cambio visibile
- Cambi gallery scegliendo asset → Salva → home mostra la nuova immagine
