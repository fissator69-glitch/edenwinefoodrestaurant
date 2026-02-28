
## Obiettivo
Trasformare la sezione **Storia** in una narrazione “da libro dell’Eden”: elegante, premium, luminosa (con accenti), con **drop cap**, **ornamenti**, **titolo gold foil** e una **luce animata lentissima**. Il tutto senza stravolgere l’identità dark generale del sito.

---

## 1) Explore (cosa c’è oggi)
- La sezione è in `src/components/eden/EdenLanding.tsx` con:
  - `<section id="storia" className="story-section ...">`
  - testo in 3 paragrafi dentro `.story-body`
  - “capitoli” a destra in `.story-chapters` con 3 `.chapter-card`
- Lo stile è in `src/styles/eden.css` nel blocco:
  - `BLOCCO 2B · STORIA (NARRATIVA)`
  - classi principali: `.story-section`, `.story-title`, `.story-body`, `.story-chapters`, `.chapter-*`

---

## 2) Direzione creativa (coerente con le tue scelte)
Hai scelto:
- **Riscrivi tutto**
- **Pagina di libro**
- **Accenti luminosi** (non tutta la sezione chiara)
- **Drop cap + Ornamenti + Gold foil + Luce animata**

Quindi:
- Mantengo background dark dell’Eden
- Creo un “foglio” centrale (pannello perla) che sembra **illuminato**, con bordo/filigrana oro molto sottile
- Tipografia serif “libro” con gerarchie forti (kicker, titolo, testo, capitoli)
- Animazione luce: un “sweep” lentissimo e quasi impercettibile sul pannello e sul titolo (premium, non “effetto discoteca”)

---

## 3) Design & UI (cosa cambierà visivamente)
### A) Layout “pagina di libro”
- Dentro `.story-shell` inserirò un wrapper tipo:
  - `.story-book` (il “foglio”)
  - `.story-book-inner` (margini da editoriale)
- La griglia resta a 2 colonne su desktop, ma visivamente diventa:
  - **colonna sinistra:** narrazione “capitolo” con drop cap
  - **colonna destra:** capitoli come “segnalibri”/riquadri eleganti

### B) Copy (riscrittura completa)
- Riscrivo i 3 paragrafi in stile narrativo (tono “romanzo breve”), con:
  - apertura più evocativa
  - immagini sensoriali (luce, pietra, silenzio, brindisi)
  - chiusura “firma” che invita a restare
- Titolo più “wow” e memorabile (sempre coerente col brand Eden)

### C) Elementi premium richiesti
- **Drop cap** sulla prima lettera del primo paragrafo (serif, gold soft)
- **Ornamenti**:
  - divisor ornamentale sotto il titolo (linea + simbolo centrale)
  - filigrana leggerissima sul pannello (radial/linear gradients)
- **Titolo gold foil**
  - testo con gradient + slight sheen
- **Luce animata**
  - keyframes lente (18–26s) su un overlay (opacity bassa)

---

## 4) Implementazione (file e interventi)
### 4.1 `src/components/eden/EdenLanding.tsx`
- Modifico SOLO la sezione `<section id="storia">`:
  1) Inserisco wrapper “libro” (`.story-book`, `.story-book-inner`)
  2) Aggiungo un divider ornamentale (es. `<div className="story-ornament" aria-hidden="true" />`)
  3) Riscrivo titolo e paragrafi (copy nuova)
  4) Applico una classe per drop-cap al primo paragrafo (es. `.story-dropcap`)
  5) Mantengo i capitoli ma li rendo più “capitoli di un libro” (copy breve, più poetica)

### 4.2 `src/styles/eden.css`
- Estendo/ritocco il blocco `BLOCCO 2B · STORIA (NARRATIVA)`:
  1) Nuovi stili pannello:
     - `.story-book` (pannello perla su dark, bordo, shadow, glow)
     - `.story-book::before/::after` per filigrana/ornamenti (molto delicati)
  2) Gold foil title:
     - gradient + background-clip + animazione “sheen” lenta
  3) Drop cap:
     - `.story-dropcap::first-letter` con serif, gold, spacing corretto
  4) Ornamento divider:
     - `.story-ornament` con linea e piccolo sigillo centrale (CSS puro)
  5) Capitoli:
     - `.story-chapters` più “taccuino”/“appendice” con glow delicato
     - `.chapter-num` più inciso (tracking/opacity)
  6) Responsive:
     - su mobile: pannello a tutta larghezza, margini comodi, drop-cap ridimensionata
  7) Accessibilità:
     - contrasto testo su pannello perla (uso colori perla/ink leggibili)
     - riduzione animazioni con `prefers-reduced-motion` (luce animata off)

---

## 5) Criteri di accettazione (come verifichiamo)
1) Aprendo `/` e arrivando a **Storia**:
   - sembra una **pagina di libro** (premium)
   - titolo “wow” con effetto gold elegante, non eccessivo
   - testo leggibile e “da romanzo”
2) Animazioni:
   - luce lentissima, quasi impercettibile
   - con “riduci animazioni” attivo: niente animazioni decorative
3) Mobile:
   - testo comodo, nessun overflow, drop cap proporzionata
   - capitoli leggibili e non troppo “card-like”

---

## 6) Note rapide (per evitare effetti cheap)
- Niente texture “carta” fotografica pesante: solo gradient + filigrana CSS (più premium e pulita)
- Animazioni a bassa opacità e lunga durata (18–26s)
- Tipografia coerente con Cormorant Garamond già usata (effetto libro immediato)

