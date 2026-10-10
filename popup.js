const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 30000;
const ETH_RPCS = ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'];

const BTC_LEVELS = [
    ['fastestFee', 'Veloce (~10 min)'],
    ['halfHourFee', 'Medio (~30 min)'],
    ['hourFee', 'Lento (~1 h)'],
    ['economyFee', 'Economy']
];
// Soglie (low/mid) per la colorazione
const BTC_THRESHOLDS = [5, 20];
const ETH_THRESHOLDS = [5, 30];

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

async function getBtcFees() {
    const data = await fetchJson('https://mempool.space/api/v1/fees/recommended');
    return BTC_LEVELS.map(([key, label]) => {
        const value = Number(data[key]);
        if (!Number.isFinite(value)) throw new Error('Dati BTC non validi');
        return { label, value };
    });
}

async function getEthFees() {
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

function render(el, fees, thresholds, decimals) {
    el.replaceChildren();
    for (const { label, value } of fees) {
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value.toFixed(decimals);
        dd.className = value < thresholds[0] ? 'low' : value < thresholds[1] ? 'mid' : 'high';
        el.append(dt, dd);
    }
}

function renderMessage(el, text, isError = false) {
    el.replaceChildren();
    const p = document.createElement('div');
    p.className = isError ? 'msg err' : 'msg';
    p.textContent = text;
    el.append(p);
}

async function readCache() {
    try {
        const { cache } = await chrome.storage.local.get('cache');
        return cache;
    } catch {
        return undefined;
    }
}

function writeCache(cache) {
    chrome.storage.local.set({ cache }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', async () => {
    const btcEl = document.getElementById('btc-fees');
    const ethEl = document.getElementById('eth-fees');
    const updatedEl = document.getElementById('updated');
    const refreshBtn = document.getElementById('refresh');

    const showUpdated = ts => {
        updatedEl.textContent = `Agg. ${new Date(ts).toLocaleTimeString()}`;
    };

    function paint(cache) {
        if (cache.btc) render(btcEl, cache.btc, BTC_THRESHOLDS, 0);
        if (cache.eth) render(ethEl, cache.eth, ETH_THRESHOLDS, 2);
        if (cache.ts) showUpdated(cache.ts);
    }

    async function load(force) {
        const cached = (await readCache()) || {};
        if (cached.btc || cached.eth) paint(cached);
        if (!force && cached.ts && Date.now() - cached.ts < CACHE_TTL_MS) return;

        if (!cached.btc) renderMessage(btcEl, 'Caricamento…');
        if (!cached.eth) renderMessage(ethEl, 'Caricamento…');
        refreshBtn.disabled = true;

        const [btc, eth] = await Promise.allSettled([getBtcFees(), getEthFees()]);
        const next = { ...cached };
        if (btc.status === 'fulfilled') { next.btc = btc.value; render(btcEl, btc.value, BTC_THRESHOLDS, 0); }
        else if (!cached.btc) renderMessage(btcEl, 'Servizio non raggiungibile', true);
        if (eth.status === 'fulfilled') { next.eth = eth.value; render(ethEl, eth.value, ETH_THRESHOLDS, 2); }
        else if (!cached.eth) renderMessage(ethEl, 'Servizio non raggiungibile', true);

        if (btc.status === 'fulfilled' || eth.status === 'fulfilled') {
            next.ts = Date.now();
            showUpdated(next.ts);
            writeCache(next);
        } else {
            updatedEl.textContent = 'Errore di rete';
        }
        refreshBtn.disabled = false;
    }

    refreshBtn.addEventListener('click', () => load(true));
    load(false);
});
