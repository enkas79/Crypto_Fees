import { refreshAll, readCache, writeCache, getCurrency, BTC_THRESHOLDS } from './fees.js';

const ALARM = 'refresh-fees';

async function update() {
    const { next, ok } = await refreshAll((await readCache()) || {}, await getCurrency());
    if (!ok) return;
    await writeCache(next);
    const fast = next.btc?.[0]?.value;
    if (fast === undefined) return;
    const color = fast < BTC_THRESHOLDS[0] ? '#2e9e4f' : fast < BTC_THRESHOLDS[1] ? '#c98a00' : '#d33';
    await chrome.action.setBadgeBackgroundColor({ color });
    await chrome.action.setBadgeText({ text: String(Math.round(fast)) });
}

function schedule() {
    chrome.alarms.create(ALARM, { periodInMinutes: 1 });
    update();
}

chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);
chrome.alarms.onAlarm.addListener(a => { if (a.name === ALARM) update(); });
