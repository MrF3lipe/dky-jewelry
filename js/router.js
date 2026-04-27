window.DKYRouter = (function() {
  "use strict";
  
  let currentPageDispose = null;
  
  function disposeCurrentPage() {
    if (currentPageDispose) {
      try { currentPageDispose(); } catch(e) {}
      currentPageDispose = null;
    }
  }
  
  function renderPage(pageFn) {
    disposeCurrentPage();
    currentPageDispose = pageFn();
  }
  
  function navigate() {
    const hash = window.location.hash.replace(/^#/, "") || "/";
    const parts = hash.split("/").filter(Boolean);
    
    let pageFn;
    
    if (parts.length === 0) {
      pageFn = window.DKYHome ? () => window.DKYHome.render() : null;
    } else if (parts[0] === "shop" && parts.length === 1) {
      pageFn = window.DKYShop ? () => window.DKYShop.render() : null;
    } else if (parts[0] === "shop" && parts.length === 2) {
      pageFn = window.DKYProduct ? () => window.DKYProduct.render(parts[1]) : null;
    } else if (parts[0] === "sell-gold") {
      pageFn = window.DKYSell ? () => window.DKYSell.render() : null;
    } else {
      pageFn = window.DKYNotFound ? () => window.DKYNotFound.render() : null;
    }
    
    if (pageFn) {
      renderPage(pageFn);
    } else {
      console.error("Page module not loaded");
    }
    
    document.querySelectorAll("#main-nav a").forEach(a => {
      const route = a.dataset.route;
      a.classList.toggle("active", route === ("/" + (parts[0] || "")));
    });
    
    window.scrollTo({ top: 0 });
  }
  
  function init() {
    window.addEventListener("hashchange", navigate);
    navigate();
    
    window.addEventListener('langchange', () => navigate());
  }
  
  return { init, navigate };
})();