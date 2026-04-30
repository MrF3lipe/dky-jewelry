window.DKYCart = (function() {
  "use strict";
  
  const CART_KEY = "dky-cart";
  let cart = [];
  let listeners = [];
  
  function getProductText(product, field, lang) {
    if (!product[field]) return "";
    if (typeof product[field] === 'object') {
      return product[field][lang] || product[field]['es'];
    }
    return product[field];
  }
  
  function getCurrentLang() {
    const i18n = window.DKYI18n;
    return i18n ? i18n.getLang() : 'es';
  }

  function notifyListeners() {
    listeners.forEach(fn => fn(cart));
  }
  
  function onCartChange(fn) {
    listeners.push(fn);
    fn(cart);
    return () => { listeners = listeners.filter(f => f !== fn); };
  }
  
  function loadCart() {
    try { 
      cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); 
    } catch (e) { 
      cart = []; 
    }
    notifyListeners();
    return cart;
  }
  
  function saveCart() { 
    localStorage.setItem(CART_KEY, JSON.stringify(cart)); 
    notifyListeners();
    renderCartBadge();
    renderCartDrawer();
  }
  
  function cartCount() { 
    return cart.reduce((s, i) => s + i.qty, 0); 
  }
  
  function cartTotalMin() {
    return cart.reduce((s, i) => {
      if (i.product.priceType === "fixed") return s + i.qty * i.product.priceUsd;
      if (i.product.priceType === "range") return s + i.qty * i.product.priceMinUsd;
      return s;
    }, 0);
  }
  
  function cartTotalMax() {
    return cart.reduce((s, i) => {
      if (i.product.priceType === "fixed") return s + i.qty * i.product.priceUsd;
      if (i.product.priceType === "range") return s + i.qty * i.product.priceMaxUsd;
      return s;
    }, 0);
  }
  
  function fmtMoney(n) {
    return "$" + Math.round(n).toLocaleString();
  }
  
  function cartTotalDisplay() {
    const min = cartTotalMin();
    const max = cartTotalMax();
    const hasRange = cart.some(i => i.product.priceType === "range");
    const hasHidden = cart.some(i => i.product.priceType === "hidden");
    const i18n = window.DKYI18n;
    const checkPrice = i18n ? i18n.t("check_price") : "Check price";
    
    if (hasHidden) return checkPrice;
    if (hasRange && min !== max) return fmtMoney(min) + " – " + fmtMoney(max);
    return fmtMoney(min);
  }
  
  function canAddToCart(product) {
    return product.priceType !== "hidden";
  }
  
  function cartAdd(product) {
    const found = cart.find(i => i.product.id === product.id);
    if (found) found.qty++;
    else cart.push({ product, qty: 1 });
    saveCart();
    return true;
  }
  
  function cartSetQty(id, qty) {
    if (qty <= 0) cart = cart.filter(i => i.product.id !== id);
    else cart = cart.map(i => i.product.id === id ? { ...i, qty } : i);
    saveCart();
  }
  
  function cartRemove(id) { 
    cart = cart.filter(i => i.product.id !== id); 
    saveCart(); 
  }
  
  function cartClear() { 
    cart = []; 
    saveCart(); 
  }
  
  function getCart() {
    return cart;
  }
  
  function renderCartBadge() {
    const badge = document.getElementById("cart-count");
    if (!badge) return;
    const c = cartCount();
    if (c > 0) { 
      badge.hidden = false; 
      badge.textContent = c; 
    } else { 
      badge.hidden = true; 
    }
  }
  
  function openCart() {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;
    overlay.removeAttribute('hidden');
    drawer.removeAttribute('hidden');
    document.body.style.overflow = "hidden";
    renderCartDrawer();
  }
  
  function closeCart() {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;
    overlay.setAttribute('hidden', '');
    drawer.setAttribute('hidden', '');
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ 
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" 
    }[c]));
  }
  
  function whatsappLink(msg) {
    const cfg = window.DKY_CONFIG;
    return "https://wa.me/" + encodeURIComponent(cfg.WHATSAPP_NUMBER) + "?text=" + encodeURIComponent(msg);
  }
  
  function buildCartMessage() {
    const i18n = window.DKYI18n;
    const lang = i18n ? i18n.getLang() : "es";
    const cfg = window.DKY_CONFIG;
    const lines = [];
    
    if (lang === "es") {
      lines.push("¡Hola " + cfg.BUSINESS_NAME + "! Me gustaría consultar sobre las siguientes piezas:");
      lines.push("");
      cart.forEach((i, idx) => {
        let priceText = "";
        let totalText = "";
        
        if (i.product.priceType === "fixed") {
          priceText = fmtMoney(i.product.priceUsd);
          totalText = fmtMoney(i.product.priceUsd * i.qty);
        } else if (i.product.priceType === "range") {
          priceText = fmtMoney(i.product.priceMinUsd) + " – " + fmtMoney(i.product.priceMaxUsd);
          const minTotal = i.product.priceMinUsd * i.qty;
          const maxTotal = i.product.priceMaxUsd * i.qty;
          totalText = fmtMoney(minTotal) + " – " + fmtMoney(maxTotal);
        } else {
          priceText = "por consultar";
          totalText = "por consultar";
        }
        
        const name = getProductText(i.product, 'name', lang);
        lines.push((idx + 1) + ". " + name + " (" + i.product.karat + "k, " + i.product.weightGrams + "g) — cantidad " + i.qty +
          " — " + priceText + " (total aprox: " + totalText + ")");
      });
      lines.push("");
      lines.push("Total general estimado: " + cartTotalDisplay());
      lines.push("");
      lines.push("¿Podrían confirmar disponibilidad y precio final?");
    } else {
      lines.push("Hi " + cfg.BUSINESS_NAME + "! I'd like to inquire about the following pieces:");
      lines.push("");
      cart.forEach((i, idx) => {
        let priceText = "";
        let totalText = "";
        
        if (i.product.priceType === "fixed") {
          priceText = fmtMoney(i.product.priceUsd);
          totalText = fmtMoney(i.product.priceUsd * i.qty);
        } else if (i.product.priceType === "range") {
          priceText = fmtMoney(i.product.priceMinUsd) + " – " + fmtMoney(i.product.priceMaxUsd);
          const minTotal = i.product.priceMinUsd * i.qty;
          const maxTotal = i.product.priceMaxUsd * i.qty;
          totalText = fmtMoney(minTotal) + " – " + fmtMoney(maxTotal);
        } else {
          priceText = "inquire";
          totalText = "inquire";
        }
        
        const name = getProductText(i.product, 'name', lang);
        lines.push((idx + 1) + ". " + name + " (" + i.product.karat + "k, " + i.product.weightGrams + "g) — qty " + i.qty +
          " — " + priceText + " (approx total: " + totalText + ")");
      });
      lines.push("");
      lines.push("Overall estimated total: " + cartTotalDisplay());
      lines.push("");
      lines.push("Could you confirm availability and final price?");
    }
    return lines.join("\n");
  }
  
  function renderCartDrawer() {
    const body = document.getElementById("cart-body");
    const foot = document.getElementById("cart-footer");
    const i18n = window.DKYI18n;
    const lang = getCurrentLang();
    if (!body || !foot) return;
    
    if (cart.length === 0) {
      body.innerHTML = `<div class="empty"><p>${i18n ? i18n.t("empty_cart") : "Empty"}</p><p class="small">${i18n ? i18n.t("empty_cart_add") : "Add an item"}</p></div>`;
      foot.hidden = true;
      return;
    }
    
    body.innerHTML = cart.map(i => {
      const productName = getProductText(i.product, 'name', lang);
      return `
      <div class="cart-item">
        <img src="${escape(i.product.image)}" alt="${escape(productName)}" />
        <div class="info">
          <div class="info-top">
            <div>
              <div class="name">${escape(productName)}</div>
              <div class="meta">${i.product.karat}k · ${i.product.weightGrams}g</div>
              ${i.product.priceType !== "fixed" ? `<div class="meta" style="color: var(--gold-bright); font-size: 10px;">${i.product.priceType === "range" ? (i18n ? i18n.t("estimated_price") : "Estimated") : (i18n ? i18n.t("check_price") : "Check")}</div>` : ''}
            </div>
            <button type="button" class="remove" data-remove="${escape(i.product.id)}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <div class="controls">
            <div class="qty">
              <button data-dec="${escape(i.product.id)}">−</button>
              <span>${i.qty}</span>
              <button data-inc="${escape(i.product.id)}">+</button>
            </div>
            <span class="item-price">${(function() {
              if (i.product.priceType === "fixed") return fmtMoney(i.product.priceUsd * i.qty);
              if (i.product.priceType === "range") {
                const minTotal = i.product.priceMinUsd * i.qty;
                const maxTotal = i.product.priceMaxUsd * i.qty;
                if (minTotal === maxTotal) return fmtMoney(minTotal);
                return fmtMoney(minTotal) + " – " + fmtMoney(maxTotal);
              }
              return i18n ? i18n.t("check_price") : "Check";
            })()}</span>
          </div>
        </div>
      </div>`;
    }).join("");
    
    foot.hidden = false;
    foot.innerHTML = `
      <div class="drawer-total">
        <span class="l">${i18n ? i18n.t("total") : "Total"}</span>
        <span class="v gold-text">${cartTotalDisplay()}</span>
      </div>
      <p class="note">${i18n ? i18n.t("final_price_whatsapp") : "Final price confirmed by WhatsApp."}</p>
      <a class="btn-primary" href="${whatsappLink(buildCartMessage())}" target="_blank" style="width:100%;">
        💬 ${i18n ? i18n.t("inquire_whatsapp") : "Inquire on WhatsApp"}
      </a>
      <button type="button" class="clear" id="cart-clear">${i18n ? i18n.t("clear_selection") : "Clear"}</button>
    `;
    
    body.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => cartRemove(btn.dataset.remove));
    });
    body.querySelectorAll("[data-inc]").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = cart.find(i => i.product.id === btn.dataset.inc);
        if (item) cartSetQty(item.product.id, item.qty + 1);
      });
    });
    body.querySelectorAll("[data-dec]").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = cart.find(i => i.product.id === btn.dataset.dec);
        if (item) cartSetQty(item.product.id, item.qty - 1);
      });
    });
    
    const clearBtn = document.getElementById("cart-clear");
    if (clearBtn) clearBtn.addEventListener("click", cartClear);
  }
  
  function init() {
    loadCart();
    renderCartBadge();
    renderCartDrawer();

    const cartBtn = document.getElementById("cart-btn");
    const cartClose = document.getElementById("cart-close");
    const cartOverlay = document.getElementById("cart-overlay");
    
    if (cartBtn) cartBtn.addEventListener("click", openCart);
    if (cartClose) cartClose.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
    
    window.addEventListener('langchange', () => {
      renderCartDrawer();
      renderCartBadge();
    });
  }
  
  return { init, cartAdd, getCart, onCartChange, canAddToCart, cartTotalDisplay };
})();