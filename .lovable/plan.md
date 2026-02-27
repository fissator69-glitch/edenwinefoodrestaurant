
Obiettivo
- Nella pagina “Locanda Eden” sostituire il titolo testuale “LOCANDA” con l’immagine allegata 1.
- Nella pagina “Masseria Petrullo” sostituire l’immagine titolo attuale con l’immagine allegata 2.

Contesto attuale (da codice)
- Locanda: `src/pages/LocandaEden.tsx` renderizza:
  - `<h1 id="locanda-hero-title" className="locanda-title">LOCANDA</h1>`
- Masseria: `src/pages/MasseriaPetrullo.tsx` usa già un titolo-immagine:
  - `import masseriaTitle from "@/assets/masseria-title.png";`
  - `<img className="masseria-title-image" src={masseriaTitle} ... />`

Asset forniti dall’utente
- Allegato 1 (LOCANDA): `user-uploads://Gemini_Generated_Image_wmdz0cwmdz0cwmdz_2_1.png`
- Allegato 2 (Masseria Petrullo): `user-uploads://Gemini_Generated_Image_5pbdii5pbdii5pbd_2_1.png`

Scelte tecniche (coerenti con progetto)
- Mettere le immagini in `src/assets/` e importarle nei componenti (pattern già usato per `masseria-title.png`).
- Mantenere accessibilità:
  - Tenere un testo “screen-reader only” (sr-only) dentro l’h1 (o un elemento equivalente) per non perdere semantica e SEO.
  - L’immagine avrà `alt` coerente.

Implementazione (step-by-step)
1) Copia degli allegati nel progetto
   - Copiare Allegato 1 in: `src/assets/locanda-title.png`
   - Copiare Allegato 2 in: `src/assets/masseria-title.png` (sovrascrivere l’attuale, così “sostituisce l’immagine che sta” senza cambiare il markup)
   Note: per il 1:1 con la repo originale, questa modifica introduce una differenza volontaria nei file; è esattamente ciò che stai richiedendo (sostituzione titoli).

2) Aggiornare “Locanda Eden” per usare l’immagine come titolo
   File: `src/pages/LocandaEden.tsx`
   - Aggiungere import:
     - `import locandaTitle from "@/assets/locanda-title.png";`
   - Sostituire l’h1:
     - Da testo “LOCANDA”
     - A una variante “title image” simile a Masseria:
       - `h1` mantiene `id="locanda-hero-title"` e classe `locanda-title` (così non rompiamo lo styling esistente se serve)
       - Dentro:
         - `<span className="sr-only">Locanda</span>`
         - `<img className="locanda-title-image" src={locandaTitle} alt="Locanda" loading="eager" decoding="async" />`

3) Aggiungere/adeguare CSS per la resa dell’immagine “Locanda”
   File: `src/styles/eden.css`
   - Introdurre stile per `.locanda-title-image` (e, se necessario, una wrapper class tipo `.locanda-title--image` per allinearsi allo schema già usato su Masseria).
   - Obiettivo styling:
     - L’immagine deve comportarsi come un titolo: centrata, responsive, con max-width controllato.
     - Esempio di regole (verranno adattate ai valori già presenti nel CSS):
       - `display:block; margin-inline:auto; height:auto;`
       - `width: min(780px, 92vw);` (o valore analogo)
       - Eventuale `filter: drop-shadow(...)` se il titolo attuale aveva glow via CSS (valutato in base alle classi esistenti di Locanda).

4) “Masseria Petrullo”: sostituzione immagine
   - Approccio più pulito e con meno rischio UI: mantenere il componente identico e sostituire SOLO il file asset importato.
   - Copiando l’allegato 2 in `src/assets/masseria-title.png`:
     - Non serve cambiare `src/pages/MasseriaPetrullo.tsx`
     - La pagina inizierà automaticamente a mostrare il nuovo titolo.

5) Verifiche (manuali consigliate)
   - Aprire `/locanda-eden`:
     - verificare che il testo “LOCANDA” non sia più visibile e che l’immagine appaia ben centrata, senza deformazioni.
     - verificare responsive (mobile + desktop).
   - Aprire `/masseria-petrullo`:
     - verificare che il titolo immagine sia quello nuovo.
   - Controllare che non ci siano errori in console (import asset) e nessun 404 in Network per i nuovi PNG.

Rischi / Edge cases
- Le immagini caricate hanno glow e sfondo trasparente: se sul layout attuale risultano troppo grandi/piccole, basterà ritoccare `width/max-width` in `.locanda-title-image` senza toccare altro.
- Se `.locanda-title` applica `letter-spacing/text-transform` o altre proprietà testuali che impattano il layout, potremmo aggiungere una classe “--image” per neutralizzare effetti (es. `line-height`) solo quando il titolo è un’immagine.

File che verranno coinvolti
- Nuovi/aggiornati asset:
  - `src/assets/locanda-title.png` (nuovo)
  - `src/assets/masseria-title.png` (sostituzione dell’esistente)
- Modifiche codice:
  - `src/pages/LocandaEden.tsx`
- Modifiche stile:
  - `src/styles/eden.css`

Criteri di completamento
- In `/locanda-eden` il titolo è l’immagine allegato 1, e il testo “LOCANDA” non è più visibile (resta solo per screen reader).
- In `/masseria-petrullo` il titolo immagine è quello dell’allegato 2.
- Nessun errore console, nessun 404 degli asset.