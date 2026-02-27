
Obiettivo
- Far sì che con le credenziali **admin@edenwinefood.it / Eden@2026** tu entri davvero in **/admin** (senza rimanere bloccato su /admin/login).
- Mantenere la regola: entra solo chi ha ruolo **admin** nella tabella separata `user_roles` (già fatto).

Diagnosi (perché ora “non entra” anche se il ruolo è OK)
- Dai log di rete si vede chiaramente che:
  - login riuscito (status 200) con password corretta (in una richiesta risulta Eden@2025, ma il punto è che una delle prove ha fatto login OK),
  - `rpc/has_role` risponde `true` per il tuo user id.
- Quindi backend/ruolo sono a posto.
- Il blocco è molto probabilmente un **race condition nel frontend**: `useAdminAuthGuard` fa così:
  1) quando vede una sessione imposta subito `isAdmin: false`
  2) parte l’`checkAdmin()` async
  3) nel frattempo `shouldRedirect` vede “authenticated ma non admin” → **redirect immediato a /admin/login**
  4) quando arriva `isAdmin: true` è troppo tardi perché sei già stato riportato alla login.
- Risultato percepito: premi “Entra”, vedi toast con User ID, ma resti su /admin/login.

Soluzione tecnica (corretta “come si deve”)
- Cambiare lo stato del guard per distinguere chiaramente:
  - “utente autenticato ma sto ancora verificando se è admin” (NON devo redirectare)
  - “utente autenticato e NON è admin” (qui sì che redirecto)
- In pratica: introdurre uno stato `isAdmin: null` oppure uno status esplicito tipo `"checking_role"` e trattarlo come loading.

Modifiche previste (file e cosa cambierà)
1) `src/hooks/useAdminAuthGuard.ts`
   - Cambiare il tipo `AdminAuthState` per includere lo stato di verifica ruolo:
     - Esempio: `isAdmin: null` durante la verifica (oppure aggiungere `status: "checking"`).
   - Quando arriva la sessione:
     - impostare `isAdmin: null` (non false)
     - lanciare `checkAdmin()`
     - aggiornare poi `isAdmin: true/false` al termine
   - Aggiornare `shouldRedirect`:
     - se `isAdmin === null` → NON redirectare (resta in loading)
     - redirect solo quando `isAdmin === false` e `requireAdmin === true`.

2) `src/components/admin/ProtectedAdminRoute.tsx`
   - Trattare anche lo stato “verifica ruolo in corso” come loading:
     - mostrare “Caricamento…” finché `isAdmin` non è determinato.
   - Renderizzare la dashboard solo quando `status === "authenticated"` e `isAdmin === true`.

3) `src/App.tsx` (piccolo fix qualità)
   - Ripristinare la route catch-all:
     - `<Route path="*" element={<NotFound />} />`
   - Non è la causa del blocco admin, ma evita comportamenti strani su URL non mappate.

Verifica end-to-end (cosa farai tu in preview)
- Apri `/admin/login`
- Login con:
  - email: `admin@edenwinefood.it`
  - password: `Eden@2026`
- Atteso:
  - dopo il click su “Entra” vai su `/admin`
  - vedi la schermata “Caricamento…” per un attimo (mentre controlla il ruolo)
  - poi compare la dashboard Admin (Tabs Contatti/Privacy/Footer/Social/Media/Utenti)
- Controllo finale:
  - prova a salvare “Contatti” o “Footer” per confermare che le policy admin funzionano.

Note importanti (vincoli rispettati)
- Non verranno mai “hardcodate” le credenziali nel codice.
- L’accesso resta: login + verifica server-side del ruolo tramite `has_role()` e tabella separata `user_roles` (come richiesto e come da best practice).

Output atteso dopo le modifiche
- Il comportamento “vedo User ID ma torno alla login” sparisce.
- `/admin` diventa accessibile stabilmente per l’account admin, e bloccata per tutti gli altri.
