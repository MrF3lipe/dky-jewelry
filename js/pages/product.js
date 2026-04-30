window.DKYProduct = (function() {
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
    if (p.priceType === "fixed") return fmtMoney(p.priceUsd);
    if (p.priceType === "range") return fmtMoney(p.priceMinUsd) + " – " + fmtMoney(p.priceMaxUsd);
    return "";
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
        } catch(e) {
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
    const p = products.find(x => x.id === id);
    
    if (!p) {
      if (window.DKYNotFound) window.DKYNotFound.render();
      return;
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
      <div class="pp-grid"><div class="pp-img-frame"><img src="${p.image}" /></div><div class="pp-info">
        <p class="pp-cat">${category}</p><h1>${escape(name)}</h1><p class="pp-desc">${escape(description)}</p>
        <div class="pp-price-row"><span class="pp-price gold-text">${getDisplayPrice(p)}</span><span class="pp-meta">${p.karat}k · ${p.weightGrams}g</span></div>
        ${(cart && cart.canAddToCart(p)) ? `<button class="btn-primary pp-add" id="pp-add">${t("add_to_cart")}</button>` : `<a href="https://wa.me/${window.DKY_CONFIG?.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Me interesa " + name)}" class="btn-primary pp-add">${t("inquire_whatsapp")}</a>`}
        <div class="card details-card"><h2>${t("details")}</h2>${detailsHtml}</div>
      </div></div>
      <section class="related"><h2>${t("you_may_also_like")}</h2><div class="related-grid">${related.map(r => {
        const rName = getProductText(r, 'name', currentLang);
        return `<a class="product-card" href="/shop/${r.id}"><div class="product-img"><img src="${r.image}" /></div><div class="product-body"><p class="product-name">${escape(rName)}</p><p class="product-price">${getDisplayPrice(r)}</p></div></a>`;
      }).join("")}</div></section>
      </div></section>`;

    if (cart && cart.canAddToCart(p)) {
      document.getElementById("pp-add")?.addEventListener("click", () => cart.cartAdd(p));
    }
  }

  function render(id) {
    currentProductId = id;

    // Intenta usar los productos que ya están en memoria global
    if (ensureProducts()) {
      renderContent(id);
    } else {
      // Si aún no hay productos, espera el evento
      document.addEventListener('productsLoaded', function onLoad(e) {
        PRODUCTS = e.detail;
        if (currentProductId === id) {
          renderContent(id);
        }
        document.removeEventListener('productsLoaded', onLoad);
      });
    }
    return () => {};
  }

  ensureProducts();

  if (window.DKY_PRODUCTS && window.DKY_PRODUCTS.length) {
    PRODUCTS = window.DKY_PRODUCTS;
  }

  window.addEventListener('langchange', function() {
    if (currentProductId && window.location.hash.includes('/shop/')) {
      ensureProducts();
      renderContent(currentProductId);
    }
  });

  return { render };
})();










