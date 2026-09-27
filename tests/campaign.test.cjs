const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(lang = 'es') {
  const ids = ['app', 'campaign-products', 'campaign-copy', 'campaign-feedback', 'campaign-explore', 'campaign-selection', 'campaign-selection-title'];
  const nodes = Object.fromEntries(ids.map(id => [id, {
    innerHTML: '', textContent: '', events: {},
    addEventListener(type, fn) { this.events[type] = fn; },
    removeEventListener(type) { delete this.events[type]; },
    scrollIntoView() { this.scrolled = true; }, focus() { this.focused = true; }
  }]));
  const listeners = new Map();
  let copied;
  let restored;
  const context = vm.createContext({ URL,
    window: { location: { href: 'https://www.dkygold.com/laura' },
      DKYI18n: { getLang: () => lang }, DKY_CONFIG: { WHATSAPP_NUMBER: '19414650463' },
      DKY_CAMPAIGN: { code: 'LAURA10', discountPercent: 10, productIds: [] },
      DKY_PRODUCTS: [{ id: 1, name: { es: 'Anillo <oro>', en: 'Gold ring' }, image: '/ring.jpg' }, { id: 2, name: 'Excluded', image: 'javascript:alert(1)' }]
    },
    document: { getElementById: id => nodes[id], addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    navigator: { clipboard: { writeText: async value => { copied = value; } } },
    history: { replaceState: (_, __, value) => { restored = value; } }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/pages/campaign.js'), 'utf8'), context);
  return { context, nodes, listeners, copied: () => copied, restored: () => restored, render: () => context.window.DKYCampaign.render() };
}

(async () => {
  const f = fixture();
  let dispose = f.render();
  assert.match(f.nodes['campaign-products'].innerHTML, /Consulta las prendas participantes/);
  assert.doesNotMatch(f.nodes['campaign-products'].innerHTML, /Anillo|Excluded/);
  assert.match(f.nodes['campaign-products'].innerHTML, /LAURA10.*10%/);
  assert.match(f.nodes.app.innerHTML, /únicamente a las prendas seleccionadas/);
  await f.nodes['campaign-copy'].events.click();
  assert.equal(f.copied(), 'LAURA10');
  assert.equal(f.nodes['campaign-feedback'].textContent, 'Código copiado.');
  f.context.navigator.clipboard.writeText = async () => { throw new Error('blocked'); };
  await f.nodes['campaign-copy'].events.click();
  assert.match(f.nodes['campaign-feedback'].textContent, /copiarlo manualmente/);
  let prevented = false;
  f.nodes['campaign-explore'].events.click({ button: 0, preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.ok(prevented);
  assert.equal(f.restored(), '/laura#campaign-selection');
  assert.ok(f.nodes['campaign-selection'].scrolled);
  assert.ok(f.nodes['campaign-selection-title'].focused);
  dispose();
  assert.ok(!f.listeners.has('productsLoaded'));
  assert.equal(f.nodes['campaign-explore'].events.click, undefined);

  f.context.window.DKY_CAMPAIGN.productIds = ['1'];
  dispose = f.render();
  assert.match(f.nodes['campaign-products'].innerHTML, /Anillo &lt;oro&gt;/);
  assert.doesNotMatch(f.nodes['campaign-products'].innerHTML, /Excluded/);
  assert.match(f.nodes['campaign-products'].innerHTML, /LAURA10.*ID%3A%201/);
  assert.match(f.nodes['campaign-products'].innerHTML, /https:\/\/www.dkygold.com\/ring.jpg/);
  f.listeners.get('productsLoaded')({ detail: [{ id: '1', name: 'Updated', image: 'javascript:alert(1)' }] });
  assert.match(f.nodes['campaign-products'].innerHTML, /Updated/);
  assert.doesNotMatch(f.nodes['campaign-products'].innerHTML, /javascript:/);
  dispose();
  const en = fixture('en'); en.render();
  assert.match(en.nodes.app.innerHTML, /only to pieces selected/);
  console.log('PASS: campaign eligibility, safe images, copy success/failure, inquiry context, anchor navigation and cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
