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
    if (pageFn) {
      currentPageDispose = pageFn();
    }
  }
  
  function navigate() {
    const path = window.location.pathname || "/";
    const parts = path.split("/").filter(Boolean);
    
    console.log('Router: navegando a', path, 'parts:', parts);
    
    let pageFn;
    
    if (parts.length === 0) {
      pageFn = window.DKYHome ? () => window.DKYHome.render() : null;
    } else if (parts[0] === "shop" && parts.length === 1) {
      pageFn = window.DKYShop ? () => window.DKYShop.render() : null;
    } else if (parts[0] === "shop" && parts.length === 2) {
      pageFn = window.DKYProduct ? () => window.DKYProduct.render(parts[1]) : null;
    } else if (parts[0] === "sell-gold") {
      pageFn = window.DKYSell ? () => window.DKYSell.render() : null;
    } else if (parts[0] === "login") {
      pageFn = window.DKYLogin ? () => window.DKYLogin.render() : null;
    } else if (parts[0] === "admin") {
      pageFn = window.DKYAdmin ? () => window.DKYAdmin.render() : null;
    } else {
      pageFn = window.DKYNotFound ? () => window.DKYNotFound.render() : null;
    }
    
    renderPage(pageFn);
    
    // Actualizar nav activo
    document.querySelectorAll("#main-nav a").forEach(a => {
      const href = a.getAttribute("href");
      const route = href ? href.split("/").filter(Boolean)[0] : "";
      a.classList.toggle("active", route === parts[0] || (route === undefined && parts.length === 0));
    });
    
    window.scrollTo({ top: 0 });
  }
  
  function init() {
    // Navegación inicial
    navigate();
    
    // Botones atrás/adelante del navegador
    window.addEventListener("popstate", navigate);
    
    // Cambio de idioma
    window.addEventListener('langchange', () => navigate());
    
    // Interceptar TODOS los clicks en enlaces internos
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      
      const href = link.getAttribute("href");
      if (!href) return;
      
      // Ignorar enlaces externos, anclas, WhatsApp, etc.
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.hasAttribute("data-wa") || link.target === "_blank") {
        return;
      }
      
      // Verificar que sea del mismo dominio
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      
      // Prevenir navegación normal y usar history API
      e.preventDefault();
      window.history.pushState(null, "", href);
      navigate();
    });
  }
  
  return { init, navigate };
})();