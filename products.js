window.DKYProducts = (function() {
  "use strict";
  

  const SUPABASE_URL = window.DKY_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.DKY_CONFIG.SUPABASE_ANON_KEY;
  
  let products = [];
  
  function normalizeProduct(raw) {
    return {
      id: raw.id,
      image: raw.img,                  // ← antes raw.image
      karat: raw.karat,
      weightGrams: raw.weight,         // ← antes raw.weight_grams
      name: {
        es: raw.name_es?.trim() || "",
        en: raw.name_en?.trim() || ""
      },
      category: raw.category || "other",
      description: {
        es: raw.description_es || "",
        en: raw.description_en || ""
      },
      details: {
        es: typeof raw.details_es === 'string' 
          ? raw.details_es 
          : Array.isArray(raw.details_es) 
            ? raw.details_es.join('\n') 
            : '',
        en: typeof raw.details_en === 'string' 
          ? raw.details_en 
          : Array.isArray(raw.details_en) 
            ? raw.details_en.join('\n') 
            : ''
      },
      shortDesc: {
        es: raw.short_descr_es || "",  // ← antes raw.short_desc_es
        en: raw.short_descr_en || ""   // ← antes raw.short_desc_en
      },
      priceType: raw.price_type,
      priceUsd: raw.price || null,     // ← antes raw.price_usd
      priceMinUsd: raw.minprice || null,// ← antes raw.pricemin
      priceMaxUsd: raw.maxprice || null,// ← antes raw.pricemax
    };
  }
  
  async function fetchProducts() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Productos?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      const rawProducts = await response.json();
      products = rawProducts.map(normalizeProduct);
      window.DKY_PRODUCTS = products;
      
      document.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
      
    } catch (err) {
      console.error('Error cargando productos:', err);
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