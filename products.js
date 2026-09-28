window.DKYProducts = (function() {
  "use strict";
  
  const API_URL = window.DKY_CONFIG.API_BASE_URL + '/web_products.php';
  const PREOWNED_API_URL = window.DKY_CONFIG.API_BASE_URL + '/web_preowned_products.php';
  
  let products = [];
  let status = 'loading';
  
  function normalizeProduct(raw, preowned) {
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
      preowned: !!preowned,
      conditionGrade: raw.conditionGrade || '',
      conditionNotes: raw.conditionNotes || '',
    };
  }
  
  async function fetchProducts() {
    status = 'loading';
    document.dispatchEvent(new CustomEvent('productsStatus'));
    try {
      const [productsResult, preownedResult] = await Promise.allSettled([
        fetch(API_URL).then(response => { if (!response.ok) throw new Error('Products request failed: ' + response.status); return response.json(); }),
        fetch(PREOWNED_API_URL).then(response => response.ok ? response.json() : [])
      ]);
      if (productsResult.status !== 'fulfilled' || !Array.isArray(productsResult.value)) throw new Error('Invalid product response');
      const preowned = preownedResult.status === 'fulfilled' && Array.isArray(preownedResult.value) ? preownedResult.value : [];
      products = [...productsResult.value.map(item => normalizeProduct(item, false)), ...preowned.map(item => normalizeProduct(item, true))];
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
