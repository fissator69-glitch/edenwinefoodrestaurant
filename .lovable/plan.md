
Obiettivo
- Rendere più morbida, delicata ed elegante la transizione tra:
  - apertura pagina Locanda ↔ apertura pagina Masseria Petrullo
  - ritorno indietro (browser back / link “Torna a EDEN”) tra le due pagine

Cosa succede oggi (dallo stato attuale del codice/CSS)
- La transizione è un “micro glow flash” di 320ms (`.eden-route-transition--flash`) con un picco di opacità alto e molto rapido.
- Viene attivata principalmente quando si usa `EdenTransitionLink` (click intercettato).
- Se l’utente usa il tasto “indietro” del browser o navigazioni non intercettate, la transizione potrebbe non partire.
- Inoltre la pagina non fa un vero “crossfade”: è solo un lampo overlay, quindi può risultare un po’ “secco”.

Approccio proposto (senza stravolgere l’architettura)
1) Far partire la transizione su ogni cambio route (anche back/forward)
- Modifica in `src/components/eden/EdenRouteTransitionProvider.tsx`
- Aggiungere `useLocation()` e un `useEffect` che ascolta `location.key` (o `location.pathname`) e:
  - se non è “reduced motion”
  - attiva `isTransitioning = true` per una durata leggermente più lunga (es. 520–650ms)
  - poi lo spegne
- Questo garantisce la transizione sia quando:
  - clicchi i link interni (Locanda → Masseria)
  - torni indietro (Masseria → Locanda)
  - navighi in modi non intercettati da `EdenTransitionLink`

Nota anti-doppia transizione
- Oggi `startEdenTransition()` già setta `isTransitioning` e poi fa `navigate()`.
- Se aggiungiamo anche l’effetto su `location`, rischiamo un “doppio trigger”.
- Soluzione:
  - introdurre un `ref` tipo `skipNextLocationTransitionRef`
  - quando `startEdenTransition()` viene usato, settiamo quel ref a `true`
  - l’`useEffect` su `location` se lo trova `true`, lo resetta a `false` e non ri-triggera

2) Rendere l’overlay meno “flash” e più “velo” elegante
- Modifica in `src/styles/eden.css` (sezione ROUTE TRANSITION)
- Cambiare animazione da “flash” (picco veloce e alto) a una curva più morbida:
  - durata: ~560ms (tweakabile)
  - easing più dolce (es. `cubic-bezier(0.22, 1, 0.36, 1)` oppure `ease-in-out`)
  - opacità massima più bassa (es. 0.55–0.7 invece di 1)
  - glow (`::before`) più “diffuso” (blur un po’ più alto, saturazione leggermente ridotta, scale più contenuta)
- Obiettivo: percezione “seta/lume”, non “flash”.

3) Aggiungere un micro crossfade della pagina (molto leggero)
- Sempre in `src/styles/eden.css`
- Oggi c’è:
  - `.eden-transitioning .page { transition: none; transform: none; filter: none; }`
  che disattiva qualsiasi delicatezza.
- Proposta:
  - Permettere una micro-animazione quando `isTransitioning` è true:
    - leggerissima variazione di opacity (es. 1 → 0.96 → 1)
    - un filo di blur (es. 0px → 1.5px → 0px) oppure solo opacity, a scelta (io proporrei blur minimo, molto elegante, ma possiamo anche evitarlo se vuoi “più pulito”)
    - micro-translateY (es. 0 → 2px → 0) opzionale
  - Il tutto sincronizzato con la durata della transizione overlay.

4) Rispetto accessibilità / preferenze utente
- Mantenere la regola già presente:
  - `@media (prefers-reduced-motion: reduce)` disattiva la transizione overlay
- Anche l’eventuale crossfade della pagina va disattivato nello stesso media query.

Dettaglio modifiche (file per file)
A) `src/components/eden/EdenRouteTransitionProvider.tsx`
- Importare `useLocation` da `react-router-dom`
- Aggiungere:
  - `const location = useLocation();`
  - `useEffect` che su cambio `location.key`:
    - se reduced motion: return
    - clear timers
    - set `isTransitioning(true)`
    - setTimeout -> `false` dopo `TOTAL_MS` (che aumenteremo, es. 560ms)
- Introdurre un `skipNextLocationTransitionRef` per evitare doppio trigger quando la navigazione è stata avviata da `startEdenTransition()`
- Aggiornare `TOTAL_MS` a un valore più elegante (es. 560ms; se vuoi ancora più “delicato”, 650ms)

B) `src/styles/eden.css` (sezione route transition)
- Aggiornare:
  - `.eden-route-transition--flash` e keyframes `edenRouteFlash` / `edenRouteFlashGlow`
  - oppure rinominare in qualcosa tipo `edenRouteVeil` per chiarezza (ma non è obbligatorio)
- Inserire la parte “page crossfade”:
  - rimuovere/ammorbidire il blocco “No blur/zoom on the page”
  - sostituirlo con transizioni leggere su `.eden-transitioning .page`
- Aggiornare anche la sezione `prefers-reduced-motion` per disabilitare eventuali nuove transizioni della pagina.

Criteri di successo (cosa vedrai in preview)
- Passando da Locanda a Masseria:
  - overlay luminoso più soffice (non “lampetto secco”)
  - cambio pagina percepito come fluido
- Tornando indietro (anche con browser back):
  - stessa transizione elegante, non “snap”
- Nessun blocco/attesa: la pagina continua a navigare subito, solo con un velo estetico.

Test consigliato (manuale in preview)
1) Apri `/locanda-eden` → clicca link verso `/masseria-petrullo` (o viceversa) e valuta la sensazione
2) Premi “indietro” del browser e verifica che la transizione parta comunque
3) (Opzionale) abilita “reduced motion” a livello sistema e verifica che le transizioni si disattivino

Parametri “tweak” rapidi (se vuoi una firma più o meno evidente)
- Durata: 520ms / 560ms / 650ms
- Opacità massima overlay: 0.55 / 0.65 / 0.75
- Crossfade pagina: solo opacity (più pulito) oppure opacity+micro blur (più “cinematico”)

Se approvi questo piano, in implementazione partirò con:
- transizione su location change (così risolve anche il “torna indietro”)
- overlay più morbido
- crossfade pagina molto leggero (solo opacity + blur minimo), facilmente regolabile dopo un tuo feedback (“più delicata” o “più visibile”).
