window.DKYProducts = (function() {
  "use strict";
  
  const API_URL = window.DKY_CONFIG.API_BASE_URL + '/web_products.php';
  
  let products = [];
  
  function normalizeProduct(raw) {
    return {
      id: raw.id,
      image: raw.image || '',
      karat: raw.karat,
      weightGrams: raw.weight,
      name: {
        es: raw.name || 'Sin nombre',
        en: raw.name || 'Unnamed'
      },
      category: raw.category || 'other',
      description: {
        es: '',
        en: ''
      },
      details: {
        es: '',
        en: ''
      },
      shortDesc: {
        es: '',
        en: ''
      },
      priceType: 'fixed',
      priceUsd: raw.price || null,
      priceMinUsd: null,
      priceMaxUsd: null,
    };
  }
  
  async function fetchProducts() {
    try {
      const response = await fetch(API_URL);
      const rawProducts = await response.json();
      products = rawProducts.map(normalizeProduct);
      window.DKY_PRODUCTS = products;
      document.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  }
  
  function getProducts() {
    return products;
  }
  
  function getProductById(id) {
    return products.find(product => product.id === id);
  }
  
  function init() {
    fetchProducts();
  }
  
  return { 
    init,
    getProducts,
    getProductById
  };
})();
