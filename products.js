window.DKYProducts = (function() {
  "use strict";
  
  const API_URL = window.DKY_CONFIG.API_BASE_URL + '/web_products.php';
  
  let products = [];
  let status = 'loading';
  
  function normalizeProduct(raw) {
    return {
      id: String(raw.id),
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
      priceType: Number.isFinite(Number(raw.price)) && Number(raw.price) > 0 ? 'fixed' : 'hidden',
      priceUsd: Number.isFinite(Number(raw.price)) && Number(raw.price) > 0 ? Number(raw.price) : null,
      priceMinUsd: null,
      priceMaxUsd: null,
    };
  }
  
  async function fetchProducts() {
    status = 'loading';
    document.dispatchEvent(new CustomEvent('productsStatus'));
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Products request failed: ' + response.status);
      const rawProducts = await response.json();
      if (!Array.isArray(rawProducts)) throw new Error('Invalid product response');
      products = rawProducts.map(normalizeProduct);
      status = 'ready';
      window.DKY_PRODUCTS = products;
      document.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
    } catch (err) {
      status = 'error';
      document.dispatchEvent(new CustomEvent('productsStatus'));
      console.error('Error al cargar productos:', err);
    }
  }
  
  function getProducts() {
    return products;
  }
  
  function getProductById(id) {
    return products.find(product => product.id === String(id));
  }
  
  function init() {
    fetchProducts();
  }
  
  return { 
    init,
    getProducts,
    fetchProducts,
    getStatus: () => status,
    getProductById
  };
})();
