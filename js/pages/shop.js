window.DKYShop = (function() {
  let PRODUCTS = [];
  let activeCat = "all"; // Usamos identificadores fijos: "all", "necklaces", "rings", "earrings", "bracelets"
  let justAdded = null;
  let timeout = null;
  let initialized = false;

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
    return window.DKYI18n ? window.DKYI18n.t('check_price') : 'Consultar precio';
  }

  function safeImage(value) {
    const source = String(value || '').trim();
    if (/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
    try { const url = new URL(source, window.location.href); return /^https?:$/.test(url.protocol) ? escape(url.href) : ''; }
    catch { return ''; }
  }

  function getCategoryId(product) {
    return product.category || "other";
  }

  function renderProducts(container) {
    const spanish = window.DKYI18n?.getLang() !== 'en';
    const status = window.DKYProducts?.getStatus() || 'loading';
    if (status === 'loading') {
      container.innerHTML = `<div class="empty-state" role="status"><p>${spanish ? 'Cargando colección…' : 'Loading collection…'}</p></div>`;
      return;
    }
    if (status === 'error') {
      container.innerHTML = `<div class="empty-state" role="status"><p>${spanish ? 'No pudimos cargar la colección.' : 'We could not load the collection.'}</p><p class="muted">${spanish ? 'Comprueba tu conexión e inténtalo de nuevo.' : 'Check your connection and try again.'}</p><button type="button" class="btn-outline" id="retry-products">${spanish ? 'Volver a intentar' : 'Try again'}</button></div>`;
      container.querySelector('#retry-products').addEventListener('click', () => window.DKYProducts.fetchProducts());
      return;
    }
    if (!PRODUCTS.length) {
      container.innerHTML = `<div class="empty-state"><p>${spanish ? 'La colección se está renovando.' : 'Our collection is being refreshed.'}</p><p class="muted">${spanish ? 'Vuelve pronto para descubrir las nuevas piezas.' : 'Check back soon to discover new pieces.'}</p></div>`;
      return;
    }

    const i18n = window.DKYI18n;
    const cart = window.DKYCart;
    const t = (key) => i18n ? i18n.t(key) : key;
    const currentLang = i18n ? i18n.getLang() : 'es';

    // Filtrar productos según categoría activa (ID fijo)
    const filtered = activeCat === "all" 
      ? PRODUCTS 
      : PRODUCTS.filter(p => getCategoryId(p, currentLang) === activeCat);

    // Lista de categorías con identificadores fijos y etiquetas traducidas
    const catItems = [
      { id: "all", label: t("cat_all") },
      { id: "necklaces", label: t("cat_necklaces") },
      { id: "rings", label: t("cat_rings") },
      { id: "earrings", label: t("cat_earrings") },
      { id: "bracelets", label: t("cat_bracelets") }
    ];

    container.innerHTML = `
      <div class="cat-filter">
        ${catItems.map(cat => `
          <button type="button" class="cat-btn ${activeCat === cat.id ? "active" : ""}" aria-pressed="${activeCat === cat.id}" data-cat="${cat.id}">
            ${cat.label} 
            <span class="count">${
              cat.id === "all" 
                ? PRODUCTS.length 
                : PRODUCTS.filter(p => getCategoryId(p, currentLang) === cat.id).length
            }</span>
          </button>
        `).join("")}
      </div>
      ${!filtered.length ? `<div class="empty-state" role="status"><p>${spanish ? 'No hay piezas disponibles en esta categoría.' : 'No pieces are available in this category.'}</p><p class="muted">${spanish ? 'Explora otra categoría para descubrir más joyas.' : 'Explore another category to discover more jewelry.'}</p></div>` : ''}
      <div class="products-grid">${filtered.map(p => {
        return `
            <div class="product-card">
              <a href="/shop/${encodeURIComponent(p.id)}">
                <div class="product-img">
                  <img src="${safeImage(p.image)}" alt="${escape(getProductText(p, 'name', currentLang))}" loading="lazy" decoding="async" />
                  <span class="karat-tag">${escape(p.karat)}k</span>
                </div>
                <div class="product-name">${escape(getProductText(p, 'name', currentLang))}</div>
                <div class="product-price">${getDisplayPrice(p)}</div>
              </a>
            <button type="button" class="add-btn ${justAdded === p.id ? "added" : ""}" data-add="${escape(p.id)}">
              ${justAdded === p.id ? t("added") : t("add_to_cart")}
            </button>
          </div>`;
      }).join("")}</div>
    `;

    // Eventos de los botones de agregar al carrito
    container.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", (e) => {
      e.preventDefault();
      const p = PRODUCTS.find(x => x.id === btn.dataset.add);
      if (p && cart) { cart.cartAdd(p); justAdded = p.id; renderProducts(container); if (timeout) clearTimeout(timeout); timeout = setTimeout(() => { justAdded = null; renderProducts(container); }, 1400); }
    }));

    // Eventos de los botones de consulta por WhatsApp
    container.querySelectorAll("[data-wa]").forEach(btn => btn.addEventListener("click", (e) => {
      e.preventDefault();
      const p = PRODUCTS.find(x => x.id === btn.dataset.wa);
      if (p) {
        const i18n = window.DKYI18n;
        const lang = i18n ? i18n.getLang() : 'es';
        const cfg = window.DKY_CONFIG;
        const name = getProductText(p, 'name', lang);
        let msg = "";
        if (lang === "es") {
          msg = "Hola " + cfg.BUSINESS_NAME + "! Me interesa el producto " + name + ". ¿Podrían compartirme el precio y los detalles?";
        } else {
          msg = "Hi " + cfg.BUSINESS_NAME + "! I'm interested in " + name + ". Could you share the price and details?";
        }
        window.open(`https://wa.me/${cfg.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    }));

    // Eventos de los botones de categoría
    container.querySelectorAll(".cat-btn").forEach(btn => btn.addEventListener("click", () => { 
      activeCat = btn.dataset.cat; 
      renderProducts(container); 
    }));
  }

  function initProducts() {
    PRODUCTS = window.DKYProducts?.getProducts() || window.DKY_PRODUCTS || [];
    if (!initialized) {
      initialized = true;
      document.addEventListener('productsLoaded', function onLoad(e) {
        PRODUCTS = e.detail;
        const grid = document.getElementById("shop-grid");
        if (grid) renderProducts(grid);
      });
      document.addEventListener('productsStatus', () => {
        const grid = document.getElementById('shop-grid');
        if (grid) renderProducts(grid);
      });
    }
  }

  function render() {
    const i18n = window.DKYI18n;
    const t = (key) => i18n ? i18n.t(key) : key;
    const app = document.getElementById("app");
    app.innerHTML = `<section class="shop"><div class="container"><header class="shop-head"><span class="pill">✦</span><h1>${t("collection_title")}</h1><p>${t("collection_desc")}</p></header><div id="shop-grid"></div></div></section>`;

    const grid = document.getElementById("shop-grid");
    if (grid) {
      initProducts();
      renderProducts(grid);
    }
    return () => { if (timeout) clearTimeout(timeout); };
  }

  initProducts();

  window.addEventListener('langchange', function() {
    const grid = document.getElementById("shop-grid");
    if (grid) {
      renderProducts(grid);
    }
  });

  return { render };
})();
