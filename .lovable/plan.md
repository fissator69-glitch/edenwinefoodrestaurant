
Obiettivo immediato (quello che ti sta bloccando adesso)
1) Sistemare l’accesso Admin in modo che:
   - se la password/email è sbagliata ti dica chiaramente cosa fare (non solo “invalid login credentials”)
   - se l’email non è confermata ti mostri il bottone “Reinvia email di conferma”
   - tu possa fare “Password dimenticata” e resettare senza impazzire
2) Aggiungere un pannello “Utenti” in Admin per:
   - vedere la lista utenti creati (email + id + stato conferma)
   - cancellare utenti selezionandoli da una lista (con conferma e protezioni)
3) Risolvere il “bootstrap” del ruolo admin (adesso `has_role(..., admin)` torna `false` e quindi anche se fai login ti ributta fuori dall’admin).

Contesto che ho già dai log / codice
- Le richieste mostrano sia `email_not_confirmed` (prima) sia `invalid_credentials` (quando si prova con email/password diverse o password sbagliata).
- L’utente `admin@edewinefood.it` risulta poi confermato e con login OK, ma `rpc/has_role` risponde `false` ⇒ manca la riga in `user_roles` per quel user_id.
- L’Admin è protetto correttamente via controllo server-side (RPC `has_role`), quindi non c’è bypass lato client: va solo “sbloccato” il ruolo.

Cosa implementerò (frontend + backend) — in passi piccoli e verificabili

A) Bootstrap del primo admin (sblocco accesso)
1. Inserire una riga in `user_roles` con:
   - `user_id = a823052b-6989-4c40-a862-9344ae1d88a7` (quello visto nei log)
   - `role = 'admin'`
2. Subito dopo:
   - fare logout/login e verificare che `has_role` torni `true`
   - accedere a `/admin` senza redirect.

Nota sicurezza:
- I ruoli restano SOLO in tabella separata `user_roles` (come già fatto).
- Non userò localStorage/sessionStorage né credenziali hardcoded per decidere chi è admin.

B) Sistemare “invalid login credentials” (UX + flusso auth robusto)
Modifiche a `src/pages/admin/AdminLogin.tsx`:
1) Gestione errori “intelligente”:
   - Se `error.code === "email_not_confirmed"`: mostra callout con bottone “Reinvia conferma” (invoca resend).
   - Se `error.code === "invalid_credentials"`: testo chiaro “Email o password errate”.
   - Messaggi più “umani” nei toast (senza perdere dettagli tecnici in console).
2) Aggiungere “Password dimenticata?”:
   - Link sotto al form che apre una modalità “reset password”
   - Chiede email e invia reset con redirect su `/reset-password`.
3) Creare la pagina pubblica `/reset-password`:
   - Form nuova password + conferma
   - Legge il contesto recovery dalla URL/hash come richiesto dal provider auth
   - Chiama `supabase.auth.updateUser({ password })`.
4) (Opzionale ma consigliato) Aggiungere anche un pulsante “Mostra/Nascondi password” per ridurre errori di digitazione.

C) Funzione backend “admin-users” per lista/cancellazione utenti (solo admin)
Per poter cancellare utenti “veri” del sistema auth non basta il client; serve una funzione backend che usi la chiave di servizio.

1) Creare una backend function (Edge Function) `admin-users` con queste regole:
   - `verify_jwt = false` in `supabase/config.toml` per evitare problemi di verifica gateway in questo ambiente.
   - Validazione manuale nel codice:
     - prende header `Authorization`
     - `supabase.auth.getUser(token)` per validare token
     - verifica admin via DB (`has_role(user.id, 'admin')`) usando un client con service key o una query diretta a `user_roles` (sempre server-side).
   - Se non admin ⇒ 403.
2) Endpoint supportati:
   - `GET` → ritorna lista utenti paginata (email, id, created_at, email_confirmed_at)
   - `DELETE` con `{ userId }` → cancella un utente
3) Sicurezze:
   - bloccare cancellazione del proprio account (self-delete) oppure richiedere doppia conferma
   - logging minimale (no leak token)
   - CORS headers corretti.
4) Non modificherò tabelle di sistema; userò le API admin supportate dalla libreria.

D) Tab “Utenti” in AdminDashboard (selezione da lista + delete)
1) Aggiungere nuovo tab “Utenti” in `src/pages/admin/AdminDashboard.tsx`.
2) UI:
   - tabella con:
     - Email
     - Stato conferma (Confermata / Non confermata)
     - Created at
     - User ID (copiabile)
   - checkbox per selezionare uno o più utenti
   - bottone “Cancella selezionati” con AlertDialog (Radix) + conferma
   - filtro veloce (search email)
3) Integrazione:
   - usa `supabase.functions.invoke("admin-users", { body })` per list e delete
   - gestisce loading/error con toast
   - refresh dopo delete.

E) Fix secondari (non bloccanti, ma puliscono console)
Dai console log risulta un warning sui ref durante render:
- indagherò dove passa un `ref` a componenti function (probabile interazione `FormControl`/Slot o un wrapper che fa cloneElement).
- Se replicabile, applicherò un fix mirato (forwardRef dove serve) per ridurre rumore in console, senza cambiare UI.

Sequenza di rilascio (per non rompere nulla)
1) Inserimento ruolo admin per il tuo userId (sblocco immediato).
2) AdminLogin: messaggi errore + “reinvia conferma” + “password dimenticata”.
3) Nuova route `/reset-password` e test completo reset.
4) Backend function `admin-users` (list + delete) con controlli admin robusti.
5) Tab “Utenti” in AdminDashboard (selezione da lista + cancellazione).
6) Fix warning ref (se ancora presente e riproducibile).

Cosa ti chiederò di testare (end-to-end)
1) Login admin:
   - prova password sbagliata → messaggio chiaro
   - prova email non confermata (se ne hai una) → appare “Reinvia conferma”
2) Reset password:
   - invio email reset → arrivo su `/reset-password` → set nuova password → login OK
3) Gestione utenti:
   - apri tab “Utenti”
   - selezioni 1-2 account di test
   - cancelli e ricarichi lista
   - verifichi che non puoi cancellare te stesso (o che richiede doppia conferma)
4) Accesso `/admin`:
   - verificare che dopo bootstrap ruolo admin non ti rimbalza più.

Impatto su sicurezza
- Tutte le operazioni “pericolose” (lista utenti/cancellazione) saranno lato backend con:
  - token validato
  - controllo ruolo admin server-side
  - nessuna fiducia nel client.
- Ruoli sempre in tabella separata `user_roles`.

File/aree coinvolte (indicativo)
- Frontend:
  - `src/pages/admin/AdminLogin.tsx` (migliorie UX + reset flow)
  - `src/pages/admin/ResetPassword.tsx` (nuovo)
  - `src/App.tsx` (aggiunta route /reset-password)
  - `src/pages/admin/AdminDashboard.tsx` (nuovo tab Utenti)
- Backend:
  - `supabase/functions/admin-users/index.ts` (nuovo)
  - `supabase/config.toml` (aggiunta blocco verify_jwt=false per questa function)
- Dati:
  - inserimento riga `user_roles` per il tuo user_id (operazione dati, non schema)

Nota operativa su “cancellare gli user creati”
- Hai scelto “Selezione da lista”: quindi non cancello “a tappeto”.
- Ti metto un pannello dove li vedi e scegli tu; è l’approccio più sicuro per evitare di cancellare utenti reali per errore.
