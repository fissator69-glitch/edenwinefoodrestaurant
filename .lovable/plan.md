
Obiettivo (come l’hai chiesto)
- La pagina **/admin** deve essere “catalogata” e non un mucchio di roba:
  - **Media** separati per: **EDEN / Locanda / Masseria Petrullo**
  - **Menù** separati per pagina:
    - Locanda: menù + vini (già esiste la struttura)
    - EDEN: i **Percorsi cucina (Terra/Mare/Scoperta)** come quelli attuali in home
  - La **Gallery EDEN** deve diventare modificabile da admin e usare i media caricati.

Stato attuale (problema reale)
- `AdminDashboard.tsx` oggi mostra tab “Contatti/Privacy/Footer/Social/Media/Utenti” ma:
  - non usa gli editor già presenti (es. `AdminLocandaEditor`, `AdminLinkCtaEditor`)
  - “Media” è solo upload + lista grezza, senza categorie per pagina
- La pagina **Locanda** e **Masseria** già leggono contenuti da `page_content` (backend) + `media_assets` (per immagini via assetId)
- La home **EDEN** (`EdenLanding.tsx`) ha:
  - **menu percorsi** hardcoded (`CUCINA_PERCORSI`)
  - **galleryItems** hardcoded (link pexels)
  quindi non sono gestibili da admin.

Decisioni già approvate (da te)
- Media: usare **colonna dedicata `page`** (non tag)
- Menù EDEN: rendere editabili i **Percorsi cucina attuali**
- Gallery EDEN: **sì**, renderla editabile da admin

---

Cosa cambierò (design “ordinato”)
A) Backend / Database (strutturato, non improvvisato)
1) Aggiungere `page` a `media_assets`
- Nuova colonna: `media_assets.page`
- Valori consentiti: `eden | locanda | masseria`
- Strategia sicura per non rompere i media già esistenti:
  - Step 1: colonna **nullable** con default `null` (o “eden” solo se vuoi forzare; io consiglio `null`)
  - Step 2: UI admin per assegnare la pagina ai media “Non assegnati”
  - Step 3 (opzionale, quando hai finito di catalogare): rendere `page` **NOT NULL** e magari default

Nota: userò una migrazione schema (tool migrazioni) perché è una modifica strutturale.

2) Contenuti EDEN nel backend (senza nuove tabelle, usando quelle già esistenti)
- Userò `page_content` che già c’è e ha RLS corrette:
  - `page = "home"`
  - `section = "eden_menu"` per i percorsi cucina
  - `section = "eden_gallery"` per la galleria EDEN
- Questo evita di inventare un nuovo schema: è tutto già pronto e protetto.

---

B) Frontend / Admin: nuova struttura “a pagine”, chiara
Trasformo la dashboard admin in un layout coerente:

1) Nuova navigazione Admin (ordinata)
- Tab principali:
  - **Sito (Globale)**: contatti, privacy, footer, social, CTA/link (qui metto `AdminLinkCtaEditor`)
  - **EDEN (Home)**: editor per
    - Percorsi cucina (Terra/Mare/Scoperta)
    - Gallery EDEN
  - **Locanda**: usa `AdminLocandaEditor` (già completo: hero/menu/vini/gallery)
  - **Masseria Petrullo**: nuovo editor dedicato (hero/gallery/note)
  - **Media**: libreria media con filtri e gestione per pagina (eden/locanda/masseria + non assegnati)
  - **Utenti**: resta com’è

2) Media Library “come si deve”
- Dentro tab Media:
  - filtro per pagina: **EDEN / Locanda / Masseria / Non assegnati**
  - card con anteprima immagine + path + pulsante:
    - “Assegna pagina” (select eden/locanda/masseria)
    - (facoltativo) alt + tag testuali
- Upload:
  - prima di caricare scegli la pagina (eden/locanda/masseria)
  - inserisco nel DB `media_assets.page = <pagina>` al momento dell’insert
- Miglioria essenziale:
  - `MediaPickerDialog` (quello che usi per scegliere immagini nelle gallery) verrà aggiornato per supportare un filtro:
    - quando sei in editor Locanda, ti fa vedere di default **solo media Locanda**
    - stesso per Masseria e EDEN
    - toggle “Mostra tutti” se vuoi pescare da altre pagine

---

