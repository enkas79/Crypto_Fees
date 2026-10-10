import {
    CACHE_TTL_MS, CURRENCIES, CHAINS, BTC_THRESHOLDS,
    readCache, writeCache, refreshAll, btcCost, evmCost,
    getCurrency, setCurrency, getChain, setChain
} from './fees.js';

let currency = 'usd';
let chain = 'ethereum';

const makeFormatters = () => {
    const base = { style: 'currency', currency: currency.toUpperCase() };
    const money = new Intl.NumberFormat(undefined, base);
    // Importi minuscoli (fee EVM): più decimali per non mostrare "0,00"
    const small = new Intl.NumberFormat(undefined, { ...base, minimumFractionDigits: 4, maximumFractionDigits: 4 });
    return { money, formatCost: v => (v < 0.01 ? small : money).format(v) };
};
let { money, formatCost } = makeFormatters();

const formatBtc = v => (v < 10 ? v.toFixed(1) : v.toFixed(0));
const formatGwei = v => (v < 0.1 ? v.toFixed(4) : v < 10 ? v.toFixed(2) : v.toFixed(1));

function render(el, fees, thresholds, format, price, costFn) {
    el.replaceChildren();
    for (const { label, value } of fees) {
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = format(value);
        dd.className = value < thresholds[0] ? 'low' : value < thresholds[1] ? 'mid' : 'high';
        const cost = document.createElement('dd');
        cost.className = 'cost';
        cost.textContent = price ? `≈ ${formatCost(costFn(value, price))}` : '';
        el.append(dt, dd, cost);
    }
}

function renderPrice(el, asset) {
    el.replaceChildren();
    if (!asset) return;
    el.append(money.format(asset.price));
    if (asset.change !== null) {
        const span = document.createElement('span');
        span.className = asset.change >= 0 ? 'up' : 'down';
        span.textContent = `${asset.change >= 0 ? '▲' : '▼'} ${Math.abs(asset.change).toFixed(1)}% (24h)`;
        el.append(' ', span);
    }
}

function renderMessage(el, text, isError = false) {
    el.replaceChildren();
    const p = document.createElement('div');
    p.className = isError ? 'msg err' : 'msg';
    p.textContent = text;
    el.append(p);
}

document.addEventListener('DOMContentLoaded', async () => {
    const $ = id => document.getElementById(id);
    const btcEl = $('btc-fees');
    const evmEl = $('eth-fees');
    const updatedEl = $('updated');
    const refreshBtn = $('refresh');
    const currencySel = $('currency');
    const chainSel = $('chain');

    [currency, chain] = await Promise.all([getCurrency(), getChain()]);
    ({ money, formatCost } = makeFormatters());
    for (const c of CURRENCIES) currencySel.add(new Option(c.toUpperCase(), c));
    for (const [id, { name }] of Object.entries(CHAINS)) chainSel.add(new Option(name, id));
    currencySel.value = currency;
    chainSel.value = chain;

    function paint(c) {
        const p = c.prices?.currency === currency ? c.prices : undefined;
        const cfg = CHAINS[chain];
        const native = p?.[cfg.native];
        renderPrice($('btc-price'), p?.btc);
        renderPrice($('eth-price'), native);
        renderPrice($('gold-price'), p?.gold);
        $('l2-note').hidden = !cfg.l2;
        if (c.btc) render(btcEl, c.btc, BTC_THRESHOLDS, formatBtc, p?.btc.price, btcCost);
        if (c.evm?.[chain]) render(evmEl, c.evm[chain], cfg.thresholds, formatGwei, native?.price, evmCost);
        else renderMessage(evmEl, 'Caricamento…');
        if (c.ts) updatedEl.textContent = `Agg. ${new Date(c.ts).toLocaleTimeString()}`;
    }

    async function load(force) {
        const cached = (await readCache()) || {};
        paint(cached);
        const fresh = cached.ts && Date.now() - cached.ts < CACHE_TTL_MS &&
            cached.prices?.currency === currency && cached.evm?.[chain];
        if (!force && fresh) return;

        if (!cached.btc) renderMessage(btcEl, 'Caricamento…');
        refreshBtn.disabled = true;

        const { next, ok, failed } = await refreshAll(cached, currency, [chain]);
        if (ok) {
            await writeCache(next);
            paint(next);
        } else {
            updatedEl.textContent = 'Errore di rete';
        }
        if (failed.btc && !next.btc) renderMessage(btcEl, 'Servizio non raggiungibile', true);
        if (failed.evm[chain] && !next.evm?.[chain]) renderMessage(evmEl, 'Servizio non raggiungibile', true);
        refreshBtn.disabled = false;
    }

    currencySel.addEventListener('change', async () => {
        currency = currencySel.value;
        ({ money, formatCost } = makeFormatters());
        await setCurrency(currency);
        load(true);
    });
    chainSel.addEventListener('change', async () => {
        chain = chainSel.value;
        await setChain(chain);
        load(false);
    });
    $('options').addEventListener('click', () => chrome.runtime.openOptionsPage());
    refreshBtn.addEventListener('click', () => load(true));
    load(false);
});
