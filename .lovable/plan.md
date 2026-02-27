
Obiettivo (come lo intendo io, in modo realistico)
- Creare una sezione **/admin** (protetta da login) da cui puoi **modificare contenuti del sito**: testi, menù, foto, link, e aggiungere **social nel footer con icone**.
- Rendere le pagine pubbliche (/, /locanda-eden, /masseria-petrullo) **guidate dai dati** (database) invece che hardcoded nel codice, così l’Admin “comanda davvero” il sito.

Nota importante su “TUTTO TUTTO”
- Un “page builder” completo tipo WordPress/Elementor (sposti blocchi liberamente, editing WYSIWYG totale) è un progetto enorme.
- Ti propongo una soluzione **molto potente ma strutturata**: ogni pagina ha “sezioni” definite (Hero, Descrizioni, CTA, Gallerie, Menù…), e dall’Admin puoi cambiare **tutti i campi** di quelle sezioni (testi, immagini, link, ordine elementi dove serve). Questo copre il 95% del bisogno reale mantenendo eleganza e stabilità.

Stato attuale (da repo)
- Nessun Supabase/Cloud client in `src/` (nessun auth/db/storage ancora).
- Contenuti sono hardcoded in:
  - `src/components/eden/EdenLanding.tsx` (landing + footer dentro la landing)
  - `src/pages/LocandaEden.tsx`
  - `src/pages/MasseriaPetrullo.tsx`
- Footer oggi esiste solo nella landing (EdenLanding), ma tu lo vuoi **su tutte le pagine** e con social.

Decisioni già prese (dalle tue risposte)
- Accesso Admin: **login email/password**
- Backend: **Lovable Cloud (consigliato)**
- Ruoli: **Solo Admin**
- Aree gestibili: **Landing / Locanda / Masseria / Footer**

Architettura proposta (alta affidabilità + sicurezza)
1) Backend (Lovable Cloud / Supabase-like)
- Useremo:
  - **Auth** (email/password)
  - **Database** per contenuti
  - **Storage** per immagini (foto, title image, gallery)
- Sicurezza ruoli (CRITICO):
  - I ruoli NON vanno mai nel profilo/utente lato client.
  - Creiamo tabella ruoli separata `user_roles` e funzione `has_role()` (security definer) come da best practice.

2) Modello dati (tabelle)
Per gestire “tutto” senza creare 50 tabelle, propongo una combinazione:
A) `site_settings` (chiave/valore)
- Esempi: telefono, whatsapp, indirizzo, link maps, copyright, “Design by…”
- Anche palette/varianti se vuoi controllarle da Admin.

B) `site_footer`
- Testi footer, colonne, link, e soprattutto:
- `social_links` (tabella separata) con:
  - `platform` (instagram/facebook/tiktok/youtube/google…)
  - `url`
  - `order`
  - `enabled`
  - (icone renderizzate lato UI con lucide-react in base a platform)

C) Contenuti per pagina (2 opzioni, scelgo quella più pratica)
Opzione consigliata: tabella “a blocchi” JSON (molto flessibile)
- `page_content`
  - `page` enum/string: `home`, `locanda`, `masseria`
  - `section` string: `hero`, `intro`, `menu`, `gallery`, `cta`, ecc.
  - `content` jsonb: struttura specifica della sezione
  - `updated_at`
Vantaggi: puoi cambiare/aggiungere campi in futuro senza migrazioni frequenti.

D) Media
- Storage bucket (es. `site-media`) + tabella `media_assets` (opzionale ma utile) con:
  - `path`
  - `alt`
  - `tags`
  - `created_at`
Questo rende l’Admin più comodo (libreria immagini).

3) RLS (Row Level Security) e permessi
- Contenuti pubblici: le pagine pubbliche devono poter leggere:
  - `select` consentito a `anon` + `authenticated` sulle tabelle content (solo lettura).
- Modifiche: solo `admin` (ruolo) può:
  - `insert/update/delete` su `page_content`, `site_settings`, `site_footer`, `social_links`, `media_assets`
- Ruoli:
  - tabella `user_roles` con RLS attivo
  - funzione `has_role(auth.uid(),'admin')`
  - policy: admin può gestire contenuti.
- Bootstrap del primo admin (passo necessario):
  1) ti registri (o crei) un utente admin
  2) inseriamo una riga in `user_roles` per quell’utente con ruolo `admin`
  (lo faremo in modo guidato, passo-passo, in fase implementazione)

4) Frontend: nuove route e protezione
- Aggiungere route:
  - `/admin/login` (form email/password)
  - `/admin` (dashboard)
- Creare `ProtectedRoute`:
  - verifica sessione auth
  - verifica ruolo admin con query server-side (tabella `user_roles` + `has_role`)
  - se non admin → redirect a `/admin/login`

5) Admin UI (cosa potrai fare)
Admin Dashboard con tab (Radix Tabs già disponibile):
- “Home (/)”
  - campi hero (titolo, sottotitolo, pulsanti, immagini)
  - sezioni principali (testi, link CTA)
  - galleria (CRUD items + ordine)
