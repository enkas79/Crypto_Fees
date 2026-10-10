import {
    CHAINS, BTC_THRESHOLDS, refreshAll, readCache, writeCache,
    getCurrency, getChain, getAlerts, getSetting, setSetting
} from './fees.js';

const ALARM = 'refresh-fees';
const HYSTERESIS = 1.1; // l'avviso si riarma solo quando la fee risale del 10% sopra soglia

function currentValue(cache, key) {
    return key === 'btc' ? cache.btc?.[0]?.value : cache.evm?.[key]?.[1]?.value;
}

const fmt = v => (v < 10 ? Number(v.toPrecision(2)) : Math.round(v)).toString();

async function checkAlerts(cache, alerts) {
    const state = await getSetting('alertState', {});
    for (const [key, { enabled, threshold }] of Object.entries(alerts)) {
        const value = currentValue(cache, key);
        if (!enabled || value === undefined) {
            if (!enabled) delete state[key];
            continue;
        }
        if (value <= threshold && !state[key]) {
            state[key] = true;
            const name = key === 'btc' ? 'Bitcoin' : CHAINS[key].name;
            const unit = key === 'btc' ? 'sat/vB' : 'Gwei';
            chrome.notifications.create(`fee-${key}`, {
                type: 'basic',
                iconUrl: 'images/icon128.png',
                title: `Fee ${name} basse`,
                message: `${fmt(value)} ${unit} (soglia ${fmt(threshold)} ${unit})`
            });
        } else if (value > threshold * HYSTERESIS) {
            state[key] = false;
        }
    }
    await setSetting('alertState', state);
}

async function update() {
    const [currency, alerts, chain] = await Promise.all([getCurrency(), getAlerts(), getChain()]);
    const chains = new Set([chain]);
    for (const [key, a] of Object.entries(alerts)) if (a.enabled && CHAINS[key]) chains.add(key);

    const { next, ok } = await refreshAll((await readCache()) || {}, currency, [...chains]);
    if (!ok) return;
    await writeCache(next);

    const fast = next.btc?.[0]?.value;
    if (fast !== undefined) {
        const color = fast < BTC_THRESHOLDS[0] ? '#2e9e4f' : fast < BTC_THRESHOLDS[1] ? '#c98a00' : '#d33';
        await chrome.action.setBadgeBackgroundColor({ color });
        await chrome.action.setBadgeText({ text: fast < 10 ? fast.toFixed(1).replace(/\.0$/, '') : String(Math.round(fast)) });
    }
    await checkAlerts(next, alerts);
}

function schedule() {
    chrome.alarms.create(ALARM, { periodInMinutes: 1 });
    update();
}

chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);
chrome.alarms.onAlarm.addListener(a => { if (a.name === ALARM) update(); });
// Applica subito le modifiche dalla pagina opzioni (nuove soglie, valuta, rete)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.alerts || changes.currency)) update();
});
