# Changelog

## 1.4

### Aggiunto
- **Selezione della lingua**: italiano, inglese, tedesco, francese, spagnolo.
  Si cambia dalla pagina impostazioni (⚙), campo "Lingua", con effetto immediato.
  Senza scelta si usa la lingua del browser; se non supportata, l'inglese.
- `i18n.js`: dizionario delle stringhe e funzioni `loadLang`, `setLang`, `t`, `applyI18n`.
- `_locales/{it,en,de,fr,es}`: nome e descrizione dell'estensione localizzati per lo store (`default_locale: en`).
- `store-assets/`: screenshot (1280×800), riquadro promozionale piccolo (440×280) e in primo piano (1400×560) per il Chrome Web Store, in italiano e in inglese (`store-assets/en/`).

### Modificato
- Popup, pagina impostazioni e notifiche degli avvisi usano le stringhe tradotte.
- Formato di numeri, valute e ora secondo la lingua scelta (prima: lingua del browser).
- `fees.js`: le fee restituiscono una chiave (`fast`, `medium`, `slow`, `economy`, `standard`) al posto dell'etichetta italiana; la traduzione avviene nell'interfaccia.
  Una cache salvata da versioni precedenti viene letta comunque e si aggiorna entro 30 secondi.
- `manifest.json`: versione 1.4, `name` e `description` da `_locales`.
- `README.md`: documentata la funzione lingua.

### Note
- Le traduzioni de, fr ed es non sono state riviste da un madrelingua.
- Gli screenshot dello store in tedesco, francese e spagnolo non sono stati generati.
