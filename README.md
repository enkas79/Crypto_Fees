# Crypto Fees

Estensione Chrome (Manifest V3) che mostra le fee di rete e i prezzi, con avvisi quando le fee scendono.

## Funzioni
- **Bitcoin:** fee in sat/vB (4 livelli con tempo di conferma) da mempool.space.
- **Reti EVM selezionabili:** Ethereum, Base, Arbitrum, Optimism, Polygon, via `eth_feeHistory` su RPC pubbliche (nessuna API key).
- **Prezzi** di BTC, ETH/POL e oro con variazione 24h (CoinGecko), valuta selezionabile: USD, EUR, GBP, CHF, JPY.
  L'oro è il prezzo di PAXG, token ancorato a 1 oz, proxy dello spot.
- **Costo stimato** di una transazione tipica (BTC 141 vB; EVM trasferimento semplice da 21.000 gas).
  Sulle L2 (Base, Arbitrum, Optimism) esclude la fee dati L1, quindi è una stima per difetto.
- **Badge** sull'icona con la fee BTC veloce, aggiornato ogni minuto.
- **Avvisi sotto soglia** (⚙ nel popup): notifica quando la fee scende sotto il valore scelto, per BTC (fee veloce)
  e per ogni rete EVM (fee standard). Si riarma quando la fee risale del 10% sopra soglia.

- **Lingua** selezionabile dalla pagina impostazioni (⚙): italiano, inglese, tedesco, francese, spagnolo.
  Senza scelta si usa la lingua del browser (ripiego: inglese). Le stringhe sono in `i18n.js`.

## Installazione
`chrome://extensions` → Modalità sviluppatore → "Carica estensione non pacchettizzata" → cartella del repo.

`images/icon.svg` è il sorgente delle icone.
