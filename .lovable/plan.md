
## Obiettivo (vincoli chiari)
- **Mobile: 2 colonne SEMPRE** (niente 1 colonna).
- Il “riquadro recensioni” deve permettere di **leggere**: niente clipping/tagli sopra/sotto, niente contenuti che “spariscono” sotto i fade.
- Movimento **verticale continuo**, ma **non caotico**: “non ordinato” = colonne con velocità diverse + offset, **non** card che si muovono ognuna per conto suo.
- **Velocità più lenta** (ritmo premium).
- Pausa su touch/hover resta.

---

## 1) Diagnosi (perché ora “è sbagliato”)
1) **Due colonne + leggibilità**: su mobile stretto due colonne ci stanno, ma serve:
   - più spazio utile (padding/gap corretti),
   - testo dimensionato/line-height corretto,
   - niente effetti che spostano la card fuori dal viewport del marquee.
2) **“Tagliati”**: il clipping arriva dalla combinazione di:
   - `overflow: hidden` (marquee + colonna),
   - fade overlay sopra/sotto,
   - e soprattutto **parallax su `.review-card`** (animazione che usa `transform`) che, insieme allo scorrimento e ai vari hover transform, fa sembrare tutto “a cavoli loro” e crea tagli ai bordi.
3) **Velocità**: anche se hai già rallentato rispetto all’inizio, su mobile la percezione resta “troppo veloce” perché il contenuto è denso e l’occhio non riesce a leggere.

---

## 2) Design corretto (senza prove/esperimenti)
### A) Mobile: 2 colonne fisse + card più “leggibili”
- Forzo **sempre** `grid-template-columns: 1fr 1fr` su mobile (rimuovo la media query a 420px).
- Uso `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)` per evitare overflow “strani” in colonne strette.
- Aumento la leggibilità riducendo gli elementi troppo invasivi su mobile:
  - dimensione della quote `“` più piccola su mobile,
  - font della recensione leggermente più piccolo ma con **line-height più alto**,
  - padding della card calibrato (non troppo piccolo).

### B) Stop al “vanno a cavoli loro”: rimuovere il parallax sulle singole card
- **Togliamo l’animazione `reviews-card-parallax` dalle `.review-card` su mobile.**
- L’effetto “non ordinato” lo otteniamo in modo pulito con:
  - due colonne con durate diverse (slow/fast),
  - un offset di fase (delay),
  - (se serve) un micro “drift” applicato **alla track** (non alla card) con `filter/opacity` o un leggerissimo `translateX` costante, ma senza trasformazioni concorrenti.

> Questo è il punto principale: la parallax sulle card è la causa n.1 del “casuale” + clipping.

### C) Anti-clipping reale (non cosmetico)
- Aumento lo “spazio di sicurezza” sopra/sotto nella track:
  - `padding-block` più alto (es. 56–64px) così le card non finiscono sotto i fade.
- Riduco aggressività del fade:
  - altezza overlay più bassa (es. 28–36px) e gradiente più soft **oppure**
  - se vuoi zero tagli percepiti: rimuovo completamente i fade su mobile.
- Disattivo l’hover-lift su mobile nel marquee:
  - `.reviews-marquee .review-card:hover { transform: none; }`
  (su touch non ha senso e può creare micro-tagli)

### D) Velocità “giusta”: rallentamento deciso
- Imposto durate più lente e coerenti:
  - `slow`: 58–64s
  - `fast`: 44–50s
- Mantengo differenza tra colonne ma senza “accelerazioni percepite”.
- L’offset (`--delay`) lo rendo proporzionato alla durata (es. 10–14s) così le colonne non “si riallineano” in modo evidente.

---

## 3) Modifiche concrete (file)
### 3.1 `src/styles/eden.css` (solo mobile @media max-width: 640px)
1) **Rimuovere** completamente la sotto-media-query `@media (max-width: 420px)` che porta a 1 colonna.
2) Cambiare:
   - `.reviews-marquee { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 16px; }`
3) Anti tagli:
   - aumentare `padding-block` della `.reviews-marquee-track` (56–64px)
   - ridurre overlay `::before/::after` a ~32px oppure eliminarli su mobile
4) **Disabilitare parallax card** su mobile:
   - rimuovere (o override) `animation: reviews-card-parallax ...` dalle `.reviews-marquee .review-card`
   - lasciare solo lo scorrimento della track
5) **Rallentare**:
   - `.reviews-marquee-col[data-speed="slow"] { --dur: 60s; --delay: 12; }`
   - `.reviews-marquee-col[data-speed="fast"] { --dur: 46s; --delay: 0; }`
6) Mobile typography:
   - ridurre `.rc-quote` su mobile,
   - `.rc-text { font-size: ...; line-height: ...; }`
   - `.review-card { padding: 18–22px; }` ma senza comprimere troppo.

### 3.2 `src/components/eden/EdenLanding.tsx`
- Non serve cambiare markup.
- (Opzionale ma “pulito”): aggiungere una classe wrapper interna tipo `<div className="review-card-inner">...</div>` solo se vuoi reintrodurre micro-effetti in futuro senza conflitti di `transform`. Per “sistemare tutto subito”, io non lo farei: meglio stabilità.

---

## 4) Verifica end-to-end (obbligatoria, senza “prove”)
1) Mobile 360–430px:
   - 2 colonne visibili
   - testo leggibile dentro ogni card
   - nessun taglio evidente sopra/sotto
   - scorrimento lento e “premium”
2) Touch:
   - press = pausa
   - rilascio = riparte
3) Desktop:
   - griglia desktop invariata
   - hover pausa sul marquee non impatta perché su desktop non lo vedi (o se lo vedi in responsive, comunque deve funzionare)

---

## 5) Output atteso (criteri di accettazione)
- “Due colonne” rispettato.
- Nessun contenuto che appare troncato/fuori container.
- Movimento verticale continuo, non caotico.
- Velocità chiaramente più lenta e leggibile.
