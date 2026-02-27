
Obiettivo della richiesta
- Rendere **Home (/), Locanda (/locanda-eden), Masseria (/masseria-petrullo)** completamente “data‑driven”: hero, testi, menu, vini, gallerie vengono **letti dal database** e, se non presenti, usano i **fallback attuali hardcoded**.
- In Admin, sostituire l’editor “a JSON” per queste aree con **editor guidati (non JSON)**:
  - Locanda: **Menu + Carta vini + Gallery** con riordino e preview
  - Masseria: **Hero + Gallery polaroid + Nota** con riordino e preview
  - Home: contenuti principali (almeno Hero + eventuali blocchi principali che mi indicherai nella UI)
- Aggiungere un tab **“Link & CTA”** che permette di gestire da Admin:
  - template messaggi WhatsApp per Locanda/Masseria (e Home se serve)
  - link Maps (già in Contatti, ma lo rendiamo anche “CTA‑centric”)
  - bottoni hero / CTA principali (per pagina)

Stato attuale (verificato nel codice)
- Il backend (Lovable Cloud) è già pronto con tabelle: `page_content`, `site_settings`, `media_assets`, `social_links`, `site_footer`, `user_roles` + funzione `has_role()`.
- Le pagine pubbliche:
  - Locanda e Masseria: oggi sono ancora hardcoded per menu/gallerie/testi; solo WhatsApp prende il numero da `site_settings.contact`.
  - Home (`EdenLanding.tsx`) è molto grande e tutta hardcoded.
- Admin (`AdminDashboard.tsx`) ha già tabs: Contatti, Privacy, Footer (JSON), Social, Media (upload).
- Hook già pronti: `usePageBlocks` + `pickSection`.

Decisioni chiave (per fare bene “data-driven + fallback”)
1) Modello contenuti per pagina (restando compatibili col DB esistente)
- Useremo `page_content` con sezioni “singleton” (1 riga per sezione) che contengono JSON strutturato.
- Per le liste (menu, vini, gallery) salveremo **un solo JSON** con un array interno, così è semplice leggere/salvare e fare fallback:
  - `page=locanda, section=menu` → `{ sections: [...] }`
  - `page=locanda, section=wines` → `{ sections: [...] }`
  - `page=locanda, section=gallery` → `{ items: [...] }`
  - `page=masseria, section=gallery` → `{ items: [...] }`
  - ecc.
- Questo evita dover gestire molte righe e “order” sul DB (il riordino lo gestiamo nell’array). Il campo `order` in tabella rimane a `0` per queste sezioni.

2) Riferimenti immagini
- Nel DB non salviamo URL esterni tipo picsum: salviamo riferimenti a media interni in uno di questi modi:
  - preferito: `{ assetId: "uuid" }`
  - alternativa: `{ bucket: "site-media", path: "..." }`
- In runtime, risolviamo l’URL pubblico via Storage (bucket pubblico già presente). Così l’Admin può “scegliere immagine” dalla libreria media.

3) “Link & CTA” dove salvare i dati
- Useremo `site_settings` con una chiave dedicata (es. `key = "cta"`), che conterrà:
  - `whatsappTemplates: { locanda: string, masseria: string, home?: string }`
  - `heroButtons: { home?: {...}, locanda?: {...}, masseria?: {...} }` oppure, meglio ancora: bottoni hero per pagina stanno nella rispettiva `page_content.hero` e in “Link & CTA” forniamo un editor che li salva lì (così tutto ciò che è “della pagina” resta nella pagina).
- Manteniamo `site_settings.contact` come fonte canonica di `phone/whatsapp/address/mapsUrl` (già esiste). Il tab “Link & CTA” mostrerà anche Maps/WhatsApp come riepilogo e permette di modificare i template messaggio.

Cosa cambierà lato pubblico (pagine)
A) Locanda (`src/pages/LocandaEden.tsx`)
- Aggiungere `usePageBlocks("locanda")`.
- Sostituire:
  - descrizione hero
  - CTA labels/href (WhatsApp + anchor menu)
  - menuSections
  - wineSections
  - galleryItems
  con valori presi da `page_content`, usando `pickSection(..., fallbackAttuale)`.
- Per WhatsApp:
  - numero: resta da `site_settings.contact.whatsapp`
  - testo messaggio: viene da `site_settings.cta.whatsappTemplates.locanda` con fallback al testo attuale.

