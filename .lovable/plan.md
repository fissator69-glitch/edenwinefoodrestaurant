
Obiettivo: completare l’import 1:1 della repo `ryoultimateagent-cyber/pixel-perfect-passer` nel progetto corrente, importando tutti i file mancanti (soprattutto `public/eden/**`) e rimuovendo i file “extra” che non esistono nella repo, così da ottenere parità totale (struttura + contenuti).

Stato attuale (da verifica effettuata):
- La repo GitHub (branch `main`) contiene, oltre ai file root e `src/**`, una cartella `public/eden/**` con immagini, SVG, un MP4 e un HTML.
- Nel progetto corrente `public/eden/**` NON è presente (attualmente `public/` contiene solo `favicon.ico`, `placeholder.svg`, `robots.txt`).
- Nel progetto corrente esistono anche file “extra” non presenti nella repo (esempi tipici osservati): `bun.lock`, `tsconfig.*.tsbuildinfo`, `src/tailwind.config.lov.json` (e potenzialmente altri). Hai confermato che vuoi “Cancellare extra”.

Fonte di verità per il 1:1:
- Userò l’albero file ufficiale della repo (Git tree API già ottenuto) come lista canonica di path.
- Per ogni file, il contenuto da copiare sarà esattamente quello del branch `main` (raw GitHub).

Cosa verrà importato (mancante) — focus su `public/eden/**`:
1) Creazione struttura cartelle in `public/eden/` e `public/eden/intro/`
2) Import binari e file statici elencati nella repo:
   - `public/eden/eden-hero-logo.png`
   - `public/eden/eden-logo.jpg`
   - `public/eden/intro/black_hole_remix.mp4`
   - `public/eden/intro/eden-intro-logo.png` (nota: nella repo risulta identico come contenuto a `eden-hero-logo.png`, ma va comunque presente come file separato con quel path)
   - `public/eden/leaf-source.png`
   - `public/eden/leaf.png`
   - `public/eden/nuovo_1-2.html`
   - `public/eden/petal-pink-source.svg`
   - `public/eden/petal-yellow-source.svg`
   - `public/eden/tulip-leaf-source.svg`
   - `public/eden/wheat-leaf-source.svg`
   - `public/eden/wheat-spike-gold-source.svg`
   - `public/eden/wheat-spike-green-source.svg`

Come verrà eseguita la copia (in blocchi, mantenendo 1:1):
- Importerò i file in blocchi da 5–10 file per messaggio/commit operativo, dando priorità ai binari critici per il rendering:
  1) MP4 + loghi (per evitare errori/mancati load nell’intro/hero)
  2) PNG/JPG grandi (leaf, ecc.)
  3) SVG
  4) HTML
- Per ogni file userò la versione raw del branch `main` (nessuna modifica del contenuto, nessuna “ottimizzazione”, nessuna ricompressione).
- Dopo ogni blocco, controllerò che i path usati in `src/**` (ad es. `/eden/...`) risolvano correttamente in preview (verifica di rete e/o console se necessario).

Rimozione file extra (richiesta “Cancellare extra”):
1) Genererò l’elenco dei file presenti nel progetto corrente (root + `src/**` + `public/**`).
2) Confronterò l’elenco locale con l’elenco canonico della repo.
3) Cancellerò tutti i file che sono presenti localmente ma NON esistono nella repo, includendo (salvo ulteriori scoperte):
   - `bun.lock` (la repo ha `bun.lockb`, non `bun.lock`)
   - `tsconfig.app.tsbuildinfo`
   - `tsconfig.node.tsbuildinfo`
   - `src/tailwind.config.lov.json`
   - eventuali altri file generati/aggiunti che non compaiono nella tree della repo
4) Nota: `node_modules/` e `.git/` sono presenti localmente ma non sono parte del repo “sorgente” in senso distributivo; tuttavia, essendo artefatti dell’ambiente, li tratterò separatamente:
   - Non sono file “di prodotto” e non impattano il 1:1 del codice sorgente; se la piattaforma consente la rimozione senza effetti collaterali, li lascerò gestiti dal sistema (tipicamente non vengono versionati comunque). L’obiettivo 1:1 è allineare i file del progetto versionabili.

Verifica parità (post-import):
- Struttura:
  - `public/` deve includere `eden/**` oltre ai file standard.
  - `src/**` e root devono combaciare con la lista repo.
- Funzionale/UI:
  - La home `/` deve caricare senza 404 di asset.
  - Intro video: il file MP4 deve partire (muted/autoplay) e il logo deve apparire.
  - Le rotte `/locanda-eden` e `/masseria-petrullo` devono renderizzare con assets corretti e senza richieste fallite.
- Debug:
  - Controllo console per errori asset missing o import.
  - Controllo network per status 404/500 sugli asset sotto `/eden/...`.

Sequenza operativa (implementazione in default mode dopo approvazione di questo piano):
1) Import blocco 1: `public/eden/intro/black_hole_remix.mp4`, `public/eden/eden-hero-logo.png`, `public/eden/intro/eden-intro-logo.png`, `public/eden/eden-logo.jpg`
2) Import blocco 2: `public/eden/leaf-source.png`, `public/eden/leaf.png`
3) Import blocco 3: tutti gli SVG in `public/eden/*.svg`
4) Import blocco 4: `public/eden/nuovo_1-2.html`
5) Sweep di parità:
   - List & delete extra files non presenti nella repo
   - Ultimo controllo dei path e della build/preview

Rischi/edge cases previsti (e mitigazioni):
- File binari grandi: l’MP4 (~3.4MB) rientra nei limiti, ma va importato con attenzione evitando qualunque trasformazione.
- Duplicazione contenuto (logo identico in due path): non farò dedup/symlink; creerò entrambi i file come in repo.
- Parità “non sbagliare una virgola”: per i file testuali userò copia raw; per i binari userò download diretto senza conversioni.

Criteri di completamento:
- `public/eden/**` presente e completo come in repo.
- Nessun file “extra” versionabile rimasto nel progetto rispetto alla tree della repo.
- Nessun errore console e nessun 404 sugli asset durante la navigazione principale.
