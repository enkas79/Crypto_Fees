export const TIMEOUT_MS = 5000;
export const CACHE_TTL_MS = 30000;
export const CURRENCIES = ['usd', 'eur', 'gbp', 'chf', 'jpy'];
export const DEFAULT_CURRENCY = 'usd';
export const BTC_TX_VBYTES = 141; // tx P2WPKH 1 input / 2 output
export const EVM_TRANSFER_GAS = 21000;
export const BTC_THRESHOLDS = [5, 20];

// native: chiave in prices (eth | pol) usata per il costo; l2: il costo esclude la fee dati L1
export const CHAINS = {
    ethereum: {
        name: 'Ethereum', native: 'eth', l2: false, thresholds: [5, 30],
        rpcs: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com']
    },
    base: {
        name: 'Base', native: 'eth', l2: true, thresholds: [0.01, 0.1],
        rpcs: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com']
    },
    arbitrum: {
        name: 'Arbitrum', native: 'eth', l2: true, thresholds: [0.05, 0.3],
        rpcs: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com']
    },
    optimism: {
        name: 'Optimism', native: 'eth', l2: true, thresholds: [0.01, 0.1],
        rpcs: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com']
    },
    polygon: {
        name: 'Polygon', native: 'pol', l2: false, thresholds: [30, 100],
        rpcs: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon-rpc.com']
    }
};
export const DEFAULT_CHAIN = 'ethereum';

// Soglie di default per gli avvisi (disattivati finché l'utente non li abilita)
export const DEFAULT_ALERTS = {
    btc: { enabled: false, threshold: 3 },
    ethereum: { enabled: false, threshold: 1 },
    base: { enabled: false, threshold: 0.01 },
    arbitrum: { enabled: false, threshold: 0.05 },
    optimism: { enabled: false, threshold: 0.01 },
    polygon: { enabled: false, threshold: 30 }
};

const BTC_LEVELS = [
    ['fastestFee', 'Veloce (~10 min)'],
    ['halfHourFee', 'Medio (~30 min)'],
    ['hourFee', 'Lento (~1 h)'],
    ['economyFee', 'Economy']
];

async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

async function rpc(url, method, params) {
    const json = await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    if (json.error) throw new Error(json.error.message);
    return json.result;
}

const toGwei = hex => Number(BigInt(hex ?? '0x0')) / 1e9;

export async function getBtcFees() {
    const data = await fetchJson('https://mempool.space/api/v1/fees/recommended');
    return BTC_LEVELS.map(([key, label]) => {
        const value = Number(data[key]);
        if (!Number.isFinite(value)) throw new Error('Dati BTC non validi');
        return { label, value };
    });
}

export async function getEvmFees(chainId) {
    let lastError;
    for (const url of CHAINS[chainId].rpcs) {
        try {
            // Ultimi 5 blocchi: base fee + mancia al 10°/50°/90° percentile
            const history = await rpc(url, 'eth_feeHistory', ['0x5', 'latest', [10, 50, 90]]);
            const base = toGwei(history.baseFeePerGas[history.baseFeePerGas.length - 1]);
            const rewards = history.reward ?? [];
            const tips = [0, 1, 2].map(i =>
                rewards.length ? rewards.reduce((sum, r) => sum + toGwei(r?.[i]), 0) / rewards.length : 0);
            const fees = [
                { label: 'Lento', value: base + tips[0] },
                { label: 'Standard', value: base + tips[1] },
                { label: 'Veloce', value: base + tips[2] }
            ];
            if (fees.some(f => !Number.isFinite(f.value))) throw new Error('Dati EVM non validi');
            return fees;
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

// Oro: PAXG è un token ancorato a 1 oncia troy d'oro fisico (proxy dello spot XAU)
export async function getPrices(currency) {
    const data = await fetchJson(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,pax-gold,polygon-ecosystem-token' +
        `&vs_currencies=${currency}&include_24hr_change=true`);
    const read = (id, optional = false) => {
        const price = Number(data[id]?.[currency]);
        if (!Number.isFinite(price)) {
            if (optional) return null;
            throw new Error('Prezzi non validi');
        }
        const change = Number(data[id]?.[`${currency}_24h_change`]);
        return { price, change: Number.isFinite(change) ? change : null };
    };
    return {
        currency,
        btc: read('bitcoin'),
        eth: read('ethereum'),
        gold: read('pax-gold'),
        pol: read('polygon-ecosystem-token', true)
    };
}

// Costo in valuta di una transazione tipica
export const btcCost = (satPerVb, price) => satPerVb * BTC_TX_VBYTES * 1e-8 * price;
export const evmCost = (gwei, price) => gwei * EVM_TRANSFER_GAS * 1e-9 * price;

export async function getSetting(key, fallback) {
    try {
        const stored = (await chrome.storage.local.get(key))[key];
        return stored ?? fallback;
    } catch {
        return fallback;
    }
}

export async function setSetting(key, value) {
    try {
        await chrome.storage.local.set({ [key]: value });
    } catch { /* preferenza opzionale */ }
}

export async function getCurrency() {
    const c = await getSetting('currency', DEFAULT_CURRENCY);
    return CURRENCIES.includes(c) ? c : DEFAULT_CURRENCY;
}
export const setCurrency = c => setSetting('currency', c);

export async function getChain() {
    const c = await getSetting('chain', DEFAULT_CHAIN);
    return CHAINS[c] ? c : DEFAULT_CHAIN;
}
export const setChain = c => setSetting('chain', c);

export async function getAlerts() {
    const stored = await getSetting('alerts', {});
    const alerts = {};
    for (const [key, def] of Object.entries(DEFAULT_ALERTS)) {
        const s = stored[key] ?? {};
        alerts[key] = {
            enabled: Boolean(s.enabled),
            threshold: Number.isFinite(Number(s.threshold)) && Number(s.threshold) > 0 ? Number(s.threshold) : def.threshold
        };
    }
    return alerts;
}
export const setAlerts = a => setSetting('alerts', a);

export const readCache = () => getSetting('cache', undefined);
export const writeCache = cache => setSetting('cache', cache);

// Scarica tutto in parallelo; un servizio che fallisce non blocca gli altri.
export async function refreshAll(previous = {}, currency = DEFAULT_CURRENCY, chains = [DEFAULT_CHAIN]) {
    const ids = [...new Set(chains)].filter(id => CHAINS[id]);
    const [btc, prices, ...evm] = await Promise.allSettled([
        getBtcFees(), getPrices(currency), ...ids.map(getEvmFees)
    ]);
    const next = { ...previous, evm: { ...previous.evm } };
    // Prezzi in un'altra valuta non sono più validi
    if (next.prices && next.prices.currency !== currency) delete next.prices;
    if (btc.status === 'fulfilled') next.btc = btc.value;
    if (prices.status === 'fulfilled') next.prices = prices.value;
    const failedEvm = {};
    evm.forEach((r, i) => {
        if (r.status === 'fulfilled') next.evm[ids[i]] = r.value;
        else failedEvm[ids[i]] = true;
    });
    const ok = [btc, prices, ...evm].some(r => r.status === 'fulfilled');
    if (ok) next.ts = Date.now();
    return { next, ok, failed: { btc: btc.status === 'rejected', evm: failedEvm } };
}
