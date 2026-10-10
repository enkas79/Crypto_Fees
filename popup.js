import {
    CACHE_TTL_MS, CURRENCY, BTC_THRESHOLDS, ETH_THRESHOLDS,
    readCache, writeCache, refreshAll, btcCost, ethCost
} from './fees.js';

const currency = CURRENCY.toUpperCase();
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
// Importi minuscoli (fee ETH): più decimali per non mostrare "0,00 €"
const smallMoney = new Intl.NumberFormat(undefined, {
    style: 'currency', currency, minimumFractionDigits: 4, maximumFractionDigits: 4
});
const formatCost = v => (v < 0.01 ? smallMoney : money).format(v);
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

function renderPrice(el, price, change) {
    el.replaceChildren();
    if (!price) return;
    el.append(money.format(price));
    if (change !== null && change !== undefined) {
        const span = document.createElement('span');
        span.className = change >= 0 ? 'up' : 'down';
        span.textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}% (24h)`;
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

document.addEventListener('DOMContentLoaded', () => {
    const btcEl = document.getElementById('btc-fees');
    const ethEl = document.getElementById('eth-fees');
    const updatedEl = document.getElementById('updated');
    const refreshBtn = document.getElementById('refresh');

    function paint(c) {
        renderPrice(document.getElementById('btc-price'), c.prices?.btc, c.prices?.btcChange);
        renderPrice(document.getElementById('eth-price'), c.prices?.eth, c.prices?.ethChange);
        if (c.btc) render(btcEl, c.btc, BTC_THRESHOLDS, 0, c.prices?.btc, btcCost);
        if (c.eth) render(ethEl, c.eth, ETH_THRESHOLDS, 2, c.prices?.eth, ethCost);
        if (c.ts) updatedEl.textContent = `Agg. ${new Date(c.ts).toLocaleTimeString()}`;
    }

    async function load(force) {
        const cached = (await readCache()) || {};
        paint(cached);
        if (!force && cached.ts && Date.now() - cached.ts < CACHE_TTL_MS) return;

        if (!cached.btc) renderMessage(btcEl, 'Caricamento…');
        if (!cached.eth) renderMessage(ethEl, 'Caricamento…');
        refreshBtn.disabled = true;

        const { next, ok, failed } = await refreshAll(cached);
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

    refreshBtn.addEventListener('click', () => load(true));
    load(false);
});
