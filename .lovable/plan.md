
Obiettivo (richiesta tua)
- Sezione **Recensioni** deve essere **mobile-first**, con **più recensioni (12)** e **movimento verticale continuo** “non ordinato”.
- Niente rotazione/tilt (hai scelto “Solo movimento”).
- L’animazione deve **mettersi in pausa** quando l’utente **tocca/pressa** (mobile) o **hover** (desktop).
- Mantenere accessibilità: se l’utente ha **Riduci animazioni** attivo, disattiviamo l’animazione.

---

## 1) Esplorazione (stato attuale)
- In `src/components/eden/EdenLanding.tsx` la sezione recensioni (`#recensioni`) renderizza **3 card** dentro:
  - `<div className="reviews-grid reveal-stagger"> ... </div>`
- In `src/styles/eden.css`:
  - Desktop: `.reviews-grid` è una griglia 3 colonne.
  - Mobile (max 640): abbiamo appena trasformato `.reviews-grid` in **carosello orizzontale** con scroll-snap.
- Quindi: al momento la UI **non cambia davvero “sistema”** (rimane sempre `.reviews-grid`), e su mobile è **orizzontale**, mentre tu vuoi **verticale in movimento continuo**.

---

## 2) Design (nuovo sistema “vertical marquee” su mobile)
### Idea UI
- Desktop/tablet: teniamo una griglia “pulita” (come ora, 3 colonne) con 12 recensioni oppure 6–9 (decidiamo in base a resa).  
- Mobile (≤ 640px): sostituiamo la griglia con un **marquee verticale**:
  - 2 colonne (o 1 colonna se preferisci più leggibilità) di card
  - ogni colonna scorre verso l’alto **in loop**
  - le colonne hanno **durate diverse** + **gap diversi** per l’effetto “non ordinato”
  - per il loop senza “salti”: **duplico** l’elenco (track A + track A) e animo `translateY` fino a metà.

### Pausa su hover/touch
- CSS: `:hover` sul contenitore (desktop) mette in pausa con `animation-play-state: paused`.
- Touch: aggiungo in React degli handler `onPointerDown / onPointerUp / onPointerCancel` sul contenitore marquee per aggiungere/rimuovere una classe tipo `.is-paused`.

### Reduced motion
- `@media (prefers-reduced-motion: reduce)` → niente animazione, layout statico (lista normale verticale) per mobile.

---

## 3) Piano di implementazione (modifiche concrete)
### A) EdenLanding.tsx — aggiungere più recensioni e markup per marquee mobile
1. Creare un array `REVIEWS` (12 item) in EdenLanding:
   - `title` (es. “Cena indimenticabile”)
   - `text`
   - `context` (es. “Cena tra amici”, “Evento privato”, ecc.)
   - `stars` (stringa “★★★★★” o numero)
2. Sostituire l’attuale hardcode (3 card) con rendering da array:
   - Desktop: render in `.reviews-grid` come adesso (ma con 12).
3. Aggiungere una nuova struttura SOLO per mobile:
   - `<div className="reviews-marquee">`
     - `<div className="reviews-marquee-col" data-speed="slow">`
       - `<div className="reviews-marquee-track">` (lista + lista duplicata)
     - `<div className="reviews-marquee-col" data-speed="fast">` …
4. Gestione pausa touch:
   - stato `isReviewsPaused` boolean
   - container marquee: `onPointerDown => setPaused(true)`, `onPointerUp/Cancel => setPaused(false)`
   - classe `reviews-marquee is-paused` quando paused

> Nota: la griglia `.reviews-grid` può restare per desktop/tablet; su mobile la nascondiamo e mostriamo solo marquee (via CSS).

---

### B) eden.css — rimuovere il carosello orizzontale e aggiungere marquee verticale
1. Eliminare/neutralizzare la parte mobile che trasforma `.reviews-grid` in carosello orizzontale:
   - In `@media (max-width: 640px)` togliere `grid-auto-flow: column`, `overflow-x`, `scroll-snap-type`, scrollbar ecc.
2. Aggiungere stile per marquee:
   - `.reviews-marquee { display: none; }` di default
   - `@media (max-width: 640px)`:
     - `.reviews-grid { display: none; }`
     - `.reviews-marquee { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: 520px; overflow: hidden; }`
     - `.reviews-marquee-track { display: grid; gap: 12px; animation: reviews-marquee-up var(--dur) linear infinite; }`
     - `.reviews-marquee-col[data-speed="slow"] { --dur: 22s; }`
     - `.reviews-marquee-col[data-speed="fast"] { --dur: 16s; }`
3. Keyframes:
   - `@keyframes reviews-marquee-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }`
   - Funziona perché la track contiene “lista + lista” → la seconda metà rimpiazza la prima senza stacco.
4. Pausa:
   - `.reviews-marquee:hover .reviews-marquee-track { animation-play-state: paused; }`
   - `.reviews-marquee.is-paused .reviews-marquee-track { animation-play-state: paused; }`
5. Reduced motion:
   - `@media (prefers-reduced-motion: reduce)`:
     - `.reviews-marquee-track { animation: none; }`
     - `.reviews-marquee { height: auto; overflow: visible; }`
     - (oppure fallback a lista semplice 1 colonna)

---

## 4) Verifica end-to-end (manuale in preview)
1. Apri home e scorri a `#recensioni` da mobile:
   - devono vedersi **12 recensioni** (in loop, non solo 3).
   - deve esserci **movimento verticale continuo**.
2. Prova “pausa su touch”:
   - tieni premuto sulle recensioni → scorrimento si ferma
   - rilascia → riparte
3. Prova da desktop:
   - hover sulle recensioni → si ferma
4. Se hai “Riduci animazioni” attivo nel sistema:
   - le recensioni restano statiche (niente movimento).

---

## 5) Micro-decisioni (che applico durante l’implementazione)
- Mobile: 2 colonne (più “wow”) o 1 colonna (più leggibilità). Di default propongo **2 colonne**.
- Altezza marquee: inizialmente ~520px, poi la rifiniamo in base a come appare con le tue card.