- “Locanda”
  - hero (titolo immagine già presente: gestibile come media)
  - descrizione
  - menù: sezioni + righe (aggiungi/rimuovi/modifica, prezzo, descrizione)
  - carta vini: sezioni + righe
  - gallery: lista items (immagine, alt, tag, titolo, layout wide/tall)
  - link WhatsApp template (se vuoi cambiarlo)
- “Masseria”
  - hero: titolo immagine + descrizione + CTA
  - gallery polaroid (CRUD + ordine + inclinazione opzionale)
  - note “solo eventi privati…”
- “Footer”
  - testo brand/descrizione
  - link colonne
  - contatti
  - social links con icone (aggiunta richiesta)
- “Media”
  - upload immagini (drag&drop o bottone)
  - riutilizzo immagini esistenti
  - copia URL/assegnazione a sezioni

UI Editing (semplice ma potente)
- Inputs + Textarea (già presenti)
- Liste ripetibili (aggiungi/rimuovi/riordina con su/giù per iniziare)
- Salvataggio con:
  - pulsante “Salva”
  - toast “Salvato”
  - validazione minima con zod/react-hook-form (già nel progetto)

6) Refactor del sito pubblico per leggere dal DB
Obiettivo: mantenere lo stile attuale, cambiare solo la “fonte” dei contenuti.
- Creare hook/data layer (React Query è già installato):
  - `usePageContent(page)` → ritorna sezioni
  - `useSiteFooter()` / `useSiteSettings()`
- Strategie di fallback (importante per non “rompere” il sito):
  - Se nel DB manca una sezione → usare i contenuti hardcoded di oggi come fallback.
  - Questo permette di pubblicare gradualmente e non restare “a piedi”.

7) Footer globale su tutte le pagine + social icons
- Estrarre il footer attuale dalla landing in un componente dedicato (es. `EdenFooter`)
- Inserirlo in:
  - Landing
  - Locanda
  - Masseria
- “Sezioni” nel footer:
  - su landing: anchor `#eden #cucina ...`
  - su subpages: link a route (`/`, `/locanda-eden`, `/masseria-petrullo`) oppure una combinazione intelligente
- Social:
  - icone lucide-react (Instagram, Facebook, MapPin, Phone, etc.)
  - lista gestibile da Admin

8) Sequenza di implementazione (ordine consigliato)
Fase 1 — Fondazione
1. Attivare Lovable Cloud (se non già attivo nel progetto)
2. Creare schema DB (migrazioni):
   - enum `app_role`
   - `user_roles` + RLS + `has_role()`
   - `site_settings`, `page_content`, `site_footer`, `social_links`, (opzionale `media_assets`)
3. Creare bucket storage `site-media` + policy (lettura pubblica, scrittura admin)

Fase 2 — Auth + Admin shell
4. Aggiungere Supabase/Lovable client (frontend)
5. Creare `/admin/login` + `/admin` + protezione route
6. Creare Admin UI base (tabs + “Salva” + toasts)

Fase 3 — Contenuti reali
7. Implementare editor “Footer + Social” e render footer globale su tutte le pagine
8. Implementare editor per Locanda (menu + vini + gallery)
9. Implementare editor per Masseria (hero + gallery + note)
10. Implementare editor per Home (sezioni principali)
11. Aggiungere Media upload + selettore immagini nelle form

Fase 4 — Rifiniture
12. Riordino elementi (up/down), micro-preview e validazioni
13. Cache invalidation con React Query (refetch dopo save)
14. Hardening sicurezza + controlli (no client-side admin flags)

Criteri di completamento (definizione “fatto”)
- Posso loggarmi in `/admin/login`.
- Solo un utente con ruolo admin vede `/admin` e può salvare.
- Cambiando un testo/immagine/menu/social in Admin:
  - la modifica si riflette subito nelle pagine pubbliche.
- Footer appare su tutte le pagine e i social sono visibili con icone.
- Nessun controllo admin basato su localStorage/sessionStorage o credenziali hardcoded.

Domande rimaste (non bloccanti, ma utili per definire bene “tutto”)
- Vuoi anche modificare:
  1) i numeri di telefono/WhatsApp/indirizzo (attualmente hardcoded in più punti)?
  2) i testi “Privacy & Cookie” del modal (contenuto policy)?
  3) le immagini di galleria oggi sono placeholder (picsum): vuoi che l’Admin gestisca una galleria “vera” (upload) e sostituiamo tutte le picsum?

Se mi confermi questi ultimi 3 punti, nella fase “schema dati” includiamo anche i campi necessari e evitiamo di dover ritoccare dopo.

Sezione tecnica (per trasparenza)
- Useremo `@tanstack/react-query` per fetch/cache contenuti.
- Form: `react-hook-form` + zod per validazione.
- Storage: upload su bucket + salvataggio path nei JSON delle sezioni.
- Sicurezza: RLS + `has_role()` SECURITY DEFINER + tabella `user_roles` separata (come da best practice, evita privilege escalation).
