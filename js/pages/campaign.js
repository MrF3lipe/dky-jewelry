window.DKYCampaign = (function () {
  "use strict";

  const copy = {
    es: {
      eyebrow: "DKY JEWELRY · UNA CURIOSIDAD BIEN PREMIADA",
      title: "Caíste por", accent: "curioso.", reveal: "No conocemos a Laura.",
      intro: "Pero ahora que llegaste hasta aquí, queremos que conozcas algo que sí es real: las promociones de DKY Jewelry.",
      offer: "de descuento", eligible: "En prendas seleccionadas de esta campaña.",
      code: "TU CÓDIGO ESPECIAL", copy: "Copiar código", copied: "Código copiado.",
      copyError: "No pudimos copiarlo. Puedes seleccionar el código LAURA10 y copiarlo manualmente.",
      explore: "Descubre la selección", image: "Joyas de oro de DKY Jewelry", caption: "Oro real. Una buena sorpresa.",
      selection: "Prendas nuevas", selectionAccent: "con descuento.", selectionIntro: "El código LAURA10 se aplica únicamente a las prendas participantes.",
      emptyTitle: "Consulta las prendas participantes", emptyText: "Estamos preparando la selección de esta campaña. Escríbenos para conocer las piezas disponibles y confirmar cuáles participan antes de comprar.",
      inquire: "Consultar por WhatsApp", productInquire: "Consultar con LAURA10", conditions: "Sobre esta promoción",
      terms: "El 10% de descuento corresponde únicamente a las prendas seleccionadas para esta campaña. Comparte el código LAURA10 al consultar. Nuestro equipo confirmará la disponibilidad, la aplicación del descuento y el precio final antes de tu compra.",
      fictionTitle: "¿Y qué hizo Laura?", fiction: "Laura es un personaje ficticio de esta campaña. No conocemos a Laura: queríamos despertar tu curiosidad y presentarte DKY Jewelry.",
      closing: "Entraste por Laura.", closingAccent: "Quizás salgas con una joya.", shop: "Explora la colección completa",
      generalMessage: "Hola DKY Jewelry. Llegué por la campaña de Laura y tengo el código LAURA10. ¿Cuáles son las prendas participantes con 10% de descuento?",
      productMessage: "Hola DKY Jewelry. Tengo el código LAURA10 y me interesa esta prenda participante: ",
      preownedTitle: "Piezas con historia.", preownedAccent: "Nuevas posibilidades.", preownedIntro: "Tu código también da acceso a una selección privada de joyas usadas. Cada pieza está identificada claramente como usada; no son prendas nuevas.",
      preownedEmptyTitle: "Próximamente: selección de joyas usadas", preownedEmptyText: "Estamos preparando las piezas disponibles. Escríbenos con tu código LAURA10 para conocerlas antes que nadie.", preownedLabel: "Prenda usada · Acceso LAURA10",
      preownedMessage: "Hola DKY Jewelry. Tengo el código LAURA10 y quiero conocer las joyas usadas disponibles."
    },
    en: {
      eyebrow: "DKY JEWELRY · CURIOSITY LOOKS GOOD ON YOU",
      title: "Curiosity brought", accent: "you here.", reveal: "We don't know Laura.",
      intro: "But now that you're here, discover something that is real: the special offers at DKY Jewelry.",
      offer: "off", eligible: "On selected pieces in this campaign.", code: "YOUR SPECIAL CODE", copy: "Copy code", copied: "Code copied.",
      copyError: "We couldn't copy it. Select LAURA10 and copy it manually.", explore: "Discover the selection", image: "Gold jewelry from DKY Jewelry", caption: "Real gold. A lovely surprise.",
      selection: "New pieces", selectionAccent: "with a discount.", selectionIntro: "Code LAURA10 applies only to participating pieces.",
      emptyTitle: "Ask about participating pieces", emptyText: "We're preparing this campaign's selection. Message us to discover the available pieces and confirm which ones participate before purchasing.",
      inquire: "Ask on WhatsApp", productInquire: "Ask with LAURA10", conditions: "About this offer",
      terms: "The 10% discount applies only to pieces selected for this campaign. Share code LAURA10 when you inquire. Our team will confirm availability, the discount and the final price before your purchase.",
      fictionTitle: "So, what did Laura do?", fiction: "Laura is a fictional character in this campaign. We don't know Laura: we wanted to spark your curiosity and introduce you to DKY Jewelry.",
      closing: "You came for Laura.", closingAccent: "You might leave with a jewel.", shop: "Explore the full collection",
      generalMessage: "Hi DKY Jewelry. I found you through the Laura campaign and have code LAURA10. Which participating pieces are available with 10% off?",
      productMessage: "Hi DKY Jewelry. I have code LAURA10 and I'm interested in this participating piece: ",
      preownedTitle: "Pieces with a story.", preownedAccent: "New possibilities.", preownedIntro: "Your code also gives access to a private selection of pre-owned jewelry. Every piece is clearly identified as pre-owned; they are not new pieces.",
      preownedEmptyTitle: "Coming soon: pre-owned jewelry selection", preownedEmptyText: "We are preparing the available pieces. Message us with LAURA10 to discover them first.", preownedLabel: "Pre-owned piece · LAURA10 access",
      preownedMessage: "Hi DKY Jewelry. I have code LAURA10 and would like to see the available pre-owned jewelry."
    }
  };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const whatsapp = message => "https://wa.me/" + encodeURIComponent(window.DKY_CONFIG?.WHATSAPP_NUMBER || "") + "?text=" + encodeURIComponent(message);

  function safeImage(value) {
    const source = String(value || "").trim();
    if (/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
    try { const url = new URL(source, window.location.href); return /^https?:$/.test(url.protocol) ? escape(url.href) : ""; }
    catch { return ""; }
  }

  function render() {
    const app = document.getElementById("app");
    if (!app) return () => {};
    const lang = window.DKYI18n?.getLang() === "en" ? "en" : "es";
    const t = copy[lang];
    const config = window.DKY_CAMPAIGN || {};
    const code = config.code || "LAURA10";
    const discount = Number(config.discountPercent) || 10;
    let disposed = false;

    app.innerHTML = `
      <div class="campaign-page">
        <section class="campaign-hero" aria-labelledby="campaign-title">
          <div class="container campaign-hero-grid">
            <div class="campaign-story">
              <p class="campaign-eyebrow">${t.eyebrow}</p>
              <h1 id="campaign-title">${t.title}<br><em>${t.accent}</em></h1>
              <p class="campaign-reveal">${t.reveal}</p>
              <p class="campaign-intro">${t.intro}</p>
              <div class="campaign-offer"><strong>${escape(discount)}<span>%</span></strong><div><b>${t.offer}</b><p>${t.eligible}</p></div></div>
              <div class="campaign-coupon">
                <div><span>${t.code}</span><strong>${escape(code)}</strong></div>
                <button type="button" class="campaign-copy" id="campaign-copy">${t.copy}<span aria-hidden="true"> ↗</span></button>
              </div>
              <p class="campaign-feedback" id="campaign-feedback" role="status" aria-live="polite"></p>
              <a class="campaign-text-link" id="campaign-explore" href="/laura#campaign-selection">${t.explore} <span aria-hidden="true">↓</span></a>
            </div>
            <figure class="campaign-portrait"><img src="/assets/hero-jewelry.jpg" alt="${t.image}" fetchpriority="high"><figcaption><span>DKY JEWELRY</span>${t.caption}</figcaption></figure>
          </div>
        </section>
        <section class="campaign-selection container" id="campaign-selection" aria-labelledby="campaign-selection-title">
          <div class="campaign-selection-head"><h2 id="campaign-selection-title" tabindex="-1">${t.selection}<br><em>${t.selectionAccent}</em></h2><p>${t.selectionIntro}</p></div>
          <div id="campaign-products"></div>
          <section class="campaign-preowned" aria-labelledby="campaign-preowned-title">
            <div class="campaign-selection-head"><h2 id="campaign-preowned-title">${t.preownedTitle}<br><em>${t.preownedAccent}</em></h2><p>${t.preownedIntro}</p></div>
            <div id="campaign-preowned-products"></div>
          </section>
          <div class="campaign-faq"><details><summary>${t.conditions}<span aria-hidden="true">+</span></summary><p>${t.terms}</p></details><details><summary>${t.fictionTitle}<span aria-hidden="true">+</span></summary><p>${t.fiction}</p></details></div>
        </section>
        <section class="campaign-closing container"><p>${t.closing}<br><em>${t.closingAccent}</em></p><a class="campaign-text-link" href="/shop">${t.shop} <span aria-hidden="true">↗</span></a></section>
      </div>`;

    const productsContainer = document.getElementById("campaign-products");
    const preownedContainer = document.getElementById("campaign-preowned-products");
    function renderProducts(products, ids, container, preowned) {
      if (disposed) return;
      const selectedIds = new Set((Array.isArray(ids) ? ids : []).map(String));
      const selected = (Array.isArray(products) ? products : []).filter(p => selectedIds.has(String(p.id)));
      const emptyTitle = preowned ? t.preownedEmptyTitle : t.emptyTitle;
      const emptyText = preowned ? t.preownedEmptyText : t.emptyText;
      const message = preowned ? t.preownedMessage : t.generalMessage;
      container.innerHTML = selected.length ? `<div class="campaign-products-grid">${selected.map(p => {
        const name = typeof p.name === "object" ? p.name[lang] || p.name.es || "" : p.name;
        const inquiry = preowned ? `${t.preownedMessage} Me interesa: ${name} (ID: ${p.id}).` : `${t.productMessage}${name} (ID: ${p.id}).`;
        const label = preowned ? t.preownedLabel : `${escape(discount)}% ${t.offer}`;
        return `<article class="campaign-product"><a href="/shop/${encodeURIComponent(p.id)}"><div class="campaign-product-photo"><img src="${safeImage(p.image)}" alt="${escape(name)}" loading="lazy"><span>${label}</span></div><h3>${escape(name)}</h3></a><a class="campaign-text-link" href="${escape(whatsapp(inquiry))}" target="_blank" rel="noopener noreferrer">${t.productInquire} <span aria-hidden="true">↗</span></a></article>`;
      }).join("")}</div>` : `<div class="campaign-empty"><span class="campaign-empty-mark" aria-hidden="true">✦</span><div><h3>${emptyTitle}</h3><p>${emptyText}</p><a class="btn-primary" href="${escape(whatsapp(message))}" target="_blank" rel="noopener noreferrer">${t.inquire} <span aria-hidden="true">↗</span></a></div></div>`;
    }
    function renderAll(products) {
      renderProducts(products, config.productIds, productsContainer, false);
      renderProducts(products, config.preownedProductIds, preownedContainer, true);
    }
    renderAll(window.DKY_PRODUCTS);
    const onProducts = event => renderAll(event.detail);
    document.addEventListener("productsLoaded", onProducts);
    const exploreLink = document.getElementById("campaign-explore");
    function exploreSelection(event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      history.replaceState(null, "", "/laura#campaign-selection");
      document.getElementById("campaign-selection").scrollIntoView();
      document.getElementById("campaign-selection-title").focus({ preventScroll: true });
    }
    exploreLink.addEventListener("click", exploreSelection);
    const copyButton = document.getElementById("campaign-copy");
    const feedback = document.getElementById("campaign-feedback");
    async function copyCode() {
      try {
        await navigator.clipboard.writeText(code);
        if (!disposed) feedback.textContent = t.copied;
      } catch (_) {
        if (!disposed) feedback.textContent = t.copyError;
      }
    }
    copyButton.addEventListener("click", copyCode);
    return () => {
      disposed = true;
      document.removeEventListener("productsLoaded", onProducts);
      copyButton.removeEventListener("click", copyCode);
      exploreLink.removeEventListener("click", exploreSelection);
    };
  }
  return { render };
})();
