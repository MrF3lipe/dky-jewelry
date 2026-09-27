window.DKYHome = (function() {
  "use strict";
  function render() {
    const t = key => window.DKYI18n.t(key);
    const app = document.getElementById("app");
    const cfg = window.DKY_CONFIG;
    const contact = `https://wa.me/${encodeURIComponent(cfg.WHATSAPP_NUMBER)}?text=${encodeURIComponent(t("home_contact_message"))}`;
    app.innerHTML = `
      <section class="home-hero container">
        <div class="hero-copy">
          <p class="eyebrow">DKY JEWELRY · ${t("fine_gold")}</p>
          <h1>${t("home_title")}<br><em>${t("home_title_end")}</em></h1>
          <p class="hero-description">${t("home_description")}</p>
          <div class="hero-cta">
            <a href="/shop" class="btn-primary">${t("explore_collection")} <span aria-hidden="true">↗</span></a>
            <a href="/sell-gold" class="text-link">${t("sell_gold")} <span aria-hidden="true">→</span></a>
          </div>
          <div class="hero-signature"><span class="signature-line"></span><span>${t("footer_tagline")}</span></div>
        </div>
        <figure class="hero-photo">
          <img src="assets/dky-jewelry-experience.jpg" width="1200" height="1000" alt="${t("hero_image_alt")}" fetchpriority="high">
          <figcaption><span>THE GOLD EDIT</span><span>14k · 18k · 22k</span></figcaption>
        </figure>
      </section>
      <div class="service-strip">
        <div class="container service-strip-inner">
          <span>${t("home_service_gold")}</span><span>${t("home_service_attention")}</span>
          <a href="/sell-gold" class="spot-ticker">${window.DKYSpot.tickerHTML()}</a>
        </div>
      </div>
      <section class="home-paths container">
        <div class="section-heading"><h2>${t("home_paths_title")}</h2><p>${t("home_paths_desc")}</p></div>
        <div class="home-paths-grid">
          <a href="/shop" class="collection-story">
            <img src="assets/products/chain-necklace.jpg" width="800" height="800" alt="${t("collection_image_alt")}" loading="lazy">
            <div><span class="eyebrow">${t("collection_title")}</span><h3>${t("home_collection_title")}</h3><span class="story-link">${t("explore_collection")} <span aria-hidden="true">↗</span></span></div>
          </a>
          <div class="sell-story">
            <span class="eyebrow">${t("sell_gold")}</span>
            <h3>${t("home_sell_title")}</h3>
            <p>${t("home_sell_desc")}</p>
            <a href="/sell-gold" class="text-link">${t("calculate_gold")} <span aria-hidden="true">↗</span></a>
            <p class="story-note">${t("final_offer_note")}</p>
          </div>
        </div>
      </section>
      <section class="home-gallery container" aria-labelledby="home-gallery-title">
        <div class="home-gallery-heading"><div><p class="eyebrow">${t("home_gallery_eyebrow")}</p><h2 id="home-gallery-title">${t("home_gallery_title")}</h2></div><p>${t("home_gallery_desc")}</p></div>
        <div class="home-gallery-grid">
          <figure class="home-gallery-wide"><img src="assets/dky-shopping-moments.jpg" width="1200" height="800" alt="${t("home_gallery_shopping_alt")}" loading="lazy"></figure>
          <figure><img src="assets/dky-city-style.jpg" width="1000" height="1200" alt="${t("home_gallery_city_alt")}" loading="lazy"></figure>
          <figure><img src="assets/dky-family-moment.jpg" width="1000" height="1200" alt="${t("home_gallery_family_alt")}" loading="lazy"></figure>
        </div>
      </section>
      <section class="home-service container">
        <div><p class="eyebrow">${t("home_service_eyebrow")}</p><h2>${t("home_service_title")}</h2></div>
        <div><p>${t("home_service_desc")}</p><a href="${contact}" target="_blank" rel="noopener noreferrer" class="text-link">${t("inquire_whatsapp")} <span aria-hidden="true">↗</span></a></div>
      </section>`;
    return window.DKYSpot.bindTicker();
  }
  return { render };
})();
