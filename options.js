import { CHAINS, getAlerts, setAlerts } from './fees.js';
import { LANGS, loadLang, setLang, applyI18n, t, currentLang } from './i18n.js';

const ROWS = [
    ['btc', 'Bitcoin', 'sat/vB', 'btc.fast'],
    ...Object.entries(CHAINS).map(([id, c]) => [id, c.name, 'Gwei', 'evm.standard'])
];

document.addEventListener('DOMContentLoaded', async () => {
    await loadLang();
    const alerts = await getAlerts();
    const rows = document.getElementById('rows');
    const status = document.getElementById('status');
    let timer;

    function saved() {
        status.textContent = t('saved');
        clearTimeout(timer);
        timer = setTimeout(() => { status.textContent = ''; }, 1500);
    }

    const langSel = document.getElementById('lang');
    for (const [code, name] of Object.entries(LANGS)) langSel.add(new Option(name, code));
    const rowEls = [];
    const translate = () => {
        applyI18n();
        document.title = t('options.title');
        langSel.value = currentLang();
        for (const fn of rowEls) fn();
    };
    langSel.addEventListener('change', async () => { await setLang(langSel.value); translate(); });

    for (const [key, name, unit, fee] of ROWS) {
        const tr = document.createElement('tr');
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = alerts[key].enabled;
        rowEls.push(() => check.setAttribute('aria-label', t('alertAria', { name })));
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = 'any';
        input.value = alerts[key].threshold;
        rowEls.push(() => input.setAttribute('aria-label', t('thresholdAria', { name })));

        const save = async () => {
            const threshold = Number(input.value);
            if (!(threshold > 0)) { input.setCustomValidity(t('invalid')); input.reportValidity(); return; }
            input.setCustomValidity('');
            alerts[key] = { enabled: check.checked, threshold };
            await setAlerts(alerts);
            saved();
        };
        check.addEventListener('change', save);
        input.addEventListener('change', save);

        const feeText = document.createTextNode('');
        rowEls.push(() => { feeText.nodeValue = t(fee); });
        const cells = [check, name, input, feeText].map(content => {
            const td = document.createElement('td');
            td.append(content);
            return td;
        });
        const u = document.createElement('span');
        u.className = 'unit';
        u.textContent = unit;
        cells[2].append(u);
        cells[3].className = 'fee';
        tr.append(...cells);
        rows.append(tr);
    }

    translate();
});
