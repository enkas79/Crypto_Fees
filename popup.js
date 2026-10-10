import {
    CACHE_TTL_MS, CURRENCIES, BTC_THRESHOLDS, ETH_THRESHOLDS,
    readCache, writeCache, refreshAll, btcCost, ethCost, getCurrency, setCurrency
} from './fees.js';

let currency = 'usd';
const makeFormatters = () => {
    const base = { style: 'currency', currency: currency.toUpperCase() };
    const money = new Intl.NumberFormat(undefined, base);
    // Importi minuscoli (fee ETH): più decimali per non mostrare "0,00"
    const small = new Intl.NumberFormat(undefined, { ...base, minimumFractionDigits: 4, maximumFractionDigits: 4 });
    return { money, formatCost: v => (v < 0.01 ? small : money).format(v) };
};
let { money, formatCost } = makeFormatters();

const formatFee = (v, decimals) => (decimals === 0 && v < 10 ? v.toFixed(1) : v.toFixed(decimals));

function render(el, fees, thresholds, decimals, price, costFn) {
    el.replaceChildren();
    for (const { label, value } of fees) {
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = formatFee(value, decimals);
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
    const ethEl = $('eth-fees');
    const updatedEl = $('updated');
    const refreshBtn = $('refresh');
    const select = $('currency');

    currency = await getCurrency();
    ({ money, formatCost } = makeFormatters());
    for (const c of CURRENCIES) select.add(new Option(c.toUpperCase(), c));
    select.value = currency;

    function paint(c) {
        const p = c.prices?.currency === currency ? c.prices : undefined;
        renderPrice($('btc-price'), p?.btc);
        renderPrice($('eth-price'), p?.eth);
        renderPrice($('gold-price'), p?.gold);
        if (c.btc) render(btcEl, c.btc, BTC_THRESHOLDS, 0, p?.btc.price, btcCost);
        if (c.eth) render(ethEl, c.eth, ETH_THRESHOLDS, 2, p?.eth.price, ethCost);
        if (c.ts) updatedEl.textContent = `Agg. ${new Date(c.ts).toLocaleTimeString()}`;
    }

    async function load(force) {
        const cached = (await readCache()) || {};
        paint(cached);
        const fresh = cached.ts && Date.now() - cached.ts < CACHE_TTL_MS && cached.prices?.currency === currency;
        if (!force && fresh) return;

        if (!cached.btc) renderMessage(btcEl, 'Caricamento…');
        if (!cached.eth) renderMessage(ethEl, 'Caricamento…');
        refreshBtn.disabled = true;

        const { next, ok, failed } = await refreshAll(cached, currency);
        if (ok) {
            await writeCache(next);
            paint(next);
        } else {
            updatedEl.textContent = 'Errore di rete';
        }
        if (failed.btc && !next.btc) renderMessage(btcEl, 'Servizio non raggiungibile', true);
        if (failed.eth && !next.eth) renderMessage(ethEl, 'Servizio non raggiungibile', true);
        refreshBtn.disabled = false;
    }

    select.addEventListener('change', async () => {
        currency = select.value;
        ({ money, formatCost } = makeFormatters());
        await setCurrency(currency);
        load(true);
    });
    refreshBtn.addEventListener('click', () => load(true));
    load(false);
});
