
## Obiettivo (richiesta tua)
Sistemare la sezione **Recensioni** su **mobile** perché:
- le card risultano **troppo strette** (2 colonne su schermi piccoli)
- alcune parti risultano **tagliate** (clipping in alto/basso + fade troppo aggressivo + overflow)
- la velocità del marquee è **troppo alta** → va **rallentata** fino a un ritmo “giusto”

---

## 1) Esplorazione (cosa vedo ora)
In `src/styles/eden.css` (mobile):
- `.reviews-marquee` è **2 colonne** (`grid-template-columns: 1fr 1fr`) con `height: 520px` e `overflow: hidden`
- ogni colonna ha `.reviews-marquee-track` con animazione `reviews-marquee-up`:
  - slow: `--dur: 26s`
  - fast: `--dur: 18s`
- c’è un fade overlay alto/basso da `72px`
- le card hanno anche un “float/parallax” con `transform` (micro movimento), e l’intero sistema sta dentro contenitori con `overflow: hidden` → vicino ai bordi è facile percepire “taglio”.

---

## 2) Design (come lo sistemiamo su mobile)
### A) Leggibilità / “troppo strette”
- Passo a layout **responsivo**:
  - **1 colonna** su telefoni piccoli (es. ≤ 390px o ≤ 420px)
  - **2 colonne** solo quando c’è abbastanza spazio (es. da 391/421px in su)
- Aggiungo `min-width: 0;` alle card dentro la grid per evitare overflow strani in layout stretti.

### B) “Tagliato” (clipping)
Riduciamo la percezione di taglio senza perdere l’effetto marquee:
- Aumento leggermente `height` (con `clamp(...)` così si adatta al device)
- Metto più “respiro” interno alla track con `padding-block` (spazio sopra/sotto), così le card non finiscono subito sotto il fade
- Riduco l’altezza dei fade overlay (es. da 72px → 44/52px) oppure li rendo meno aggressivi (gradiente più morbido)
- Ridimensiono l’ampiezza del micro-float su mobile (il float è bello ma se spinge troppo vicino ai bordi, sembra tagliato)

### C) Velocità “troppo alta”
- Rallento le durate:
  - slow: da 26s → ~40–46s
  - fast: da 18s → ~30–34s
- Mantengo comunque differenze di velocità/delay tra colonne per l’effetto “non ordinato”, ma in modo più elegante e “premium”.

---

## 3) Modifiche concrete (file e punti precisi)
### 3.1 `src/styles/eden.css`
Nel blocco mobile dove ora hai:
- `.reviews-marquee { grid-template-columns: 1fr 1fr; height: 520px; gap: 12px; }`
- `.reviews-marquee-col[data-speed="slow"] { --dur: 26s; }`
- `.reviews-marquee-col[data-speed="fast"] { --dur: 18s; }`
- overlay `height: 72px`
- `.reviews-marquee-track { padding: 4px; }`

Applico:
1) **Altezza e spaziatura migliori**
- `height: clamp(560px, 70vh, 720px);`
- `gap: 14px;` (un filo più arioso)
- track: `padding: 10px;` + `padding-block: 44px;` (anti-taglio)

2) **Breakpoint per 1 colonna su schermi piccoli**
- Aggiungo una media query tipo:
  - `@media (max-width: 420px) { .reviews-marquee { grid-template-columns: 1fr; } }`
  (così su telefoni piccoli le card non sono “strettissime”)

3) **Rallento il marquee**
- `slow --dur` → 42s (o 46s)
- `fast --dur` → 32s (o 34s)
- (eventualmente) riduco anche l’effetto “delay” se crea accelerazioni percepite

4) **Fade overlay meno “tagliente”**
- `height` overlay: 72px → 48/52px
- gradiente: lo rendo più morbido (più trasparenza più graduale)

5) **Float/parallax più “pulito” e meno clipping**
- Riduco ampiezza del keyframe:
  - invece di 8px, scendo a 4–6px max
- Aggiungo `min-width: 0;` sulle card nel marquee:
  - `.reviews-marquee .review-card { min-width: 0; }`
  (evita tagli/overflow strani in colonne strette)

> Nota: resto compatibile con **pausa su hover/touch** e con **prefers-reduced-motion** (non tocco quel comportamento).

### 3.2 (Opzionale) `src/components/eden/EdenLanding.tsx`
Non è strettamente necessario per il tuo problema, ma se dopo CSS vedi ancora card “alte” o testo troppo lungo:
- posso aggiungere una variante “short text” (taglio controllato con `line-clamp`) **solo su mobile** per mantenere leggibilità in 2 colonne.
Prima però proviamo con le correzioni CSS sopra: di solito basta.

---

## 4) Verifica end-to-end (manuale in preview)
1) Test su mobile (telefono o viewport 390px):
- Vai a `#recensioni`
- Conferma che ora è **1 colonna** (card più larghe e leggibili)
- Verifica che non sembri “tagliato” in alto/basso (fade più morbido + padding)
- **Premi e tieni premuto**: tutto si mette in pausa, rilascia e riparte

2) Test su mobile più largo (414–430px):
- Conferma che può tornare a **2 colonne** senza diventare troppo stretto
- Movimento più lento e “premium”

3) Desktop:
- Hover pausa OK
- La griglia desktop resta invariata (marquee è solo mobile)

---

## 5) Micro-decisione che ti chiedo (per non andare a tentativi)
Soglia per passare a 1 colonna su mobile: preferisci?
- **A)** 420px (più spesso 1 colonna, massima leggibilità)
- **B)** 390px (solo telefoni davvero piccoli)
Io propongo **A) 420px** per evitare “troppo strette” su tanti dispositivi.

