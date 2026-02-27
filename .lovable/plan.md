
Obiettivo richiesto
- Rendere **/admin** “pubblica” con un pulsante “Entra” senza email né password.

Vincolo non negoziabile (sicurezza)
- Non posso rendere pubblica una pagina che:
  - modifica contenuti nel database,
  - carica file,
  - gestisce utenti (lista/cancellazione),
  perché equivale a dare a chiunque controllo completo del sito e degli account.
- Inoltre, anche se “tanto non ci entra nessuno”, l’URL pubblicato è accessibile a chiunque lo scopra (crawler, link, log, condivisioni, ecc.). Questa è una vulnerabilità critica.

Cosa sta succedendo adesso (perché “non ti fa entrare”)
- `/admin` è protetta da `ProtectedAdminRoute` che richiede **login + ruolo admin** (`has_role(userId,'admin')`).
- Attualmente la tabella `user_roles` non contiene admin (li abbiamo rimossi), quindi anche se fai login non risulti admin e non entri.
- In più, nel router manca la route `*` (catch-all) verso `NotFound`: è un bug collaterale del diff che va ripristinato per gestire le URL non mappate in modo pulito.

Soluzione che soddisfa il bisogno pratico (“entrare subito”) SENZA rendere pubblico l’admin
Scelgo un approccio a “frizione minima” ma sicuro: “entra con 1 click” tramite provider esterno oppure magic link. Entrambi evitano password, ma restano autenticazione vera.

Opzioni (ti propongo entrambe; implemento quella che approvi dopo questo piano)
A) “Entra con Google” (1 click, zero password)
- Aggiungo un bottone “Entra con Google” in `/admin/login`.
- Dopo il primo accesso, assegno il ruolo admin alla tua email (in `user_roles` come già previsto).
- Risultato: esperienza “premi e entri”, ma non pubblica.

B) “Entra con link” (magic link via email, zero password)
- Aggiungo “Entra con link” (inserisci solo email, ricevi link).
- Assegno admin alla tua email.
- Risultato: niente password, ma serve email.

Nota: La variante “nessuna email e nessuna password” implica per forza un segreto alternativo (token, PIN, basic auth, ecc.). Anche quello è una credenziale: se è pubblico e senza credenziali, è admin aperto.

Implementazione (cosa farei nel codice)
1) Fix routing generale
- Ripristinare la route catch-all:
  - in `src/App.tsx` aggiungere di nuovo: `<Route path="*" element={<NotFound />} />`
  - mantenendo le route admin esistenti.

2) Rendere chiaro il motivo del blocco (UX)
- In `src/pages/admin/AdminLogin.tsx` mostrare un messaggio esplicito:
  - “Per entrare in /admin serve essere admin. Se hai appena creato l’account, devo abilitarti io.”
- (Opzionale) mostrare lo “stato” (anon / logged / admin) e un pulsante “Copia User ID” per sblocco rapido.

3) Implementare “1 click login” (una delle opzioni A o B)
A) Google OAuth
- Aggiungere pulsante che chiama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/admin' } })`
- Gestire ritorno e redirect a `/admin`.

B) Magic link
- Aggiungere form email + `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/admin' } })`

4) Abilitazione admin (server-side, in tabella separata)
- Dopo che accedi una volta, mi dai:
  - l’email usata, oppure
  - lo User ID che già la UI ti mostra nel toast.
- E io inserisco la riga in `public.user_roles (user_id, role='admin')`.
- (Importante) Non sposto ruoli su profili o tabelle utenti: restano in `user_roles`.

5) Verifica end-to-end (checklist)
- Vai su `/admin/login`:
  - premi “Entra con Google” oppure “Entra con link”
  - conferma che torni nell’app
- Prima di assegnare ruolo:
  - `/admin` non deve aprirsi (corretto)
- Dopo assegnazione ruolo:
  - `/admin` apre la dashboard
  - salvataggi su `site_settings`, `site_footer`, `social_links` funzionano
  - “Utenti” carica (funzione backend “admin-users” = 200)

File coinvolti
- `src/App.tsx` (ripristino `* -> NotFound`)
- `src/pages/admin/AdminLogin.tsx` (aggiunta login 1-click + messaggi stato)
- (Nessun cambiamento a `client.ts` / `types.ts`)

Decisione minima necessaria per procedere
- Scegli quale “tasto ENTRA” vuoi:
  - Google (1 click, niente password)
  - Link via email (niente password)

Se insisti su “pubblico senza accesso”
- Posso al massimo creare una pagina pubblica tipo `/admin-preview` che mostra solo un’anteprima non interattiva (read-only) senza accesso a funzioni destructive; ma non posso esporre il vero pannello che modifica backend e utenti.