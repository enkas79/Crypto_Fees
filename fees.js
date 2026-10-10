export const TIMEOUT_MS = 5000;
export const CACHE_TTL_MS = 30000;
export const CURRENCY = 'eur';
export const BTC_TX_VBYTES = 141; // tx P2WPKH 1 input / 2 output
export const ETH_TRANSFER_GAS = 21000;
export const BTC_THRESHOLDS = [5, 20];
export const ETH_THRESHOLDS = [5, 30];

const ETH_RPCS = ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'];
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

const toGwei = hex => Number(BigInt(hex)) / 1e9;

export async function getBtcFees() {
    const data = await fetchJson('https://mempool.space/api/v1/fees/recommended');
    return BTC_LEVELS.map(([key, label]) => {
        const value = Number(data[key]);
        if (!Number.isFinite(value)) throw new Error('Dati BTC non validi');
        return { label, value };
    });
}

export async function getEthFees() {
    let lastError;
    for (const url of ETH_RPCS) {
        try {
            // Ultimi 5 blocchi: base fee + mancia al 10°/50°/90° percentile
            const history = await rpc(url, 'eth_feeHistory', ['0x5', 'latest', [10, 50, 90]]);
            const base = toGwei(history.baseFeePerGas[history.baseFeePerGas.length - 1]);
            const tips = [0, 1, 2].map(i =>
                history.reward.reduce((sum, r) => sum + toGwei(r[i]), 0) / history.reward.length);
            const fees = [
                { label: 'Lento', value: base + tips[0] },
                { label: 'Standard', value: base + tips[1] },
                { label: 'Veloce', value: base + tips[2] }
            ];
            if (fees.some(f => !Number.isFinite(f.value))) throw new Error('Dati ETH non validi');
            return fees;
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

export async function getPrices() {
    const data = await fetchJson(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=${CURRENCY}&include_24hr_change=true`);
    const btc = Number(data.bitcoin?.[CURRENCY]);
    const eth = Number(data.ethereum?.[CURRENCY]);
    if (!Number.isFinite(btc) || !Number.isFinite(eth)) throw new Error('Prezzi non validi');
    const chg = id => {
        const v = Number(data[id]?.[`${CURRENCY}_24h_change`]);
        return Number.isFinite(v) ? v : null;
    };
    return { btc, eth, btcChange: chg('bitcoin'), ethChange: chg('ethereum') };
}

// Costo in valuta di una transazione tipica
export const btcCost = (satPerVb, price) => satPerVb * BTC_TX_VBYTES * 1e-8 * price;
export const ethCost = (gwei, price) => gwei * ETH_TRANSFER_GAS * 1e-9 * price;

export async function readCache() {
    try {
        return (await chrome.storage.local.get('cache')).cache;
    } catch {
        return undefined;
    }
}

export async function writeCache(cache) {
    try {
        await chrome.storage.local.set({ cache });
    } catch { /* cache opzionale */ }
}

// Scarica tutto in parallelo; un servizio che fallisce non blocca gli altri.
export async function refreshAll(previous = {}) {
    const [btc, eth, prices] = await Promise.allSettled([getBtcFees(), getEthFees(), getPrices()]);
    const next = { ...previous };
    if (btc.status === 'fulfilled') next.btc = btc.value;
    if (eth.status === 'fulfilled') next.eth = eth.value;
    if (prices.status === 'fulfilled') next.prices = prices.value;
    const ok = [btc, eth, prices].some(r => r.status === 'fulfilled');
    if (ok) next.ts = Date.now();
    return { next, ok, failed: { btc: btc.status === 'rejected', eth: eth.status === 'rejected' } };
}
