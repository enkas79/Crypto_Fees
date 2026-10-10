import { CHAINS, getAlerts, setAlerts } from './fees.js';

const ROWS = [
    ['btc', 'Bitcoin', 'sat/vB', 'Veloce (~10 min)'],
    ...Object.entries(CHAINS).map(([id, c]) => [id, c.name, 'Gwei', 'Standard'])
];

document.addEventListener('DOMContentLoaded', async () => {
    const alerts = await getAlerts();
    const rows = document.getElementById('rows');
    const status = document.getElementById('status');
    let timer;

    function saved() {
        status.textContent = 'Salvato ✓';
        clearTimeout(timer);
        timer = setTimeout(() => { status.textContent = ''; }, 1500);
    }

    for (const [key, name, unit, fee] of ROWS) {
        const tr = document.createElement('tr');
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = alerts[key].enabled;
        check.setAttribute('aria-label', `Avviso ${name}`);
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = 'any';
        input.value = alerts[key].threshold;
        input.setAttribute('aria-label', `Soglia ${name}`);

        const save = async () => {
            const threshold = Number(input.value);
            if (!(threshold > 0)) { input.setCustomValidity('Valore positivo richiesto'); input.reportValidity(); return; }
            input.setCustomValidity('');
            alerts[key] = { enabled: check.checked, threshold };
            await setAlerts(alerts);
            saved();
        };
        check.addEventListener('change', save);
        input.addEventListener('change', save);

        const cells = [check, name, input, `${fee}`].map(content => {
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
});