B) Masseria (`src/pages/MasseriaPetrullo.tsx`)
- Aggiungere `usePageBlocks("masseria")`.
- Rendere data-driven:
  - descrizione hero
  - CTA labels/href (WhatsApp + anchor gallery)
  - polaroids gallery
  - nota “Solo per eventi…”
- WhatsApp template da `site_settings.cta.whatsappTemplates.masseria`.

C) Home (`src/components/eden/EdenLanding.tsx`)
- È un file molto grande: per evitare regressioni, la strategia è incrementale e sicura:
  1) prima passata: rendiamo data-driven i blocchi “core” che hanno più valore da amministrare:
     - Hero (titolo/sottotitolo, bottoni principali)
     - eventuali CTA principali e/o blocchi testo che in UI risultano “editabili”
     - gallery principale (se presente)
  2) seconda passata: estendiamo alle altre sezioni (percorsi cucina, recensioni, ecc.)
- Tecnica: `usePageBlocks("home")` + `pickSection("hero", fallbackHardcoded)` ecc.
- Importante: quando una sezione non è ancora migrata, rimane hardcoded.

Cosa cambierà in Admin (editor guidati)
1) Nuovi tab in `AdminDashboard.tsx`
- Aggiungeremo:
  - “Home”
  - “Locanda”
  - “Masseria”
  - “Link & CTA”
- Il tab “Footer” potrà restare per ora JSON (già funziona), ma in parallelo possiamo aggiungere campi guidati principali (brandName, description, designBy, sections) senza perdere la modalità JSON (opzionale).

2) Pattern tecnico per gli editor
- Ogni tab:
  - carica dati da `page_content` tramite query (possiamo riusare `usePageBlocks`)
  - idrata form state con fallback (contenuto attuale hardcoded)
  - permette:
    - aggiungere/rimuovere voci
    - riordinare (pulsanti Su/Giù + eventualmente “sposta in alto/basso”)
    - preview live sotto al form
  - “Salva”:
    - salva sul DB in modo robusto:
      - `DELETE` tutte le righe per `{page, section}` e poi `INSERT` una riga con `order=0` e `content=formValue`
      - invalidate query (`react-query`) per aggiornare sito e admin
- Validazione:
  - zod per campi obbligatori (titoli, prezzi, URL quando richiesto)
  - normalizzazione prezzi (lasciamo stringa tipo “€ 18” per massima libertà, oppure separiamo number+currency se vuoi rigore; per ora stringa = più flessibile)

3) Editor specifici richiesti (non JSON)
A) Locanda: Menu
- UI:
  - Lista “Sezioni” (Antipasti/Primi/…)
  - Dentro sezione: lista piatti (nome, descrizione, prezzo)
  - Bottoni: +Sezione, +Piatto, elimina, su/giù
  - Preview: render come le card attuali (stesso markup/stile)

B) Locanda: Carta vini
- Identico al Menu ma con dataset separato (`section=wines`)

C) Locanda: Gallery
- Lista items: (immagine, alt, tag, title, sizeClass)
- Selettore immagine:
  - “Scegli da Media” (apre dialog con griglia di immagini)
  - “Upload” rapido (riusa upload già pronto) e poi seleziona
- Preview: stessa griglia attuale con overlay tag/title

D) Masseria: Gallery polaroid
- Lista items: (immagine, alt, caption, tiltClass)
- Riordino + preview polaroid wall.

E) Masseria: Hero + Nota
- Campi: descrizione, testi bottoni, eventuale immagine titolo (se vuoi sostituire anche quella con media)
- Nota: testo semplice.

F) Home: Hero + blocchi principali
- Campi definiti in base a cosa c’è in pagina (prima passata minima, poi estendiamo):
  - headline / subheadline
  - CTA primario (label + “azione”: link esterno / link interno / anchor)
  - CTA secondario
  - eventuale gallery home
- Preview: mini-preview hero + CTA.

4) Tab “Link & CTA”
- Scopo: nessun link “sparso nel codice”.
- Contenuti:
  - WhatsApp templates:
    - Locanda template (textarea)
    - Masseria template (textarea)
    - (opzionale) Home template
    - Nota: supporto placeholders semplici (opzionale) tipo `{date}`, `{name}`—se lo vuoi, lo pianifichiamo, altrimenti testo libero come oggi.
  - Bottoni hero (per pagina):
    - per ciascuna pagina: label + target (url / route / anchor)
  - Maps:
    - riuso del campo `contact.mapsUrl` ma lo esponiamo anche qui come “CTA Indicazioni”
