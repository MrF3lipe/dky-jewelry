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
        <figure class="hero-photo hero-carousel" aria-label="Galería DKY Jewelry">
          <div class="hero-carousel-track">
            <img class="is-active" src="assets/dky-jewelry-experience.jpg" width="1200" height="1000" alt="${t("hero_image_alt")}" fetchpriority="high">
            <img src="assets/dky-shopping-on-phone.jpg" width="1200" height="1000" alt="Cliente de DKY Jewelry explorando joyas desde su teléfono" loading="lazy">
          </div>
          <div class="hero-carousel-controls"><button type="button" data-hero-prev aria-label="Imagen anterior">←</button><div class="hero-carousel-dots"><button type="button" class="is-active" data-hero-slide="0" aria-label="Ver imagen 1"></button><button type="button" data-hero-slide="1" aria-label="Ver imagen 2"></button></div><button type="button" data-hero-next aria-label="Imagen siguiente">→</button></div>
          <figcaption><span>THE GOLD EDIT</span><span>14k · 18k · 22k</span></figcaption>
        </figure>
      </section>
      <section class="home-paths container">
        <div class="section-heading"><h2>${t("home_paths_title")}</h2><p>${t("home_paths_desc")}</p></div>
        <div class="home-paths-grid">
          <a href="/shop" class="collection-story">
            <img src="assets/dky-shopping-moments.jpg" width="1200" height="800" alt="${t("home_gallery_shopping_alt")}" loading="lazy">
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
      <div class="service-strip">
        <div class="container service-strip-inner">
          <span>${t("home_service_gold")}</span><span>${t("home_service_attention")}</span>
          <a href="/sell-gold" class="spot-ticker">${window.DKYSpot.tickerHTML()}</a>
        </div>
      </div>
      <section class="home-preowned container" aria-labelledby="home-preowned-title">
        <div class="section-heading"><h2 id="home-preowned-title">${t("preowned_title")}</h2><p>${t("preowned_desc")}</p></div>
        <div id="home-preowned-grid" class="products-grid"></div>
        <a class="text-link" href="/segunda-mano">${t("nav_preowned")} <span aria-hidden="true">↗</span></a>
      </section>
      <section class="home-service container">
        <div><p class="eyebrow">${t("home_service_eyebrow")}</p><h2>${t("home_service_title")}</h2></div>
        <div><p>${t("home_service_desc")}</p><a href="${contact}" target="_blank" rel="noopener noreferrer" class="text-link">${t("inquire_whatsapp")} <span aria-hidden="true">↗</span></a></div>
      </section>`;
    const preownedGrid = document.getElementById('home-preowned-grid');
    const renderPreowned = (items) => {
      const products = (Array.isArray(items) ? items : []).filter(product => product.preowned).slice(0, 3);
      preownedGrid.innerHTML = products.length ? products.map(product => `<a class="home-preowned-card" href="/segunda-mano/${encodeURIComponent(product.id)}"><div><img src="${product.image || ''}" alt="${product.name?.es || ''}" loading="lazy"><span>${t('preowned_badge')}</span></div><strong>${product.name?.es || ''}</strong><small>${t('preowned_condition')}: ${t('condition_' + product.conditionGrade)}</small></a>`).join('') : `<p class="muted">${t('preowned_empty')}</p>`;
    };
    renderPreowned(window.DKYProducts?.getProducts());
    const onProducts = event => renderPreowned(event.detail);
    document.addEventListener('productsLoaded', onProducts);
    const disposeTicker = window.DKYSpot.bindTicker();
    const slides = [...app.querySelectorAll('.hero-carousel-track img')];
    const dots = [...app.querySelectorAll('[data-hero-slide]')];
    let activeSlide = 0;
    const showSlide = index => { activeSlide = (index + slides.length) % slides.length; slides.forEach((slide, i) => slide.classList.toggle('is-active', i === activeSlide)); dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeSlide)); };
    const timer = window.setInterval(() => showSlide(activeSlide + 1), 5500);
    app.querySelector('[data-hero-prev]')?.addEventListener('click', () => showSlide(activeSlide - 1));
    app.querySelector('[data-hero-next]')?.addEventListener('click', () => showSlide(activeSlide + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
    return () => { document.removeEventListener('productsLoaded', onProducts); disposeTicker?.(); window.clearInterval(timer); };
  }
  return { render };
})();
