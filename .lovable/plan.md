
## Obiettivo
Ricreare **pixel-perfect-passer** nel progetto Lovable corrente in modo **1:1 (codice + UI)** partendo dalla repo:
https://github.com/ryoultimateagent-cyber/pixel-perfect-passer

## Vincoli reali (da rispettare per arrivare al “non sbagliare una virgola”)
- Lovable **non ha un comando “git clone”/import diretto** di una repo esistente.
- Per ottenere un 1:1 del *codice* dobbiamo **portare dentro al progetto gli stessi file** della repo (struttura + contenuti + assets + config).
- Questo si può fare in due modi pratici:  
  1) **Import “manuale assistito” via download dei file raw da GitHub** (fattibile, ma richiede prendere *tutti* i file uno per uno/come elenco completo)  
  2) **Upload dello ZIP della repo** (è il modo più rapido e meno rischioso per un vero 1:1)

> Nota: non è “una storia”, è un vincolo operativo. Senza trasferire i file dentro il progetto, non esiste modo di garantire il 1:1 del codice.

---

## Approccio A (consigliato per precisione): Import tramite ZIP (copia 1:1 più affidabile)
### Step 1 — Ottenere lo ZIP
- Scaricare la repo come ZIP da GitHub (“Code” → “Download ZIP”).

### Step 2 — Caricamento nel progetto (a blocchi, rispettando i limiti)
- Caricare i file/cartelle in più messaggi (max 10 file per messaggio, max 20MB per file).
- Priorità di upload (ordine):
  1. **package.json + package-lock.json / bun.lockb**
  2. **vite.config.ts, tailwind.config.ts, postcss.config.js, tsconfig\*.json, components.json, index.html**
  3. **public/** (tutti gli asset)
  4. **src/** (tutto il codice)

### Step 3 — Allineamento totale del progetto
- Sovrascrivere i file esistenti del progetto corrente con quelli della repo.
- Verificare che entrypoint, routing e componenti corrispondano.

### Step 4 — Build & parity check
- Avvio in preview e controllo:
  - nessun errore console
  - UI e navigazione identiche
  - responsive e stati (hover/focus) corretti

---

## Approccio B (senza ZIP): Copia “raw” da GitHub dentro Lovable (più lungo, ma si può fare)
### Step 1 — Inventario completo dei file
- Estrarre l’elenco di TUTTI i file dalla repo (inclusi subfolder in `src/`, `public/`, `.lovable/` se necessario).
- Per 1:1 serve anche catturare **assets** e non solo TSX/TS.

### Step 2 — Download contenuti file via GitHub “raw”
- Per ogni file, prendere il contenuto dalla URL “raw” (raw.githubusercontent.com/…).
- Per asset binari (png/svg/font) scaricare i binari e inserirli in `public/` o dove sono nella repo.

### Step 3 — Ricostruzione file-by-file nel progetto
- Creare/sovrascrivere i file nel progetto rispettando:
  - path identici
  - contenuto identico
  - newline/encoding coerenti (quanto possibile)
- Ripetere fino a copertura 100% della repo.

### Step 4 — Verifica finale 1:1
- Esecuzione checklist visiva e funzionale:
  - Home e rotte
  - componenti UI
  - assets caricati correttamente
  - nessun mismatch di dipendenze

---

## Criteri di accettazione (“done”)
- Struttura cartelle **identica** alla repo
- File principali (`package.json`, config Vite/Tailwind/TS, `src/**`, `public/**`) **identici**
- App in preview senza errori e con UI **identica** a quella prevista dalla repo

---

## Piano operativo immediato (prossima azione)
1) Procediamo con **Approccio A (ZIP)** per massimizzare il vero 1:1 e minimizzare errori di copia.  
2) Se rifiuti lo ZIP, allora si fa **Approccio B** ma richiede comunque di trasferire nel progetto l’intero contenuto della repo (testo + binari) e richiede più iterazioni.

