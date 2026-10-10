// Traduzioni dell'interfaccia. La lingua è scelta dall'utente (pagina opzioni);
// in assenza di scelta si usa quella del browser, con ripiego sull'inglese.
export const LANGS = { it: 'Italiano', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
export const DEFAULT_LANG = 'en';

const M = {
    it: {
        currency: 'Valuta', gold: 'Oro', refresh: 'Aggiorna', loading: 'Caricamento…',
        unreachable: 'Servizio non raggiungibile', netError: 'Errore di rete', updated: 'Agg. {time}',
        settings: 'Avvisi e impostazioni', settingsAria: 'Impostazioni', evmNetwork: 'Rete EVM',
        l2note: 'Costo stimato: solo gas L2, esclusa la fee dati L1.',
        'btc.fast': 'Veloce (~10 min)', 'btc.medium': 'Medio (~30 min)', 'btc.slow': 'Lento (~1 h)', 'btc.economy': 'Economy',
        'evm.slow': 'Lento', 'evm.standard': 'Standard', 'evm.fast': 'Veloce',
        'options.title': 'Crypto Fees - Impostazioni', 'options.heading': 'Avvisi fee',
        'options.intro': "Ricevi una notifica quando la fee scende al di sotto della soglia. Il controllo avviene ogni minuto; l'avviso si riarma quando la fee risale del 10% sopra soglia.",
        enabled: 'Attivo', network: 'Rete', threshold: 'Soglia', feeUsed: 'Fee considerata',
        alertAria: 'Avviso {name}', thresholdAria: 'Soglia {name}', invalid: 'Valore positivo richiesto', saved: 'Salvato ✓',
        language: 'Lingua',
        notifTitle: 'Fee {name} basse', notifMsg: '{value} {unit} (soglia {threshold} {unit})'
    },
    en: {
        currency: 'Currency', gold: 'Gold', refresh: 'Refresh', loading: 'Loading…',
        unreachable: 'Service unreachable', netError: 'Network error', updated: 'Updated {time}',
        settings: 'Alerts and settings', settingsAria: 'Settings', evmNetwork: 'EVM network',
        l2note: 'Estimated cost: L2 gas only, L1 data fee excluded.',
        'btc.fast': 'Fast (~10 min)', 'btc.medium': 'Medium (~30 min)', 'btc.slow': 'Slow (~1 h)', 'btc.economy': 'Economy',
        'evm.slow': 'Slow', 'evm.standard': 'Standard', 'evm.fast': 'Fast',
        'options.title': 'Crypto Fees - Settings', 'options.heading': 'Fee alerts',
        'options.intro': 'Get a notification when the fee drops below the threshold. The check runs every minute; the alert re-arms when the fee rises 10% above the threshold.',
        enabled: 'Enabled', network: 'Network', threshold: 'Threshold', feeUsed: 'Fee used',
        alertAria: '{name} alert', thresholdAria: '{name} threshold', invalid: 'A positive value is required', saved: 'Saved ✓',
        language: 'Language',
        notifTitle: 'Low {name} fees', notifMsg: '{value} {unit} (threshold {threshold} {unit})'
    },
    de: {
        currency: 'Währung', gold: 'Gold', refresh: 'Aktualisieren', loading: 'Wird geladen…',
        unreachable: 'Dienst nicht erreichbar', netError: 'Netzwerkfehler', updated: 'Akt. {time}',
        settings: 'Benachrichtigungen und Einstellungen', settingsAria: 'Einstellungen', evmNetwork: 'EVM-Netzwerk',
        l2note: 'Geschätzte Kosten: nur L2-Gas, ohne L1-Datengebühr.',
        'btc.fast': 'Schnell (~10 Min.)', 'btc.medium': 'Mittel (~30 Min.)', 'btc.slow': 'Langsam (~1 Std.)', 'btc.economy': 'Economy',
        'evm.slow': 'Langsam', 'evm.standard': 'Standard', 'evm.fast': 'Schnell',
        'options.title': 'Crypto Fees - Einstellungen', 'options.heading': 'Gebührenwarnungen',
        'options.intro': 'Du erhältst eine Benachrichtigung, wenn die Gebühr unter den Schwellenwert fällt. Die Prüfung läuft jede Minute; die Warnung wird neu aktiviert, wenn die Gebühr 10 % über den Schwellenwert steigt.',
        enabled: 'Aktiv', network: 'Netzwerk', threshold: 'Schwelle', feeUsed: 'Verwendete Gebühr',
        alertAria: 'Warnung {name}', thresholdAria: 'Schwelle {name}', invalid: 'Positiver Wert erforderlich', saved: 'Gespeichert ✓',
        language: 'Sprache',
        notifTitle: 'Niedrige {name}-Gebühren', notifMsg: '{value} {unit} (Schwelle {threshold} {unit})'
    },
    fr: {
        currency: 'Devise', gold: 'Or', refresh: 'Actualiser', loading: 'Chargement…',
        unreachable: 'Service injoignable', netError: 'Erreur réseau', updated: 'Maj {time}',
        settings: 'Alertes et paramètres', settingsAria: 'Paramètres', evmNetwork: 'Réseau EVM',
        l2note: 'Coût estimé : gaz L2 uniquement, hors frais de données L1.',
        'btc.fast': 'Rapide (~10 min)', 'btc.medium': 'Moyen (~30 min)', 'btc.slow': 'Lent (~1 h)', 'btc.economy': 'Économique',
        'evm.slow': 'Lent', 'evm.standard': 'Standard', 'evm.fast': 'Rapide',
        'options.title': 'Crypto Fees - Paramètres', 'options.heading': 'Alertes de frais',
        'options.intro': "Recevez une notification lorsque les frais passent sous le seuil. La vérification a lieu chaque minute ; l'alerte se réarme lorsque les frais remontent de 10 % au-dessus du seuil.",
        enabled: 'Actif', network: 'Réseau', threshold: 'Seuil', feeUsed: 'Frais pris en compte',
        alertAria: 'Alerte {name}', thresholdAria: 'Seuil {name}', invalid: 'Valeur positive requise', saved: 'Enregistré ✓',
        language: 'Langue',
        notifTitle: 'Frais {name} bas', notifMsg: '{value} {unit} (seuil {threshold} {unit})'
    },
    es: {
        currency: 'Moneda', gold: 'Oro', refresh: 'Actualizar', loading: 'Cargando…',
        unreachable: 'Servicio no disponible', netError: 'Error de red', updated: 'Act. {time}',
        settings: 'Alertas y ajustes', settingsAria: 'Ajustes', evmNetwork: 'Red EVM',
        l2note: 'Coste estimado: solo gas L2, sin la tarifa de datos L1.',
        'btc.fast': 'Rápida (~10 min)', 'btc.medium': 'Media (~30 min)', 'btc.slow': 'Lenta (~1 h)', 'btc.economy': 'Económica',
        'evm.slow': 'Lenta', 'evm.standard': 'Estándar', 'evm.fast': 'Rápida',
        'options.title': 'Crypto Fees - Ajustes', 'options.heading': 'Alertas de comisiones',
        'options.intro': 'Recibe una notificación cuando la comisión baje del umbral. La comprobación se hace cada minuto; la alerta se rearma cuando la comisión sube un 10 % por encima del umbral.',
        enabled: 'Activa', network: 'Red', threshold: 'Umbral', feeUsed: 'Comisión considerada',
        alertAria: 'Alerta {name}', thresholdAria: 'Umbral {name}', invalid: 'Se requiere un valor positivo', saved: 'Guardado ✓',
        language: 'Idioma',
        notifTitle: 'Comisiones de {name} bajas', notifMsg: '{value} {unit} (umbral {threshold} {unit})'
    }
};

let lang = DEFAULT_LANG;
export const currentLang = () => lang;

export async function loadLang() {
    let stored;
    try { stored = (await chrome.storage.local.get('lang')).lang; } catch { /* preferenza opzionale */ }
    const browser = (globalThis.navigator?.language || '').slice(0, 2).toLowerCase();
    lang = M[stored] ? stored : M[browser] ? browser : DEFAULT_LANG;
    return lang;
}

export async function setLang(code) {
    if (!M[code]) return;
    lang = code;
    try { await chrome.storage.local.set({ lang: code }); } catch { /* preferenza opzionale */ }
}

export function t(key, vars = {}) {
    const s = M[lang][key] ?? M[DEFAULT_LANG][key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Traduce gli elementi marcati data-i18n / data-i18n-title / data-i18n-aria
export function applyI18n(root = document) {
    document.documentElement.lang = lang;
    for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
    for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
}
