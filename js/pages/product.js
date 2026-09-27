window.DKYProduct = (function () {
  let PRODUCTS = [];
  let currentProductId = null;


  function ensureProducts() {
    if (window.DKY_PRODUCTS && window.DKY_PRODUCTS.length) {
      PRODUCTS = window.DKY_PRODUCTS;
      return true;
    }
    return false;
  }

  function getProductText(product, field, lang) {
    if (!product[field]) return "";
    if (typeof product[field] === 'object') {
      return product[field][lang] || product[field]['es'];
    }
    return product[field];
  }

  function fmtMoney(n) { return "$" + Math.round(n).toLocaleString(); }
  function escape(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function getDisplayPrice(p) {
    if (p.priceType === "fixed" && p.priceUsd != null) return fmtMoney(p.priceUsd);
    if (p.priceType === "range") return fmtMoney(p.priceMinUsd) + " – " + fmtMoney(p.priceMaxUsd);
    return window.DKYI18n?.t('check_price') || 'Consultar precio';
  }
  function safeImage(value) {
    const source = String(value || '').trim();
    if (/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
    try { const url = new URL(source, window.location.href); return /^https?:$/.test(url.protocol) ? escape(url.href) : ''; }
    catch { return ''; }
  }

  // Función robusta para convertir cualquier formato de detalles a un array limpio
  function normalizeDetails(d) {
    if (!d) return [];

    // Si ya es un array real
    if (Array.isArray(d)) {
      return d.filter(item => typeof item === 'string' && item.trim());
    }

    // Si es un string
    if (typeof d === 'string') {
      let trimmed = d.trim();

      // Intenta parsear como JSON (con comillas dobles o simples)
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        // Reemplazar comillas simples por dobles para que JSON.parse funcione
        let jsonStr = trimmed.replace(/'/g, '"');
        // Escapar comillas dobles internas si las hubiera (caso raro)
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => typeof item === 'string').map(s => s.trim());
          }
        } catch (e) {
          // Si falla, seguir con otros métodos
        }
      }

      // Dividir por saltos de línea
      let lines = d.split(/\r?\n/).filter(line => line.trim());
      if (lines.length > 0) return lines;

      // Si tiene comas y no saltos de línea, dividir por coma
      if (d.includes(',')) {
        return d.split(',').map(s => s.trim()).filter(s => s);
      }

      // Si es una sola línea, devolver como un solo elemento
      return [d.trim()];
    }

    // Si es un objeto, convertir sus valores a array
    if (typeof d === 'object') {
      return Object.values(d).filter(v => typeof v === 'string');
    }

    return [];
  }



  function renderContent(id) {
    const i18n = window.DKYI18n;
    const cart = window.DKYCart;
    const t = (key) => i18n ? i18n.t(key) : key;
    const currentLang = i18n ? i18n.getLang() : 'es';

    // Obtener el producto desde el array más actualizado
    const products = (window.DKY_PRODUCTS && window.DKY_PRODUCTS.length)
      ? window.DKY_PRODUCTS
      : PRODUCTS;
    const p = products.find(x => String(x.id) === String(id));
    if (!p) {
      if (window.DKYNotFound) window.DKYNotFound.render();
      return;
    }

    const sameCategory = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id);
    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    const similarItems = shuffle(sameCategory).slice(0, 6);

    function renderSimilarProducts(items, lang) {
      if (!items.length) return '';
      const i18n = window.DKYI18n;
      const t = (key) => i18n ? i18n.t(key) : key;
      let html = `<div class="similar-products">
        <h4 class="similar-title">${t("similar_products") || "Productos similares"}</h4>
        <div class="similar-grid">`;
      items.forEach(sim => {
        const simName = getProductText(sim, 'name', lang);
        html += `
          <a href="/shop/${encodeURIComponent(sim.id)}" class="similar-card">
            <div class="similar-img">
              <img src="${safeImage(sim.image)}" alt="${escape(simName)}" loading="lazy" />
              <span class="karat-tag small-karat">${escape(sim.karat)}k</span>
            </div>
            <span class="similar-price">${getDisplayPrice(sim)}</span>
          </a>`;
      });
      html += `</div></div>`;
      return html;
    }

    const name = getProductText(p, 'name', currentLang);
    const category = t('cat_' + (p.category || 'other'));
    const description = getProductText(p, 'description', currentLang);
    const rawDetails = getProductText(p, 'details', currentLang);

    const detailsArray = normalizeDetails(rawDetails);
    const detailsHtml = detailsArray.length
      ? `<ul>${detailsArray.map(d => `<li>${escape(d)}</li>`).join('')}</ul>`
      : `<p>${escape(rawDetails) || ''}</p>`;

    const related = PRODUCTS.filter(x => x.id !== id).slice(0, 3);

    document.getElementById("app").innerHTML = `
      <section class="product-page"><div class="container"><a class="back-link" href="/shop">${t("back_to_shop")}</a>
      <div class="pp-grid">
        <div class="pp-img-frame"><img src="${safeImage(p.image)}" alt="${escape(name)}" /></div>
        <div class="pp-info">
          <p class="pp-cat">${category}</p>
          <h1>${escape(name)}</h1>
          <!-- Kilataje de la pieza -->
          <div class="gold-text" style="font-size: 2.5rem; font-weight: 700; line-height: 1.1; margin-bottom: 1rem;">
            ${escape(p.karat)}k
          </div>

          <!-- Precio o mensaje de consulta -->
            <div class="pp-price-row" style="margin-bottom: 1.2rem;">
              <span class="pp-price gold-text">${getDisplayPrice(p)}</span>
            </div>

          <!-- Botón de acción principal -->
          ${cart && cart.canAddToCart(p)
        ? `<button class="btn-primary pp-add" id="pp-add" style="width: 100%; margin-bottom: 2rem;">${t("add_to_cart")}</button>`
        : `<a href="https://wa.me/${window.DKY_CONFIG?.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Me interesa esta pieza")}" class="btn-primary pp-add" style="width: 100%; margin-bottom: 2rem;">💬 ${t("inquire_whatsapp")}</a>`
      }

          <!-- Productos similares (misma categoría) -->
          ${renderSimilarProducts(similarItems, currentLang)}

          <!-- Detalles técnicos (si existen) -->
          ${detailsArray.length ? `
            <div class="card details-card" style="margin-top: 2rem;">
              <h2>${t("details")}</h2>
              ${detailsArray.map(d => `<p>${escape(d)}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
      </div></section>
    `;

    if (cart && cart.canAddToCart(p)) {
      document.getElementById("pp-add")?.addEventListener("click", () => cart.cartAdd(p));
    }
  }

  function render(id) {
    currentProductId = id;
    function update() {
      if (currentProductId !== id) return;
      const spanish = window.DKYI18n?.getLang() !== 'en';
      const status = window.DKYProducts?.getStatus();
      if (status === 'ready' || (!status && ensureProducts())) {
        PRODUCTS = window.DKYProducts?.getProducts() || window.DKY_PRODUCTS || [];
        renderContent(id);
        return;
      }
      const error = status === 'error';
      document.getElementById('app').innerHTML = `<section class="product-page"><div class="container"><div class="empty-state" role="status"><p>${error ? (spanish ? 'No pudimos cargar esta pieza.' : 'We could not load this piece.') : (spanish ? 'Cargando pieza…' : 'Loading piece…')}</p>${error ? `<button type="button" class="btn-outline" id="retry-product">${spanish ? 'Volver a intentar' : 'Try again'}</button>` : ''}<a class="back-link" href="/shop">${window.DKYI18n?.t('back_to_shop') || 'Volver a la colección'}</a></div></div></section>`;
      if (error) document.getElementById('retry-product')?.addEventListener('click', () => window.DKYProducts.fetchProducts());
    }
    document.addEventListener('productsLoaded', update);
    document.addEventListener('productsStatus', update);
    update();
    return () => {
      document.removeEventListener('productsLoaded', update);
      document.removeEventListener('productsStatus', update);
      if (currentProductId === id) currentProductId = null;
    };
  }

  ensureProducts();

  if (window.DKY_PRODUCTS && window.DKY_PRODUCTS.length) {
    PRODUCTS = window.DKY_PRODUCTS;
  }

  window.addEventListener('langchange', function () {
    if (currentProductId && window.location.hash.includes('/shop/')) {
      ensureProducts();
      renderContent(currentProductId);
    }
  });

  return { render };
})();