C) Editor EDEN (Home): percorsi cucina + galleria editabile
1) EDEN menu percorsi
- Creo `AdminEdenEditor.tsx` con una UI simile a quella della Locanda:
  - Tab per: **Terra / Mare / Scoperta**
  - Per ogni percorso:
    - label/titolo
    - prezzo (+ eventuale priceExtra)
    - sezioni (reorder + add/remove)
    - items delle sezioni (add/remove)
    - note (add/remove)
- Salvataggio in `page_content`:
  - upsert “robusto” come già fatto in `AdminLocandaEditor` (delete+insert per (page,section))

2) EDEN gallery
- Sposto la struttura della gallery in `page_content` section `eden_gallery`
- Nuovo modello dati (compatibile con quello attuale ma migliorato):
  - ogni item può avere:
    - `assetId` (preferito, da Media Library)
    - `src` (fallback URL)
    - `category` (food/location/events)
    - `sizeClass` (item-large / item-wide / item-tall)
    - `alt`, `tag`, `title`
- Nell’editor admin:
  - lista items + reorder
  - selezione immagine tramite `MediaPickerDialog` filtrato su **page=eden**
  - preview grid come nella home, così vedi subito se “viene bene”

3) Modifica `EdenLanding.tsx` per leggere dal backend
- Aggiungo:
  - `usePageBlocks("home")`
  - `useMediaAssets()`
  - `assetsById` + `resolveMediaRef` per le immagini di gallery (come già fai in Locanda/Masseria)
- Se i contenuti non esistono ancora nel backend:
  - fallback automatico all’attuale `CUCINA_PERCORSI` e `galleryItems` (quindi non si rompe nulla)

---

D) Editor Masseria (nuovo, coerente)
- Creo `AdminMasseriaEditor.tsx`:
  - hero (descrizione)
  - gallery (polaroid items con `assetId` o `src`)
  - note (testo)
  - preview rapida
- Salva su `page_content` (page=masseria, section=hero/gallery/note) come già fa Locanda.

---

File coinvolti (indicativo)
Database
- Migrazione: `alter table public.media_assets add column page ...` (+ tipo enum o testo con vincoli)

Admin / UI
- `src/pages/admin/AdminDashboard.tsx` (ristrutturazione tab e inserimento editor)
- `src/components/admin/AdminLocandaEditor.tsx` (solo per integrare picker filtrato, se serve)
- `src/components/admin/MediaPickerDialog.tsx` (aggiunta filtro per `page` e toggle “Mostra tutti”)
- Nuovi:
  - `src/components/admin/AdminEdenEditor.tsx`
  - `src/components/admin/AdminMasseriaEditor.tsx`

Frontend EDEN
- `src/components/eden/EdenLanding.tsx` (menu percorsi + gallery dal backend con fallback)

Hooks (se utile, per pulizia)
- `src/hooks/content/usePageContent.ts` (già ok)
- `src/hooks/content/useMediaAssets.ts` (aggiungo selezione della colonna `page` + tipo aggiornato)

---

Edge cases / “niente prove a cazzo”
- Non rompo nulla “al buio”:
  - EdenLanding continuerà a funzionare anche se nel backend non c’è nulla (fallback)
  - Media già caricati non spariscono: iniziano come “Non assegnati” finché non li categorizzi
- Sicurezza invariata:
  - scrittura solo admin (RLS già presente)
  - lettura pubblica dove già prevista (media/page_content/site_settings ecc.)

---

Checklist di verifica (che farai tu, ma guidata e chiara)
1) Vai su /admin:
- Vedi tab “Sito / EDEN / Locanda / Masseria / Media / Utenti”
2) Media:
- Carichi una foto scegliendo “Locanda” → poi la vedi solo nel filtro Locanda
3) Locanda editor:
- In “Scegli da Media” vedi di default solo media locanda
4) EDEN editor:
- Modifichi un testo/voce di un percorso → Salva → ricarichi home → vedi cambiamento
- Modifichi gallery (scegli un asset) → Salva → home aggiornata
5) Masseria editor:
- Assegni immagini polaroid via Media → Salva → pagina masseria aggiornata

Se approvi questo piano, nel prossimo step implemento:
- migrazione DB per `media_assets.page`
- refactor AdminDashboard (layout “catalogato”)
- editor EDEN + editor Masseria
- EdenLanding collegata a backend con fallback
- MediaPickerDialog filtrato per pagina
