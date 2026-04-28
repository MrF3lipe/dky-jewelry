window.DKYProducts = (function() {
  "use strict";
  
  const SUPABASE_URL = 'https://buoufbuqmyrtcumppaeq.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1b3VmYnVxbXlydGN1bXBwYWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTkzOTYsImV4cCI6MjA5Mjg5NTM5Nn0.5CfnWvs_A6MmwPC8HrH0uXdss-cjQLZ1IRuBIiHuXsY';
  
  let products = [];
  
  // Función para normalizar un producto al formato que esperan shop.js, product.js, cart.js
  function normalizeProduct(raw) {
    return {
      id: raw.id,
      image: raw.image,
      karat: raw.karat,
      weightGrams: raw.weight_grams,
      // Campos multilingüe
      name: {
        es: raw.name_es?.trim() || "",
        en: raw.name_en?.trim() || ""
      },
      category: {
        es: raw.category_es || "",
        en: raw.category_en || ""
      },
      description: {
        es: raw.description_es || "",
        en: raw.description_en || ""
      },
      details: {
        es: raw.details_es ? raw.details_es.split('\n').filter(l => l.trim()) : [],
        en: raw.details_en ? raw.details_en.split('\n').filter(l => l.trim()) : []
      },
      shortDesc: {
        es: raw.short_desc_es || "",
        en: raw.short_desc_en || ""
      },
      // Precio
      priceType: raw.price_type, // "fixed", "range", "hidden"
      priceUsd: raw.price_usd || null,
      priceMinUsd: raw.pricemin || null,
      priceMaxUsd: raw.pricemax || null,
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
      // Normalizar cada producto
      products = rawProducts.map(normalizeProduct);
      window.DKY_PRODUCTS = products;
      console.log('Productos normalizados:', products);
      
      // Disparar evento cuando los productos estén listos
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