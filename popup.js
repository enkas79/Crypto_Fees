import {
    CACHE_TTL_MS, CURRENCIES, CHAINS, BTC_THRESHOLDS,
    readCache, writeCache, refreshAll, btcCost, evmCost,
    getCurrency, setCurrency, getChain, setChain
} from './fees.js';
import { loadLang, applyI18n, t, currentLang } from './i18n.js';

let currency = 'usd';
let chain = 'ethereum';

const makeFormatters = () => {
    const base = { style: 'currency', currency: currency.toUpperCase() };
    const locale = currentLang();
    const money = new Intl.NumberFormat(locale, base);
    // Importi minuscoli (fee EVM): più decimali per non mostrare "0,00"
    const small = new Intl.NumberFormat(locale, { ...base, minimumFractionDigits: 4, maximumFractionDigits: 4 });
    return { money, formatCost: v => (v < 0.01 ? small : money).format(v) };
};
let { money, formatCost } = makeFormatters();

const formatBtc = v => (v < 10 ? v.toFixed(1) : v.toFixed(0));
const formatGwei = v => (v < 0.1 ? v.toFixed(4) : v < 10 ? v.toFixed(2) : v.toFixed(1));

function render(el, fees, thresholds, format, price, costFn, scope) {
    el.replaceChildren();
    for (const { key, label, value } of fees) {
        const dt = document.createElement('dt');
        dt.textContent = key ? t(`${scope}.${key}`) : label; // `label`: cache di versioni precedenti
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

    [currency, chain] = await Promise.all([getCurrency(), getChain(), loadLang()]);
    applyI18n();
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
        if (c.btc) render(btcEl, c.btc, BTC_THRESHOLDS, formatBtc, p?.btc.price, btcCost, 'btc');
        if (c.evm?.[chain]) render(evmEl, c.evm[chain], cfg.thresholds, formatGwei, native?.price, evmCost, 'evm');
        else renderMessage(evmEl, t('loading'));
        if (c.ts) updatedEl.textContent = t('updated', { time: new Date(c.ts).toLocaleTimeString(currentLang()) });
    }

    async function load(force) {
        const cached = (await readCache()) || {};
        paint(cached);
        const fresh = cached.ts && Date.now() - cached.ts < CACHE_TTL_MS &&
            cached.prices?.currency === currency && cached.evm?.[chain];
        if (!force && fresh) return;

        if (!cached.btc) renderMessage(btcEl, t('loading'));
        refreshBtn.disabled = true;

        const { next, ok, failed } = await refreshAll(cached, currency, [chain]);
        if (ok) {
            await writeCache(next);
            paint(next);
        } else {
            updatedEl.textContent = t('netError');
        }
        if (failed.btc && !next.btc) renderMessage(btcEl, t('unreachable'), true);
        if (failed.evm[chain] && !next.evm?.[chain]) renderMessage(evmEl, t('unreachable'), true);
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
    $('options').addEventListener('click', async () => {
        try {
            await chrome.runtime.openOptionsPage(); // riusa la scheda se già aperta
        } catch {
            await chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        }
        window.close();
    });
    refreshBtn.addEventListener('click', () => load(true));
    load(false);
});
