window.DKYNotFound = (function() {
  "use strict";
  
  function render() {
    const i18n = window.DKYI18n;
    const t = (key) => i18n ? i18n.t(key) : key;
    
    const app = document.getElementById("app");
    if (!app) return;
    
    app.innerHTML = `
      <section class="container" style="padding:120px 20px;text-align:center;">
        <h1 style="font-size:64px;font-weight:700;">404</h1>
        <p class="muted" style="margin-top:8px;">${t("empty_cart")}</p>
        <a class="btn-primary" href="#/" style="margin-top:24px;">${t("enter_shop")}</a>
      </section>
    `;
    
    return () => {};
  }
  
  return { render };
})();