
Obiettivo
- Ripristinare l’accesso a /admin senza loop/redirect e far funzionare la tab “Utenti” (lista + cancellazione) che dipende dal ruolo admin.
- Far sì che non ricapiti il caos “utente giusto ma ruolo assegnato all’UUID sbagliato”.

Cosa sta succedendo (diagnosi basata su log + DB)
- Nel database c’è UNA sola riga in `public.user_roles`:
  - `user_id = a823052b-6989-4c40-a862-9344ae1d88a7`, `role = admin`.
- Ma l’utente con cui stai facendo login adesso è:
  - `user_id = 893b45cc-7f12-4c9f-abc6-48bf35d12109` (email: `admin@edenwinefood.it`).
- Il check `has_role(893b..., 'admin')` risponde `false` (lo si vede anche dalle request recenti).
- Quindi:
  - il login con password può anche andare a buon fine,
  - però `ProtectedAdminRoute`/`useAdminAuthGuard` ti rimbalzano perché `isAdmin` resta false,
  - e anche la funzione backend `admin-users` risponde 403 perché verifica admin server-side con l’UUID del token.

Perché è successo
- Hai creato/ottenuto più account admin “di prova” (o con email molto simili) e io ho bootstrapppato il ruolo admin sull’UUID sbagliato (quello che risultava dai log di un tentativo precedente).
- In particolare si vedono email simili nei log storici (ed è facilissimo confondersi). Il risultato è che il ruolo è sul vecchio utente, mentre tu stai loggando con un altro.

Cosa farò (implementazione) — passi piccoli e verificabili

1) Fix immediato (dato/ruolo): assegno admin all’utente che stai usando ORA
- Inserisco in `public.user_roles` una riga:
  - `user_id = 893b45cc-7f12-4c9f-abc6-48bf35d12109`
  - `role = 'admin'`
- Lo faccio in modo “safe”:
  - se esiste già, non duplica (la tabella ha vincolo unique (user_id, role)).
- Verifica:
  - ripeto `rpc/has_role` per 893b... e deve tornare `true`.
  - dopo refresh, /admin deve aprirsi senza redirect a /admin/login.

2) (Opzionale ma consigliato) Pulizia: rimuovo admin dal vecchio UUID se non ti serve
- Se `a823052b-...` è solo un test, tolgo il ruolo admin da quell’utente (DELETE da `public.user_roles` per quell’UUID).
- Questo riduce rischio di “admin fantasma” rimasti in giro.
- Nota: lo faccio solo dopo che confermi che quell’account non ti serve.

3) Rendere “anti-inculata” il login admin: mostrare chiaramente quale account è loggato e se è admin
Stato attuale:
- `AdminLogin.tsx` già mostra un toast con “User ID” dopo login.
Problema:
- Il toast si perde e non aiuta quando poi vieni redirectato.
Miglioria che implementerò:
- In `/admin/login` aggiungo un riquadro “Stato sessione” sempre visibile:
  - Email loggata (se presente)
  - User ID (copiabile)
  - Esito “Admin: sì/no” (chiamando `has_role` in pagina login)
  - Se “Admin: no”, mostro un messaggio chiaro: “Sei autenticato ma non hai i permessi admin”.
Risultato: se in futuro fai login con l’account sbagliato, te ne accorgi subito senza impazzire.

4) Verifica che la tab “Utenti” funzioni davvero (lista e cancellazione)
- Una volta che 893b... è admin:
  - `admin-users` (funzione backend) deve tornare 200 su GET.
  - La tab “Utenti” in `AdminDashboard.tsx` deve popolarsi.
- Testo anche la delete:
  - seleziono 1 utente test e provo cancellazione.
  - verifico che “self-delete” sia bloccato (già implementato nella funzione backend: se `userId === requesterId` → 400).

5) Checklist end-to-end (quella che ti chiedo di fare anche tu)
- Login:
  - fai login con `admin@edenwinefood.it`
  - vai su `/admin` e resta dentro.
- Tab Utenti:
  - apri tab “Utenti”
  - vedi la lista
  - cancelli 1 utente test
  - fai refresh e verifichi che è sparito.

Ambiguità minima da chiarire (solo per la pulizia)
- Vuoi che rimuova il ruolo admin dall’utente vecchio `a823052b-...` oppure lo tieni (es. come “backup admin”)?

Dettagli tecnici (per trasparenza)
- Non tocchiamo `auth.users`, né salviamo ruoli nel profilo: rimane tutto nella tabella separata `public.user_roles` e la verifica permessi avviene server-side via `has_role()`.
- La funzione backend `admin-users` è già corretta come modello di sicurezza: valida token e poi verifica admin dal database usando una chiave server. Il problema attuale è solo che l’utente loggato non aveva il ruolo.

Output atteso
- /admin finalmente si apre e non ti prende per il culo.
- La tab “Utenti” mostra gli account creati e puoi cancellarli selezionandoli dalla lista.
