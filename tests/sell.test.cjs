const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function calculator(min, max, lang = 'es') {
  const elements = new Map();
  function element(id, dataset = {}) {
    const el = { dataset, textContent: '', innerHTML: '', classList: { toggle() {} },
      events: {}, addEventListener(name, fn) { this.events[name] = fn; } };
    elements.set(id, el);
    return el;
  }
  ['app', 'weight', 'purity-note', 'payout-min', 'payout-max', 'pure-grams', 'spot-value', 'rate', 'quote-cta'].forEach(id => element(id));
  const groups = {
    '#karat-row .karat-btn': [10, 14, 18, 22, 24].map(k => element('k' + k, { k })),
    '#form-row button': ['solid', 'semi-solid'].map(f => element(f, { f })),
    '#cond-row button': ['new', 'old'].map(c => element(c, { c }))
  };
  const context = vm.createContext({ window: {}, document: {
    getElementById: id => elements.get(id), querySelector: () => null,
    querySelectorAll: selector => groups[selector] || []
  }, localStorage: { getItem: () => null, setItem() {} } });
  vm.runInContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), context);
  if (min != null) Object.assign(context.window.DKY_CONFIG, { BUYBACK_MIN_PCT: min, BUYBACK_MAX_PCT: max });
  context.window.DKYI18n = { getLang: () => lang, t: key => key };
  context.window.DKYSpot = { getSpotPrice: () => 100, getStatusLabel: () => 'Gold', onSpot: () => () => {} };
  vm.runInContext(fs.readFileSync(path.join(root, 'js/pages/sell.js'), 'utf8'), context);
  context.window.DKYSell.render();
  return { elements, config: context.window.DKY_CONFIG, click: id => elements.get(id).events.click(),
    weight: value => elements.get('weight').events.input({ target: { value } }) };
}

const purity = { 10: 0.4167, 14: 0.5833, 18: 0.75, 22: 0.9167, 24: 1 };
for (const [min, max] of [[0.90, 0.91], [0.85, 0.88]]) {
  const c = calculator(min, max);
  assert.ok(c.elements.get('app').innerHTML.includes(`${min * 100}–${max * 100}%`));
  for (const karat of Object.keys(purity)) for (const form of ['solid', 'semi-solid']) for (const condition of ['new', 'old']) {
    c.click('k' + karat); c.click(form); c.click(condition); c.weight('10');
    const upper = Math.max(min, max - (form === 'semi-solid' ? 0.01 : 0) - (condition === 'old' ? 0.01 : 0));
    const money = value => '$' + Math.round(value).toLocaleString();
    const lowPay = money(1000 * purity[karat] * min), highPay = money(1000 * purity[karat] * upper);
    assert.equal(c.elements.get('payout-min').textContent, lowPay);
    assert.equal(c.elements.get('payout-max').textContent, highPay);
    assert.equal(c.elements.get('rate').textContent, `${(min * 100).toFixed(0)}–${(upper * 100).toFixed(0)}%`);
    assert.ok(decodeURIComponent(c.elements.get('quote-cta').href).includes(`${lowPay} – ${highPay} USD`));
  }
  for (const invalid of ['', '-2', 'Infinity', '1e999', 'NaN', 'abc']) {
    c.weight(invalid);
    assert.equal(c.elements.get('payout-min').textContent, '$0');
    assert.equal(c.elements.get('payout-max').textContent, '$0');
  }
}
const english = calculator(null, null, 'en');
assert.equal(english.config.BUYBACK_MAX_PCT, 0.91);
assert.ok(decodeURIComponent(english.elements.get('quote-cta').href).includes('Estimated payout: $675 – $683 USD'));
console.log('PASS: all karats, forms, conditions, configurable rates, invalid weights, and WhatsApp quotes.');

// The chart must collect real observations, never invent a market history.
const chartElements = new Map();
const chartElement = id => {
  if (!chartElements.has(id)) chartElements.set(id, { innerHTML: '', textContent: '', addEventListener() {} });
  return chartElements.get(id);
};
const saved = new Map();
const subscribers = [];
const state = { perGram: 100, source: 'fallback', updatedAt: new Date() };
const chartContext = vm.createContext({ window: {}, document: {
  getElementById: chartElement, querySelector: selector => chartElement(selector.slice(1)), querySelectorAll: () => []
}, localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) } });
vm.runInContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), chartContext);
chartContext.window.DKYI18n = { getLang: () => 'en', t: key => key };
chartContext.window.DKYSpot = { spotState: state, getSpotPrice: () => state.perGram,
  getStatusLabel: () => state.source === 'fallback' ? 'Reference price' : 'Gold spot price',
  onSpot: fn => { subscribers.push(fn); fn(state); return () => {}; } };
vm.runInContext(fs.readFileSync(path.join(root, 'js/pages/sell.js'), 'utf8'), chartContext);
chartContext.window.DKYSell.render();
assert.deepEqual(JSON.parse(saved.get('dky-chart-observations-v2')), []);
assert.equal(chartElement('chart-price').textContent, '$100.00');
assert.ok(chartElement('chart-label').textContent.includes('Reference price'));
assert.ok(chartElement('chart-content').innerHTML.includes('actual price observations'));
state.source = 'test-source';
subscribers.forEach(fn => fn(state));
assert.equal(JSON.parse(saved.get('dky-chart-observations-v2')).length, 1);
state.perGram = 101;
subscribers.forEach(fn => fn(state));
assert.equal(JSON.parse(saved.get('dky-chart-observations-v2')).length, 2);
assert.ok(chartElement('chart-content').innerHTML.includes('<path'));
console.log('PASS: chart starts without invented history, excludes fallback, and plots actual observations.');