- Salvataggio:
  - `site_settings` upsert su `key="cta"` per i template
  - per bottoni hero: salvataggio in `page_content` `section="hero"` della rispettiva pagina (o, se preferisci centralizzare, salvataggio in `site_settings.cta.heroButtons` e le pagine leggono da lì; io consiglio per‑pagina dentro `page_content.hero`).

Operazioni DB necessarie
- Nessuna modifica di schema obbligatoria.
- Serve invece “seed” iniziale dei contenuti:
  - Inserire in `page_content` i JSON iniziali copiati dagli attuali hardcoded (così appena attivi l’Admin vedi già tutto compilato).
  - Inserire in `site_settings` la chiave `cta` con i template WhatsApp iniziali (copiati dal codice).
- Queste sono operazioni dati (INSERT/UPDATE/DELETE), non migrazioni.

Sequenza di implementazione (per minimizzare rischi)
1) Definizione JSON per sezioni
- Concordiamo (io lo propongo) gli oggetti `hero/menu/wines/gallery/note` per `locanda` e `masseria` (strutture già chiare dai file).
- Per `home`, facciamo iterazione: prima hero + 1–2 sezioni.

2) Locanda data-driven (lettura + fallback)
- Implementare lettura da DB per hero/menu/wines/gallery + WhatsApp template
- Verificare che senza dati DB tutto resta identico (fallback).

3) Admin editor guidato: Locanda (menu/wines/gallery)
- UI + save su `page_content`
- Collegare Media picker
- Preview.

4) Masseria data-driven + editor guidato
- Stesso pattern: gallery polaroid + hero + note.

5) Tab “Link & CTA”
- Creare/leggere/salvare `site_settings.cta`
- Spostare WhatsApp templates fuori dal codice nelle pagine.

6) Home: data-driven incrementale
- Prima: hero + CTA (e gallery se presente e richiesta).
- Poi estendiamo alle sezioni successive (percorsi cucina, ecc.), una per volta, sempre con fallback.

Test e checklist (fondamentale, perché qui tocchiamo molte UI)
- Pubblico:
  - /, /locanda-eden, /masseria-petrullo caricamento OK
  - nessun errore console
  - immagini gallery da storage visibili
  - anchor link (#menu/#gallery) ancora funzionanti
- Admin:
  - login, accesso /admin
  - salvataggio: modifica un piatto, refresh pagina pubblica e verificare aggiornamento
  - upload immagine + selezione in gallery + verifica in pubblico
  - riordino: verifica che l’ordine salvato è quello visualizzato
- Sicurezza:
  - confermare che le scritture avvengono solo con utente admin (RLS già presente)
  - nessun controllo admin via storage client (già ok: usiamo RPC `has_role`)

Ambiguità minime da chiarire (solo per Home)
- Quali sezioni di Home vuoi assolutamente rendere editabili “subito” nella prima passata?
  - Esempi: Hero, blocco “Percorsi”, Gallery, Eventi, Recensioni, Contatti…
  - Io posso partire da Hero+CTA e poi proseguire in ordine di priorità.

File che toccheremo (indicativi)
- Pagine pubbliche:
  - `src/pages/LocandaEden.tsx`
  - `src/pages/MasseriaPetrullo.tsx`
  - `src/components/eden/EdenLanding.tsx` (incrementale)
- Admin:
  - `src/pages/admin/AdminDashboard.tsx` (nuovi tab + editor guidati + picker media)
  - probabilmente nuovi componenti riusabili in `src/components/admin/*` (EditorList, MediaPickerDialog, ReorderButtons, PreviewCard)
- Utilità:
  - piccole helper per risolvere public URL da asset (`media_assets`) e per normalizzare CTA links.

Risultato finale atteso
- Tutti i contenuti principali (hero/testi/menu/vini/gallerie) per Home/Locanda/Masseria sono:
  - modificabili in Admin con form guidati
  - salvati su DB
  - mostrati nel sito pubblico
  - con fallback ai contenuti attuali se DB è vuoto
- Tab “Link & CTA” centralizza i template WhatsApp e i bottoni/azioni principali senza modifiche al codice.
