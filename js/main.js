(function() {
  "use strict";

  function init() {

    
    if (window.DKYTheme) window.DKYTheme.init();
    
    if (window.DKYI18n) window.DKYI18n.init();
    
    if (window.DKYProducts) window.DKYProducts.init();

    if (window.DKYSpot) window.DKYSpot.init();
    
    if (window.DKYCart) window.DKYCart.init();
    
    if (window.DKYRouter) window.DKYRouter.init();
  }

  function getProductText(product, field, lang) {
    if (!product[field]) return "";
    if (typeof product[field] === 'object') {
      return product[field][lang] || product[field]['es'];
    }
    return product[field];
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();