
## Obiettivo
Eliminare completamente dal root la sezione **“Sezioni del sito”** che avevo aggiunto (markup + stili), mantenendo invariati:
- le rotte “ricercabili” già create (`/eden`, `/cucina`, `/gallery`, `/eventi`, `/recensioni`, `/contatti`)
- la navigazione header che punta a queste rotte

---

## 1) Cosa rimuovere (dove si trova)
### A) Markup (React)
File: `src/components/eden/EdenLanding.tsx`

C’è un blocco subito dopo la sezione Hero:

- Commento: `/* SEZIONI DEL SITO (ROOT) */`
- `<section id="sezioni" className="site-sections reveal-on-scroll"> ... </section>`

Intervallo (dalle righe che vedo ora): **1020 → 1067**

✅ Azione: cancellare **interamente** quel `<section>` (solo quel blocco), così sparisce dal sito.

---

### B) CSS dedicato
File: `src/styles/eden.css`

C’è un blocco dedicato:

- Commento: `ROOT · SEZIONI DEL SITO`
- classi: `.site-sections`, `.site-sections-grid`, `.site-sections-card`, `.site-sections-links`, `.site-sections-cta`, ecc.

Intervallo (dalle righe che vedo ora): **4877 → 5007**

✅ Azione: rimuovere **tutto** quel blocco CSS, così non restano “stili morti” nel progetto.

---

## 2) Verifica (end-to-end)
1) Apri `/` e scorri dopo Hero: **la sezione “Sezioni del sito” non deve più esistere**.
2) Verifica che i link dell’header continuino a funzionare:
   - `/eden`, `/cucina`, `/gallery`, `/eventi`, `/recensioni`, `/contatti`

---

## 3) Nota importante (per allineamento con la tua richiesta originale)
La tua richiesta “devono essere /eden; /cucina; …” è già coperta dalle rotte che abbiamo aggiunto in `App.tsx` + `EdenSection.tsx`.
Quindi rimuovere “Sezioni del sito” non rompe la “ricerca”/indicizzazione per URL: restano gli URL puliti che volevi.
