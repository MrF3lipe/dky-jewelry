const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const events = [];
let response;
const context = vm.createContext({ window: { DKY_CONFIG: { API_BASE_URL: 'https://example.com/api' } },
  document: { dispatchEvent: event => events.push(event) },
  CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
  fetch: async () => response, console: { error() {} } });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../products.js'), 'utf8'), context);
(async () => {
  const api = context.window.DKYProducts;
  response = { ok: false, status: 503 };
  await api.fetchProducts();
  assert.equal(api.getStatus(), 'error');
  response = { ok: true, json: async () => [{ id: 12, name: 'Ring', price: '120.50' }, { id: 13, price: null }, { id: 14, price: 'bad' }] };
  await api.fetchProducts();
  assert.equal(api.getStatus(), 'ready');
  assert.equal(api.getProductById(12).id, '12');
  assert.equal(api.getProductById('12').priceUsd, 120.5);
  assert.equal(api.getProductById(13).priceType, 'hidden');
  assert.equal(api.getProductById(14).priceType, 'hidden');
  response = { ok: true, json: async () => [] };
  await api.fetchProducts();
  assert.equal(api.getStatus(), 'ready');
  assert.equal(api.getProducts().length, 0);
  assert.equal(events.at(-1).type, 'productsLoaded');
  response = { ok: true, json: async () => ({ error: 'unavailable' }) };
  await api.fetchProducts();
  assert.equal(api.getStatus(), 'error');
  console.log('PASS: API failures, retry, numeric IDs, unknown prices, empty collection and invalid responses.');
})().catch(error => { console.error(error); process.exitCode = 1; });
