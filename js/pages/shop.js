// js/pages/shop.js
window.DKYShop = (function() {
  const PRODUCTS = window.DKY_PRODUCTS || [];
  let activeCat = "All";
  let justAdded = null;
  let timeout = null;
  
  // Función helper para obtener textos según el idioma
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
  
  function renderProducts(container) {
    const i18n = window.DKYI18n;
    const cart = window.DKYCart;
    const t = (key) => i18n ? i18n.t(key) : key;
    const currentLang = i18n ? i18n.getLang() : 'es';
    
    const filtered = activeCat === "All" ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCat);
    const cats = ["All", "Necklaces", "Rings", "Earrings", "Bracelets"];
    const i18nCats = i18n && i18n.getLang() === "es" ? ["Todos", "Collares", "Anillos", "Aretes", "Pulseras"] : cats;
    const catMap = { "Todos":"All", "Collares":"Necklaces", "Anillos":"Rings", "Aretes":"Earrings", "Pulseras":"Bracelets" };
    
    container.innerHTML = `
      <div class="cat-filter">${i18nCats.map(c => `<button class="cat-btn ${c === activeCat ? "active" : ""}" data-cat="${c}">${c} <span class="count">${c === "All" || c === "Todos" ? PRODUCTS.length : PRODUCTS.filter(p => p.category === (catMap[c] || c)).length}</span></button>`).join("")}</div>
      <div class="products-grid">${filtered.map(p => {
        const name = getProductText(p, 'name', currentLang);
        const category = getProductText(p, 'category', currentLang);
        const shortDesc = getProductText(p, 'shortDesc', currentLang);
        const priceDisplay = p.priceType === "hidden" ? "" : getDisplayPrice(p);
        
        return `
          <div class="product-card">
            <a href="#/shop/${p.id}"><div class="product-img"><img src="${p.image}" /><span class="karat-tag">${p.karat}k</span></div>
            <div class="product-body"><p class="product-cat">${category}</p><h3>${escape(name)}</h3><p class="product-desc">${escape(shortDesc)}</p>
            <div class="product-row"><span class="product-price">${priceDisplay}</span><span class="product-view">${t("enter_shop")}</span></div></div></a>
            ${(cart && cart.canAddToCart(p)) ? `<button class="add-btn ${justAdded === p.id ? "added" : ""}" data-add="${p.id}">${justAdded === p.id ? t("added") : t("add_to_cart")}</button>` : `<button class="whatsapp-inquiry" data-wa="${p.id}">${t("inquire_whatsapp")}</button>`}
          </div>`;
      }).join("")}</div>
    `;
    
    container.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", (e) => {
      e.preventDefault();
      const p = PRODUCTS.find(x => x.id === btn.dataset.add);
      if (p && cart) { cart.cartAdd(p); justAdded = p.id; renderProducts(container); if (timeout) clearTimeout(timeout); timeout = setTimeout(() => { justAdded = null; renderProducts(container); }, 1400); }
    }));
    
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
          msg = "Hola " + cfg.BUSINESS_NAME + "! Me interesa el producto" + name + ". ¿Podrían compartirme el precio y los detalles?";
        } else {
          msg = "Hi " + cfg.BUSINESS_NAME + "! I'm interested in " + name + ". Could you share the price and details?";
        }
        
        window.open(`https://wa.me/${cfg.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    }));
    
    container.querySelectorAll(".cat-btn").forEach(btn => btn.addEventListener("click", () => { activeCat = btn.dataset.cat; renderProducts(container); }));
  }
  
  function render() {
    const i18n = window.DKYI18n;
    const t = (key) => i18n ? i18n.t(key) : key;
    const app = document.getElementById("app");
    app.innerHTML = `<section class="shop"><div class="container"><header class="shop-head"><span class="pill">✦</span><h1>${t("collection_title")}</h1><p>${t("collection_desc")}</p></header><div id="shop-grid"></div></div></section>`;
    const grid = document.getElementById("shop-grid");
    if (grid) renderProducts(grid);
    return () => { if (timeout) clearTimeout(timeout); };
  }
  
  return { render };
})();