// js/pages/product.js
window.DKYProduct = (function() {
  const PRODUCTS = window.DKY_PRODUCTS || [];
  
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
  
  function render(id) {
    const i18n = window.DKYI18n;
    const cart = window.DKYCart;
    const t = (key) => i18n ? i18n.t(key) : key;
    const currentLang = i18n ? i18n.getLang() : 'es';
    
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) { if(window.DKYNotFound) window.DKYNotFound.render(); return ()=>{}; }
    
    const name = getProductText(p, 'name', currentLang);
    const category = getProductText(p, 'category', currentLang);
    const shortDesc = getProductText(p, 'shortDesc', currentLang);
    const description = getProductText(p, 'description', currentLang);
    const details = getProductText(p, 'details', currentLang);
    
    const related = PRODUCTS.filter(x => x.id !== id).slice(0,3);
    document.getElementById("app").innerHTML = `
      <section class="product-page"><div class="container"><a class="back-link" href="#/shop">${t("back_to_shop")}</a>
      <div class="pp-grid"><div class="pp-img-frame"><img src="${p.image}" /></div><div class="pp-info">
        <p class="pp-cat">${category}</p><h1>${escape(name)}</h1><p class="pp-desc">${escape(description)}</p>
        <div class="pp-price-row"><span class="pp-price gold-text">${getDisplayPrice(p)}</span><span class="pp-meta">${p.karat}k · ${p.weightGrams}g</span></div>
        ${(cart && cart.canAddToCart(p)) ? `<button class="btn-primary pp-add" id="pp-add">${t("add_to_cart")}</button>` : `<a href="https://wa.me/${window.DKY_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Me interesa " + name)}" class="btn-primary pp-add">${t("inquire_whatsapp")}</a>`}
        <div class="card details-card"><h2>${t("details")}</h2><ul>${details.map(d => `<li>${escape(d)}</li>`).join("")}</ul></div>
      </div></div>
      <section class="related"><h2>${t("you_may_also_like")}</h2><div class="related-grid">${related.map(r => {
        const rName = getProductText(r, 'name', currentLang);
        return `<a class="product-card" href="#/shop/${r.id}"><div class="product-img"><img src="${r.image}" /></div><div class="product-body"><p class="product-name">${escape(rName)}</p><p class="product-price">${getDisplayPrice(r)}</p></div></a>`;
      }).join("")}</div></section>
      </div></section>`;
    
    if (cart && cart.canAddToCart(p)) {
      document.getElementById("pp-add")?.addEventListener("click", () => cart.cartAdd(p));
    } else {
      const waBtn = document.querySelector(".pp-add");
      if (waBtn && waBtn.tagName === 'A') {
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
        
        waBtn.href = `https://wa.me/${cfg.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      }
    }
    return () => {};
  }
  return { render };
})();