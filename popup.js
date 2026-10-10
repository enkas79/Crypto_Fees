import {
    CACHE_TTL_MS, CURRENCY, BTC_THRESHOLDS, ETH_THRESHOLDS,
    readCache, writeCache, refreshAll, btcCost, ethCost
} from './fees.js';

const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY.toUpperCase() });

function render(el, fees, thresholds, decimals, price, costFn) {
    el.replaceChildren();
    for (const { label, value } of fees) {
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value.toFixed(decimals);
        dd.className = value < thresholds[0] ? 'low' : value < thresholds[1] ? 'mid' : 'high';
        const cost = document.createElement('dd');
        cost.className = 'cost';
        cost.textContent = price ? `≈ ${money.format(costFn(value, price))}` : '';
        el.append(dt, dd, cost);
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
