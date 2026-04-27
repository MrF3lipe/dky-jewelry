window.DKYHome = (function() {
  "use strict";
  
  function render() {
    const i18n = window.DKYI18n;
    const spot = window.DKYSpot;
    const t = (key) => i18n ? i18n.t(key) : key;
    
    const app = document.getElementById("app");
    if (!app) return;
    
    app.innerHTML = `
      <section class="hero">
        <div class="container">
          <div class="hero-frame">
            <div class="hero-inner">
              <span class="pill">✦ ${t("shop_jewelry")}</span>
              <h1>
                <span class="gold-text">DKY</span> ${t("gold_text_line2")}<br />
                <span style="color: color-mix(in oklab, var(--foreground) 90%, transparent);">${t("real_gold_real_value")}</span>
              </h1>
              <p class="lead">${t("hero_desc")}</p>
              <div class="spot-ticker">${spot ? spot.tickerHTML() : ''}</div>
              <div class="hero-cta">
                <a href="#/shop" class="btn-primary">${t("enter_shop")}</a>
                <a href="#/sell-gold" class="btn-secondary">${t("sell_gold")}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="kpis">
        <div class="container">
          <div class="kpis-grid">
            <div class="card kpi">
              <div class="num gold-text">${t("kpi1_k")}</div>
              <p class="muted small" style="margin-top:12px;">${t("kpi1_l")}</p>
            </div>
            <div class="card kpi">
              <div class="num gold-text">${t("kpi2_k")}</div>
              <p class="muted small" style="margin-top:12px;">${t("kpi2_l")}</p>
            </div>
            <div class="card kpi">
              <div class="num gold-text">${t("kpi3_k")}</div>
              <p class="muted small" style="margin-top:12px;">${t("kpi3_l")}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="showcase">
        <div class="container">
          <div class="showcase-frame">
            <div class="showcase-grid">
              <img src="assets/hero-jewelry.jpg" alt="" />
              <div class="showcase-content">
                <h2>${t("showcase_title")}</h2>
                <p class="muted" style="margin-top:12px;">${t("showcase_desc")}</p>
                <div class="showcase-list">
                  <a class="showcase-link" href="#/shop">
                    <span><strong>${t("shop_our_jewelry")}</strong><span class="sub">${t("shop_our_jewelry_sub")}</span></span>
                    <span style="color:var(--gold-bright);">↗</span>
                  </a>
                  <a class="showcase-link" href="#/sell-gold">
                    <span><strong>${t("sell_your_gold_showcase")}</strong><span class="sub">${t("sell_your_gold_sub")}</span></span>
                    <span style="color:var(--gold-bright);">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    
    if (spot && spot.bindTicker) {
      spot.bindTicker();
    }
    
    return () => {};
  }
  
  return { render };
})();