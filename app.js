/* ============= DKY Jewelry — vanilla JS app ============= */
(function () {
  "use strict";

  const CFG = window.DKY_CONFIG;
  const PRODUCTS = window.DKY_PRODUCTS;

  /* ---------- helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fmtMoney = (n) => "$" + Math.round(n).toLocaleString();
  const fmtMoney2 = (n) => "$" + n.toFixed(2);
  const escape = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const whatsappLink = (msg) =>
    "https://wa.me/" + encodeURIComponent(CFG.WHATSAPP_NUMBER) + "?text=" + encodeURIComponent(msg);

  /* ---------- price helpers ---------- */
  function getProductDisplayPrice(product) {
    if (product.priceType === "fixed") {
      return fmtMoney(product.priceUsd);
    } else if (product.priceType === "range") {
      return fmtMoney(product.priceMinUsd) + " – " + fmtMoney(product.priceMaxUsd);
    } else {
      return "";
    }
  }

  function getProductPriceValue(product) {
    if (product.priceType === "fixed") {
      return product.priceUsd;
    } else if (product.priceType === "range") {
      return product.priceMinUsd;
    } else {
      return 0;
    }
  }

  function canAddToCart(product) {
    return product.priceType !== "hidden";
  }

  function getWhatsAppPriceText(product) {
    if (product.priceType === "fixed") {
      return fmtMoney(product.priceUsd);
    } else if (product.priceType === "range") {
      return fmtMoney(product.priceMinUsd) + " – " + fmtMoney(product.priceMaxUsd) + " (según opciones)";
    } else {
      return "por consultar vía WhatsApp";
    }
  }

  /* ---------- theme ---------- */
  const THEME_KEY = "dky-theme";
  function applyTheme(mode) {
    document.documentElement.classList.toggle("light", mode === "light");
    document.documentElement.classList.toggle("dark", mode === "dark");
    $("#icon-sun").style.display = mode === "dark" ? "" : "none";
    $("#icon-moon").style.display = mode === "dark" ? "none" : "";
  }
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");
  $("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------- live spot price ---------- */
  const GRAMS_PER_OZ = 31.1035;
  const spotState = { perOz: null, perGram: null, source: "loading", updatedAt: null };
  const spotListeners = new Set();
  function onSpot(fn) { spotListeners.add(fn); fn(spotState); return () => spotListeners.delete(fn); }
  function emitSpot() { spotListeners.forEach((fn) => fn(spotState)); }

  const apiSources = [
    {
      name: "goldapi.io",
      url: "https://www.goldapi.io/api/XAU/USD",
      headers: { "x-access-token": "goldapi-9bf9dcfd2c5429df67786cf24e672b4b-io" },
      parse: (data) => {
        return data.price_gram_24k ? data.price_gram_24k * GRAMS_PER_OZ : null;
      }
    },
    {
      name: "goldprice.org",
      url: "https://data-asg.goldprice.org/dbXRates/USD",
      headers: { Accept: "application/json" },
      parse: (data) => {
        const oz = data?.items?.[0]?.xauPrice;
        return typeof oz === "number" && oz > 0 ? oz : null;
      }
    }
  ];

  async function fetchSpot() {
    for (const source of apiSources) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(source.url, {
          headers: source.headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const ozPrice = source.parse(data);
        
        if (ozPrice && ozPrice > 0) {
          spotState.perOz = ozPrice;
          spotState.perGram = ozPrice / GRAMS_PER_OZ;
          spotState.source = source.name;
          spotState.updatedAt = new Date();
          
          emitSpot();
          return;
        }
    }
    if (!spotState.perOz) {
      spotState.perOz = CFG.FALLBACK_USD_PER_OZ;
      spotState.perGram = CFG.FALLBACK_USD_PER_OZ / GRAMS_PER_OZ;
      spotState.source = "fallback";
      spotState.updatedAt = new Date();
      emitSpot();
    }
  }

  fetchSpot();
  setInterval(fetchSpot, 5 * 60 * 1000);

  /* ---------- cart ---------- */
  const CART_KEY = "dky-cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { cart = []; }
  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCartBadge(); renderCartDrawer(); }
  function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

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
  function cartTotalDisplay() {
    const min = cartTotalMin();
    const max = cartTotalMax();
    const hasRange = cart.some(i => i.product.priceType === "range");
    const hasHidden = cart.some(i => i.product.priceType === "hidden");
    
    if (hasHidden) return "Consultar";
    if (hasRange && min !== max) return fmtMoney(min) + " – " + fmtMoney(max);
    return fmtMoney(min);
  }
  function cartAdd(product) {
    const found = cart.find((i) => i.product.id === product.id);
    if (found) found.qty++;
    else cart.push({ product, qty: 1 });
    saveCart();
    openCart();
    return true;
  }
  function cartSetQty(id, qty) {
    if (qty <= 0) cart = cart.filter((i) => i.product.id !== id);
    else cart = cart.map((i) => (i.product.id === id ? { ...i, qty } : i));
    saveCart();
  }
  function cartRemove(id) { cart = cart.filter((i) => i.product.id !== id); saveCart(); }
  function cartClear() { cart = []; saveCart(); }

  function renderCartBadge() {
    const badge = $("#cart-count");
    const c = cartCount();
    if (c > 0) { badge.hidden = false; badge.textContent = c; } else { badge.hidden = true; }
  }

  function openCart() {
    const overlay = $("#cart-overlay");
    const drawer = $("#cart-drawer");
    overlay.removeAttribute('hidden');
    drawer.removeAttribute('hidden');
    document.body.style.overflow = "hidden";
    renderCartDrawer();
  }
  function closeCart() {
    const overlay = $("#cart-overlay");
    const drawer = $("#cart-drawer");
    overlay.setAttribute('hidden', '');
    drawer.setAttribute('hidden', '');
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  $("#cart-btn").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  $("#cart-overlay").addEventListener("click", closeCart);

  function buildCartMessage() {
    const lines = [
      "Hi " + CFG.BUSINESS_NAME + "! I'd like to inquire about the following pieces:",
      "",
      ...cart.map((i, idx) => {
        let priceText = "";
        if (i.product.priceType === "fixed") {
          priceText = fmtMoney(i.product.priceUsd);
        } else if (i.product.priceType === "range") {
          priceText = fmtMoney(i.product.priceMinUsd) + " – " + fmtMoney(i.product.priceMaxUsd);
        } else {
          priceText = "por consultar";
        }
        
        let totalText = "";
        if (i.product.priceType === "fixed") {
          totalText = fmtMoney(i.product.priceUsd * i.qty);
        } else if (i.product.priceType === "range") {
          const minTotal = i.product.priceMinUsd * i.qty;
          const maxTotal = i.product.priceMaxUsd * i.qty;
          totalText = fmtMoney(minTotal) + " – " + fmtMoney(maxTotal);
        } else {
          totalText = "por consultar";
        }
        
        return (idx + 1) + ". " + i.product.name + " (" + i.product.karat + "k, " + i.product.weightGrams + "g) — qty " + i.qty +
          " — " + priceText + " (approx. total: " + totalText + ")";
      }),
      "",
      "Overall estimated total: " + cartTotalDisplay(),
      "",
      "Could you confirm availability and final price?",
    ];
    return lines.join("\n");
  }

  function renderCartDrawer() {
    const body = $("#cart-body");
    const foot = $("#cart-footer");
    if (cart.length === 0) {
      body.innerHTML = '<div class="empty"><p>Your selection is empty.</p><p class="small">Add a piece from the shop.</p></div>';
      foot.hidden = true;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.map((i) => `
      <div class="cart-item">
        <img src="${escape(i.product.image)}" alt="${escape(i.product.name)}" />
        <div class="info">
          <div class="info-top">
            <div>
              <div class="name">${escape(i.product.name)}</div>
              <div class="meta">${i.product.karat}k · ${i.product.weightGrams}g</div>
              ${i.product.priceType !== "fixed" ? `<div class="meta" style="color: var(--gold-bright); font-size: 10px;">${i.product.priceType === "range" ? "Estimated price" : "Check price"}</div>` : ''}
            </div>
            <button type="button" class="remove" data-remove="${escape(i.product.id)}" aria-label="Remove">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <div class="controls">
            <div class="qty">
              <button type="button" data-dec="${escape(i.product.id)}" aria-label="Decrease">−</button>
              <span>${i.qty}</span>
              <button type="button" data-inc="${escape(i.product.id)}" aria-label="Increase">+</button>
            </div>
            <span class="item-price">${(function() {
              if (i.product.priceType === "fixed") {
                return fmtMoney(i.product.priceUsd * i.qty);
              } else if (i.product.priceType === "range") {
                const minTotal = i.product.priceMinUsd * i.qty;
                const maxTotal = i.product.priceMaxUsd * i.qty;
                if (minTotal === maxTotal) return fmtMoney(minTotal);
                return fmtMoney(minTotal) + " – " + fmtMoney(maxTotal);
              } else {
                return "Consultar";
              }
            })()}</span>
          </div>
        </div>
      </div>
    `).join("");
    
    foot.hidden = false;
    foot.innerHTML = `
      <div class="drawer-total">
        <span class="l">Approximate total</span>
        <span class="v gold-text">${cartTotalDisplay()}</span>
      </div>
      <p class="note">Final price confirmed by WhatsApp. ${cart.some(i => i.product.priceType === "range") ? "Items with range pricing show min–max estimate." : ""}</p>
      <a class="btn-primary" href="${whatsappLink(buildCartMessage())}" target="_blank" rel="noopener noreferrer" style="width:100%;">
        💬 Inquire on WhatsApp
      </a>
      <button type="button" class="clear" id="cart-clear">Clear selection</button>
    `;
  
    $$("[data-inc]", foot).forEach(() => {});
    body.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => cartRemove(b.dataset.remove)));
    body.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => {
      const it = cart.find((i) => i.product.id === b.dataset.inc); if (it) cartSetQty(it.product.id, it.qty + 1);
    }));
    body.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => {
      const it = cart.find((i) => i.product.id === b.dataset.dec); if (it) cartSetQty(it.product.id, it.qty - 1);
    }));
    $("#cart-clear").addEventListener("click", cartClear);
  }
  renderCartBadge();
  renderCartDrawer();

  /* ---------- spot ticker (used in hero & sell-gold) ---------- */
  function tickerHTML() {
    return `
      <span class="dot"></span>
      <span class="label">Live spot</span>
      <span class="price" id="ticker-price">…</span>
    `;
  }
  function bindTicker() {
    return onSpot((s) => {
      const el = $("#ticker-price");
      if (el && s.perGram != null) {
        el.textContent = fmtMoney2(s.perGram) + "/g";
      }
    });
  }

  /* ============================================================
     ROUTER (hash-based — works on any host, no server config)
     ============================================================ */
  const routes = {
    "/": renderHome,
    "/shop": renderShop,
    "/sell-gold": renderSellGold,
  };

  function navigate() {
    const hash = window.location.hash.replace(/^#/, "") || "/";
    const [path, ...rest] = hash.split("/").filter(Boolean);
    let dispose = null;
    if (!path) dispose = renderHome();
    else if (path === "shop" && rest.length === 0) dispose = renderShop();
    else if (path === "shop" && rest.length === 1) dispose = renderProduct(rest[0]);
    else if (path === "sell-gold") dispose = renderSellGold();
    else dispose = renderNotFound();

    // active nav state
    $$("#main-nav a").forEach((a) => {
      const target = a.dataset.route;
      a.classList.toggle("active", target === "/" + (path || ""));
    });

    window.scrollTo({ top: 0, behavior: "instant" });
    // store dispose so we can call it next time
    window._dkyDispose = dispose;
  }

  let pageDispose = null;
  function renderPage(fn) {
    if (pageDispose) { try { pageDispose(); } catch (e) {} pageDispose = null; }
    pageDispose = fn();
  }

  /* ---------- HOME ---------- */
  function renderHome() {
    document.title = "DKY Jewelry — Fine Gold & Live Buy-Back";
    $("#app").innerHTML = `
      <section class="hero">
        <div class="container">
          <div class="hero-frame">
            <div class="hero-inner">
              <span class="pill">✦ Premium gold house</span>
              <h1>
                <span class="gold-text">DKY</span> Jewelry.<br />
                <span style="color: color-mix(in oklab, var(--foreground) 90%, transparent);">Real gold. Real value.</span>
              </h1>
              <p class="lead">A modern boutique for fine gold jewelry — and a transparent buyer of your gold at live international rates.</p>
              <div class="spot-ticker">${tickerHTML()}</div>
              <div class="hero-cta">
                <a href="#/shop" class="btn-primary">Enter the Shop ↗</a>
                <a href="#/sell-gold" class="btn-secondary">Sell Your Gold</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="kpis">
        <div class="container">
          <div class="kpis-grid">
            ${[
              { k: "90–92%", l: "Of live spot price, paid for your gold." },
              { k: "10k–24k", l: "We accept all karats. Solid or semi-solid." },
              { k: "5 min", l: "Spot price refreshes from the international market." },
            ].map((c) => `
              <div class="card kpi">
                <div class="num gold-text">${c.k}</div>
                <p class="muted small" style="margin-top:12px;">${c.l}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <section class="showcase">
        <div class="container">
          <div class="showcase-frame">
            <div class="showcase-grid">
              <img src="assets/hero-jewelry.jpg" alt="" />
              <div class="showcase-content">
                <h2>Two ways to work with us.</h2>
                <p class="muted" style="margin-top:12px;">Both transparent. Both tied to the live international gold market.</p>
                <div class="showcase-list">
                  <a class="showcase-link" href="#/shop">
                    <span><strong>Shop our jewelry</strong><span class="sub">Browse, add to cart, checkout via WhatsApp.</span></span>
                    <span style="color:var(--gold-bright);">↗</span>
                  </a>
                  <a class="showcase-link" href="#/sell-gold">
                    <span><strong>Sell your gold</strong><span class="sub">Live calculator. 90–92% of spot. Paid same day.</span></span>
                    <span style="color:var(--gold-bright);">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    return bindTicker();
  }

  /* ---------- SHOP ---------- */
  function renderShop() {
    document.title = "Shop Fine Gold Jewelry — DKY Jewelry";
    let activeCat = "All";
    let justAdded = null;
    const cats = ["All", "Necklaces", "Rings", "Earrings", "Bracelets"];

    function paint() {
      const filtered = activeCat === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCat);
      $("#shop-app").innerHTML = `
        <div class="cat-filter">
          ${cats.map((c) => {
            const count = c === "All" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c).length;
            return `<button type="button" class="cat-btn ${c === activeCat ? "active" : ""}" data-cat="${c}">
              ${c} <span class="count">${count}</span>
            </button>`;
          }).join("")}
        </div>
        ${filtered.length === 0
          ? '<p class="muted" style="text-align:center;padding:80px 0;">No pieces in this category yet.</p>'
          : `<div class="products-grid">${filtered.map((p) => {
              const canAdd = canAddToCart(p);
              return `
                <div class="product-card">
                  <a href="#/shop/${p.id}" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%;">
                    <div class="product-img">
                      <img src="${p.image}" alt="${escape(p.name)}" loading="lazy" />
                      <span class="karat-tag">${p.karat}k</span>
                    </div>
                    <div class="product-body" style="display: flex; flex-direction: column; flex: 1;">
                      <div style="flex: 1;">
                        <p class="product-cat">${p.category}</p>
                        <h3 class="product-name">${escape(p.name)}</h3>
                        <p class="product-desc">${escape(p.shortDesc)}</p>
                      </div>
                      <div style="margin-top: auto;">
                        <div class="product-row">
                          <span class="product-price">${p.priceType === "hidden" ? "To be confirmed" : getProductDisplayPrice(p)}</span>
                          <span class="product-view">View ↗</span>
                        </div>
                        ${canAdd ? `
                          <button type="button" class="add-btn ${justAdded === p.id ? "added" : ""}" data-add="${p.id}" style="width: 100%; margin-top: 12px;">
                            ${justAdded === p.id ? "✓ Added" : "🛍 Add to cart"}
                          </button>
                        ` : `
                          <button type="button" class="whatsapp-inquiry" data-wa="${p.id}" style="width: 100%; margin-top: 12px;">
                            💬 Inquire on WhatsApp
                          </button>
                        `}
                      </div>
                    </div>
                  </a>
                </div>
              `;
            }).join("")}</div>`}
      `;

      $$("#shop-app .cat-btn").forEach((b) => b.addEventListener("click", () => {
        activeCat = b.dataset.cat; paint();
      }));
      
      $$("#shop-app [data-add]").forEach((b) => b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const p = PRODUCTS.find((x) => x.id === b.dataset.add);
        if (p) {
          cartAdd(p);
          justAdded = p.id;
          paint();
          setTimeout(() => { if (justAdded === p.id) { justAdded = null; paint(); } }, 1400);
        }
      }));
      
      $$("#shop-app [data-wa]").forEach((b) => b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const p = PRODUCTS.find((x) => x.id === b.dataset.wa);
        if (p) {
          window.open(whatsappLink("Hi " + CFG.BUSINESS_NAME + "! I'm interested in " + p.name + ". Could you share the price and details?"), "_blank");
        }
      }));
    }

    $("#app").innerHTML = `
      <section class="shop">
        <div class="container">
          <header class="shop-head">
            <span class="pill">The Collection</span>
            <h1>Fine gold jewelry, made to last.</h1>
            <p>Each piece is hallmarked, weighed and certified. Add anything you like to your selection — we'll confirm availability and final pricing on WhatsApp.</p>
          </header>
          <div id="shop-app"></div>
        </div>
      </section>
    `;
    paint();
    return null;
  }

  /* ---------- PRODUCT DETAIL ---------- */
  function renderProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return renderNotFound();
    document.title = p.name + " — DKY Jewelry";
    let added = false;
    const related = PRODUCTS.filter((x) => x.id !== p.id).slice(0, 3);

    function paint() {
      $("#app").innerHTML = `
        <section class="product-page">
          <div class="container">
            <a class="back-link" href="#/shop">← Back to shop</a>
            <div class="pp-grid">
              <div class="pp-img-frame">
                <img src="${p.image}" alt="${escape(p.name)}" />
              </div>
              <div class="pp-info">
                <p class="pp-cat">${p.category}</p>
                <h1>${escape(p.name)}</h1>
                <p class="pp-desc">${escape(p.description)}</p>
                <div class="pp-price-row">
                  <span class="pp-price gold-text">${getProductDisplayPrice(p)}</span>
                  <span class="pp-meta">${p.karat}k · ${p.weightGrams}g</span>
                </div>
                ${canAddToCart(p) ? `
                  <button type="button" class="btn-primary pp-add" id="pp-add">
                    ${added ? "✓ Added to selection" : "🛍 Add to selection"}
                  </button>
                ` : `
                  <a href="${whatsappLink("Hi " + CFG.BUSINESS_NAME + "! I'm interested in " + p.name + ". Could you share the price and details?")}" 
                    target="_blank" rel="noopener noreferrer" 
                    class="btn-primary pp-add" style="background: color-mix(in oklab, var(--gold-deep) 30%, transparent); color: var(--gold-bright); display: inline-flex; gap: 8px; text-decoration: none;">
                    💬 Inquire on WhatsApp
                  </a>
                `}
                <div class="card details-card">
                  <h2>Details</h2>
                  <ul>
                    ${p.details.map((d) => `<li>${escape(d)}</li>`).join("")}
                  </ul>
                </div>
              </div>
            </div>

            <section class="related">
              <h2>You may also like</h2>
              <div class="related-grid">
                ${related.map((r) => `
                  <a class="product-card" href="#/shop/${r.id}">
                    <div class="product-img">
                      <img src="${r.image}" alt="${escape(r.name)}" loading="lazy" />
                    </div>
                    <div class="product-body">
                      <p class="product-name">${escape(r.name)}</p>
                      <p class="product-price" style="font-size:14px;">${getProductDisplayPrice(r)}</p>
                    </div>
                  </a>
                `).join("")}
              </div>
            </section>
          </div>
        </section>
      `;
      
      if (canAddToCart(p)) {
        $("#pp-add").addEventListener("click", () => {
          cartAdd(p); added = true; paint();
          setTimeout(() => { added = false; paint(); }, 1500);
        });
      }
    }
    paint();
    return null;
  }

  /* ---------- SELL GOLD ---------- */
  const PURITY = { 10: 0.4167, 14: 0.5833, 18: 0.75, 22: 0.9167, 24: 1 };
  const KARATS = [10, 14, 18, 22, 24];

  function renderSellGold() {
    document.title = "Sell Your Gold — DKY Jewelry";
    let karat = 18;
    let weight = 10;
    let form = "solid";
    let condition = "new";

    $("#app").innerHTML = `
      <section class="sell">
        <div class="container">
          <header class="sell-head">
            <span class="pill">⚖ Live buy-back calculator</span>
            <h1>Sell your gold. Fair, fast, transparent.</h1>
            <p>We pay <strong style="color:var(--foreground);">90–92%</strong> of the live international spot price. The estimate updates as you type — final price confirmed in person.</p>
            <div class="spot-ticker" style="margin-top:20px;">${tickerHTML()}</div>
          </header>

          <div class="chart" id="chart-root">
            <div class="chart-head">
              <div>
                <p class="meta"><span class="dot"></span> Gold spot · USD / gram · LIVE</p>
                <div class="chart-price-row">
                  <span class="chart-price gold-text" id="chart-price">$—</span>
                  <span class="chart-change up" id="chart-change">+0.00 (0.00%)</span>
                </div>
                <p class="chart-time" id="chart-time"></p>
              </div>
            </div>
            <svg id="chart-svg" viewBox="0 0 720 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="var(--gold-bright)" stop-opacity="0.55" />
                  <stop offset="60%" stop-color="var(--gold-bright)" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="var(--gold-bright)" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="goldStroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stop-color="var(--gold-deep)" />
                  <stop offset="100%" stop-color="var(--gold-bright)" />
                </linearGradient>
              </defs>
              <g id="chart-content"></g>
            </svg>
            <div class="chart-stats" id="chart-stats"></div>
            <p class="chart-foot" id="chart-foot">Hover the chart for details</p>
          </div>

          <div class="calc-grid">
            <div class="calc-panel">
              <div>
                <label class="field-label">Karat</label>
                <div class="karat-row" id="karat-row">
                  ${KARATS.map((k) => `<button type="button" class="karat-btn ${k === karat ? "active" : ""}" data-k="${k}">${k}k</button>`).join("")}
                </div>
                <p class="purity-note" id="purity-note">Purity: ${(PURITY[karat] * 100).toFixed(1)}% pure gold</p>
              </div>

              <div>
                <label class="field-label" for="weight">Weight (grams)</label>
                <div class="weight-row">
                  <input id="weight" class="weight-input" type="number" inputmode="decimal" min="0" step="0.1" value="${weight}" placeholder="0.0" />
                  <span class="unit">grams</span>
                </div>
              </div>

              <div>
                <label class="field-label">Form</label>
                <div class="toggle-pill" id="form-row">
                  <button type="button" class="${form === "solid" ? "active" : ""}" data-f="solid">solid</button>
                  <button type="button" class="${form === "semi-solid" ? "active" : ""}" data-f="semi-solid">semi-solid</button>
                </div>
              </div>

              <div>
                <label class="field-label">Condition</label>
                <div class="toggle-pill" id="cond-row">
                  <button type="button" class="${condition === "new" ? "active" : ""}" data-c="new">new</button>
                  <button type="button" class="${condition === "old" ? "active" : ""}" data-c="old">old</button>
                </div>
              </div>

              <div class="info-callout">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>Semi-solid and older pieces sit closer to the lower end of the 90–92% range due to wear and refining loss.</span>
              </div>
            </div>

            <aside class="quote-panel">
              <p class="quote-label">Estimated payout</p>
              <div class="quote-amount">
                <span class="v gold-text" id="payout-min">$—</span>
                <span class="sep">–</span>
                <span class="v gold-text" id="payout-max">$—</span>
                <span class="ccy">USD</span>
              </div>
              <ul class="quote-list">
                <li><span>Pure gold content</span><span id="pure-grams">— g</span></li>
                <li><span>Spot value</span><span id="spot-value">$—</span></li>
                <li><span>Buy-back rate</span><span id="rate">90–92%</span></li>
              </ul>
              <a class="btn-primary quote-cta" id="quote-cta" href="#" target="_blank" rel="noopener noreferrer">
                💬 Get exact quote on WhatsApp
              </a>
              <p class="quote-foot">Final offer confirmed after physical inspection.</p>
            </aside>
          </div>
        </div>
      </section>
    `;

    function recalc() {
      const purity = PURITY[karat];
      const pureGrams = weight * purity;
      const spot = spotState.perGram || 0;
      const goldValue = pureGrams * spot;
      let minPct = CFG.BUYBACK_MIN_PCT;
      let maxPct = CFG.BUYBACK_MAX_PCT;
      if (form === "semi-solid") maxPct = Math.max(minPct, maxPct - 0.01);
      if (condition === "old") maxPct = Math.max(minPct, maxPct - 0.01);
      const minPay = goldValue * minPct;
      const maxPay = goldValue * maxPct;

      $("#payout-min").textContent = fmtMoney(minPay);
      $("#payout-max").textContent = fmtMoney(maxPay);
      $("#pure-grams").textContent = pureGrams.toFixed(2) + " g";
      $("#spot-value").textContent = fmtMoney2(goldValue);
      $("#rate").textContent = (minPct * 100).toFixed(0) + "–" + (maxPct * 100).toFixed(0) + "%";

      const msg = "Hi " + CFG.BUSINESS_NAME + "! I'd like a quote to sell:\n" +
        "• Karat: " + karat + "k\n" +
        "• Weight: " + weight + "g\n" +
        "• Form: " + form + "\n" +
        "• Condition: " + condition + "\n\n" +
        "Estimated payout: " + fmtMoney(minPay) + " – " + fmtMoney(maxPay) + " USD (based on live spot " + fmtMoney2(spot) + "/g).\n\n" +
        "When can I bring it in?";
      $("#quote-cta").href = whatsappLink(msg);
    }

    // Bindings
    $$("#karat-row .karat-btn").forEach((b) => b.addEventListener("click", () => {
      karat = Number(b.dataset.k);
      $$("#karat-row .karat-btn").forEach((x) => x.classList.toggle("active", Number(x.dataset.k) === karat));
      $("#purity-note").textContent = "Purity: " + (PURITY[karat] * 100).toFixed(1) + "% pure gold";
      recalc();
    }));
    $("#weight").addEventListener("input", (e) => {
      weight = Math.max(0, Number(e.target.value) || 0);
      recalc();
    });
    $$("#form-row button").forEach((b) => b.addEventListener("click", () => {
      form = b.dataset.f;
      $$("#form-row button").forEach((x) => x.classList.toggle("active", x.dataset.f === form));
      recalc();
    }));
    $$("#cond-row button").forEach((b) => b.addEventListener("click", () => {
      condition = b.dataset.c;
      $$("#cond-row button").forEach((x) => x.classList.toggle("active", x.dataset.c === condition));
      recalc();
    }));

    const off = onSpot(() => recalc());
    const offChart = setupChart();
    return () => { off(); offChart(); };
  }

  /* ---------- INTERACTIVE CHART ---------- */
  function setupChart() {
    const STORAGE = "dky-chart-history-v1";
    const MAX = 500;
    let history = [];
    try { history = JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch (e) { history = []; }
    let hover = null;

    // Solo rango de 1 hora (60 minutos)
    const RANGE_MS = 60 * 60 * 1000;
    const W = 720, H = 240, PAD_X = 12, PAD_Y = 28;

    const off = onSpot((s) => {
      if (s.perGram == null || !s.updatedAt) return;
      if (history.length === 0) {
        const now = Date.now(); let v = s.perGram * (1 - 0.018);
        for (let i = 144; i > 0; i--) {
          v += (Math.random() - 0.48) * (s.perGram * 0.0018);
          history.push({ t: now - i * 10 * 60000, v });
        }
        history.push({ t: now, v: s.perGram });
      } else {
        const last = history[history.length - 1];
        if (!last || Math.abs(last.v - s.perGram) >= 0.0001 || s.updatedAt.getTime() - last.t >= 30000) {
          history.push({ t: s.updatedAt.getTime(), v: s.perGram });
          if (history.length > MAX) history = history.slice(-MAX);
        }
      }
      try { localStorage.setItem(STORAGE, JSON.stringify(history)); } catch (e) {}
      paint();
    });

    function filtered() {
      const now = Date.now();
      return history.filter((p) => now - p.t <= RANGE_MS);
    }

    function fmtTime(t) {
      const d = new Date(t);
      const sameDay = new Date().toDateString() === d.toDateString();
      return sameDay
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function paint() {
      const data = filtered();
      const content = $("#chart-content");
      const stats = $("#chart-stats");
      if (!content) return;
      if (data.length < 2) {
        content.innerHTML = '<text x="360" y="120" text-anchor="middle" fill="currentColor" opacity="0.5" font-size="12">Loading live chart…</text>';
        return;
      }
      const values = data.map((p) => p.v);
      const min = Math.min(...values), max = Math.max(...values);
      const range01 = Math.max(max - min, 0.0001);
      const padded = range01 * 0.18;
      const yMin = min - padded, yMax = max + padded, yRange = yMax - yMin;
      const xStep = (W - PAD_X * 2) / Math.max(data.length - 1, 1);
      const points = data.map((p, i) => ({
        x: PAD_X + i * xStep,
        y: PAD_Y + (1 - (p.v - yMin) / yRange) * (H - PAD_Y * 2),
        v: p.v, t: p.t,
      }));
      const path = points.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
      const last = points[points.length - 1];
      const area = path + " L" + last.x.toFixed(2) + "," + (H - PAD_Y) + " L" + points[0].x.toFixed(2) + "," + (H - PAD_Y) + " Z";
      const minIdx = values.indexOf(min), maxIdx = values.indexOf(max);

      const first = data[0].v, lastV = data[data.length - 1].v;
      const change = lastV - first;
      const changePct = (change / first) * 100;
      const up = change >= 0;

      const displayV = hover ? hover.v : lastV;
      const dChange = displayV - first;
      const dPct = (dChange / first) * 100;
      const dUp = dChange >= 0;

      $("#chart-price").textContent = fmtMoney2(displayV);
      const changeEl = $("#chart-change");
      changeEl.className = "chart-change " + (dUp ? "up" : "down");
      changeEl.textContent = (dUp ? "▲ " : "▼ ") + Math.abs(dChange).toFixed(2) + " (" + dPct.toFixed(2) + "%)";
      $("#chart-time").textContent = hover ? fmtTime(hover.t) : "";

      let svg = "";
      // grid
      [0.2, 0.4, 0.6, 0.8].forEach((r) => {
        const y = PAD_Y + r * (H - PAD_Y * 2);
        svg += `<line x1="${PAD_X}" x2="${W - PAD_X}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity="0.07" stroke-dasharray="3 5" />`;
      });
      svg += `<path d="${area}" fill="url(#goldFill)" />`;
      svg += `<path d="${path}" fill="none" stroke="url(#goldStroke)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />`;
      // high marker
      svg += `<line x1="${points[maxIdx].x}" x2="${points[maxIdx].x}" y1="${points[maxIdx].y - 4}" y2="${points[maxIdx].y - 16}" stroke="var(--gold-bright)" stroke-opacity="0.5" stroke-dasharray="2 2" />`;
      svg += `<text x="${points[maxIdx].x}" y="${points[maxIdx].y - 20}" text-anchor="middle" fill="var(--emerald)" font-family="ui-monospace,SFMono-Regular,monospace" font-size="10" font-weight="700">▲ ${fmtMoney2(max)}</text>`;
      // low marker
      svg += `<line x1="${points[minIdx].x}" x2="${points[minIdx].x}" y1="${points[minIdx].y + 4}" y2="${points[minIdx].y + 16}" stroke="var(--gold-deep)" stroke-opacity="0.5" stroke-dasharray="2 2" />`;
      svg += `<text x="${points[minIdx].x}" y="${points[minIdx].y + 26}" text-anchor="middle" fill="var(--rose)" font-family="ui-monospace,SFMono-Regular,monospace" font-size="10" font-weight="700">▼ ${fmtMoney2(min)}</text>`;
      // pulse
      svg += `<circle cx="${last.x}" cy="${last.y}" r="4" fill="var(--gold-bright)" />`;
      svg += `<circle cx="${last.x}" cy="${last.y}" r="8" fill="var(--gold-bright)" opacity="0.3"><animate attributeName="r" values="6;14;6" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite"/></circle>`;
      // hover crosshair
      if (hover) {
        svg += `<line x1="${hover.x}" x2="${hover.x}" y1="${PAD_Y}" y2="${H - PAD_Y}" stroke="var(--gold-bright)" stroke-opacity="0.5" stroke-dasharray="3 3"/>`;
        svg += `<line x1="${PAD_X}" x2="${W - PAD_X}" y1="${hover.y}" y2="${hover.y}" stroke="var(--gold-bright)" stroke-opacity="0.3" stroke-dasharray="3 3"/>`;
        svg += `<circle cx="${hover.x}" cy="${hover.y}" r="5" fill="var(--gold-bright)" stroke="var(--background)" stroke-width="2"/>`;
      }
      content.innerHTML = svg;

      // hover events
      const svgEl = $("#chart-svg");
      svgEl.onmousemove = (e) => {
        const rect = svgEl.getBoundingClientRect();
        const xPx = ((e.clientX - rect.left) / rect.width) * W;
        let nearest = points[0], best = Math.abs(points[0].x - xPx);
        for (const p of points) { const d = Math.abs(p.x - xPx); if (d < best) { best = d; nearest = p; } }
        hover = nearest; paint();
      };
      svgEl.onmouseleave = () => { hover = null; paint(); };

      // stats
      stats.innerHTML = [
        { l: "Open", v: fmtMoney2(first) },
        { l: "High", v: fmtMoney2(max), c: "var(--emerald)" },
        { l: "Low", v: fmtMoney2(min), c: "var(--rose)" },
        { l: "Change", v: (up ? "+" : "") + changePct.toFixed(2) + "%", c: up ? "var(--emerald)" : "var(--rose)" },
      ].map((s) => `
        <div class="chart-stat">
          <div class="l">${s.l}</div>
          <div class="v" style="${s.c ? "color:" + s.c : ""}">${s.v}</div>
        </div>
      `).join("");

      const upd = spotState.updatedAt ? spotState.updatedAt.toLocaleTimeString() : "—";
      $("#chart-foot").innerHTML = "Source: " + spotState.source + " · Updated " + upd + " · Last hour · Hover for details";
    }

    paint();
    return () => { off(); };
  }

  /* ---------- 404 ---------- */
  function renderNotFound() {
    document.title = "Not found — DKY Jewelry";
    $("#app").innerHTML = `
      <section class="container" style="padding:120px 20px;text-align:center;">
        <h1 style="font-size:64px;font-weight:700;">404</h1>
        <p class="muted" style="margin-top:8px;">This page doesn't exist.</p>
        <a class="btn-primary" href="#/" style="margin-top:24px;">Go home</a>
      </section>
    `;
    return null;
  }

  /* ---------- start ---------- */
  function route() {
    const hash = window.location.hash.replace(/^#/, "") || "/";
    const parts = hash.split("/").filter(Boolean);
    let render;
    if (parts.length === 0) render = renderHome;
    else if (parts[0] === "shop" && parts.length === 1) render = renderShop;
    else if (parts[0] === "shop" && parts.length === 2) render = () => renderProduct(parts[1]);
    else if (parts[0] === "sell-gold") render = renderSellGold;
    else render = renderNotFound;

    // active nav
    $$("#main-nav a").forEach((a) => {
      a.classList.toggle("active", a.dataset.route === ("/" + (parts[0] || "")));
    });

    renderPage(render);
    window.scrollTo({ top: 0 });
  }

  window.addEventListener("hashchange", route);
  $("#year").textContent = new Date().getFullYear();
  route();
})();
