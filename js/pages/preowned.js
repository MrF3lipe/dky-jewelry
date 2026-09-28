window.DKYPreowned = (function () {
  "use strict";
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeImage = value => { const source = String(value || '').trim(); if (/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\s]+$/i.test(source)) return source; try { const url = new URL(source, window.location.href); return /^https?:$/.test(url.protocol) ? escape(url.href) : ''; } catch { return ''; } };
  const money = value => '$' + Math.round(Number(value) || 0).toLocaleString();
  function renderCards(container) {
    const t = key => window.DKYI18n?.t(key) || key;
    const products = (window.DKYProducts?.getProducts() || []).filter(product => product.preowned);
    container.innerHTML = products.length ? `<div class="products-grid preowned-grid">${products.map(product => `<article class="product-card preowned-card"><a href="/segunda-mano/${encodeURIComponent(product.id)}"><div class="product-img"><img src="${safeImage(product.image)}" alt="${escape(product.name?.es || '')}" loading="lazy" decoding="async"><span class="preowned-badge">${t('preowned_badge')}</span><span class="karat-tag">${escape(product.karat)}k</span></div><div class="product-name">${escape(product.name?.es || '')}</div><div class="preowned-condition">${t('preowned_condition')}: ${escape(t('condition_' + product.conditionGrade) || product.conditionGrade)}</div><div class="product-price">${money(product.priceUsd)}</div></a><button type="button" class="add-btn" data-add="${escape(product.id)}">${t('add_to_cart')}</button></article>`).join('')}</div>` : `<div class="empty-state"><p>${t('preowned_empty')}</p></div>`;
    container.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => { const product = products.find(item => item.id === button.dataset.add); if (product) window.DKYCart?.cartAdd(product); }));
  }
  function render() {
    const t = key => window.DKYI18n?.t(key) || key;
    const app = document.getElementById('app');
    app.innerHTML = `<section class="shop preowned-shop"><div class="container"><header class="shop-head"><span class="pill">✦</span><h1>${t('preowned_title')}</h1><p>${t('preowned_desc')}</p></header><div id="preowned-grid"></div></div></section>`;
    const container = document.getElementById('preowned-grid');
    renderCards(container);
    const onProducts = () => renderCards(container);
    document.addEventListener('productsLoaded', onProducts);
    return () => document.removeEventListener('productsLoaded', onProducts);
  }
  return { render };
})();
