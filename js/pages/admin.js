// js/pages/admin.js
window.DKYAdmin = (function() {
  const SUPABASE_URL = window.DKY_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.DKY_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let products = [];
  
  function normalizeProduct(raw) {
    return {
      id: raw.id,
      image: raw.img,                    // ✅ corregido
      karat: raw.karat,
      weightGrams: raw.weight,           // ✅ corregido
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
        es: Array.isArray(raw.details_es)
            ? raw.details_es
            : (raw.details_es || "").split('\n').filter(l => l.trim()),
        en: Array.isArray(raw.details_en)
            ? raw.details_en
            : (raw.details_en || "").split('\n').filter(l => l.trim())
      },
      shortDesc: {
        es: raw.short_descr_es || "",     // ✅ corregido
        en: raw.short_descr_en || ""      // ✅ corregido
      },
      priceType: raw.price_type,
      priceUsd: raw.price || null,        // ✅ corregido
      priceMinUsd: raw.minprice || null,  // ✅ corregido
      priceMaxUsd: raw.maxprice || null,  // ✅ corregido
    };
  }

  // Auth check
  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.hash = "#/login";
      return false;
    }
    return true;
  }

  // Carga productos desde Supabase, almacena normalizados, NO renderiza
  async function fetchProducts() {
    const { data, error } = await supabase
      .from('Productos')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching products:', error);
      alert('Error al cargar productos: ' + error.message);
      return;
    }
    products = (data || []).map(normalizeProduct);
  }

  // Renderiza la tabla de productos
  function renderList() {
    const list = document.getElementById("products-list");
    if (!list) return;

    if (products.length === 0) {
      list.innerHTML = `<div class="empty-state">✨ Aún no hay productos. Crea el primero.</div>`;
      return;
    }

    const i18n = window.DKYI18n;
    const t = (key) => i18n ? i18n.t(key) : key;
    

    list.innerHTML = products.map(p => {
      const thumbSrc = p.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23222" /%3E%3Ctext x="40" y="45" text-anchor="middle" fill="%23888" font-size="32"%3E📷%3C/text%3E%3C/svg%3E';
      const name = p.name?.es || 'Sin nombre';
      const categoryDisplay = t('cat_' + (p.category || 'other')); // traducido
      const karat = p.karat || '?';
      let priceDisplay = '';
      if (p.priceType === 'fixed') priceDisplay = `$${p.priceUsd}`;
      else if (p.priceType === 'range') priceDisplay = `$${p.priceMinUsd} – $${p.priceMaxUsd}`;
      else priceDisplay = 'Oculto';

      return `
        <div class="admin-product-card">
          <img class="admin-thumb" src="${thumbSrc}" alt="${name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23222%22/%3E%3Ctext x=%2240%22 y=%2245%22 text-anchor=%22middle%22 fill=%22%23888%22%3E📷%3C/text%3E%3C/svg%3E'" />
          <div class="admin-product-info">
            <strong class="admin-name">${name}</strong>
            <div class="admin-meta">
              <span class="admin-meta-item">${categoryDisplay}</span>
              <span class="admin-meta-item">${karat}k</span>
              <span class="admin-meta-item admin-price">${priceDisplay}</span>
            </div>
          </div>
          <div class="admin-actions">
            <button data-id="${p.id}" class="edit-btn">✏️ Editar</button>
            <button data-id="${p.id}" class="delete-btn">🗑️</button>
          </div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", () => openForm(btn.dataset.id))
    );
    document.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id))
    );
  }

  // Eliminar producto
  async function deleteProduct(id) {
    if (!confirm("¿Eliminar definitivamente este producto?")) return;
    const { error } = await supabase
      .from('Productos')
      .delete()
      .eq('id', id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      await refreshAndRender();
    }
  }

  // Abre formulario (crear o editar)
  function openForm(id) {
    const product = id ? products.find(p => p.id == id) : null;
    const title = product ? "Editar producto" : "Nuevo producto";

    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="admin-container">
        <div class="admin-card">
          <h1>${title}</h1>
          <form id="product-form" class="admin-form">
            <input type="hidden" id="prod-id" value="${product ? product.id : ''}" />

            <div class="field-row">
              <div class="field-half">
                <label>Nombre (ES)</label>
                <input id="name_es" value="${product ? product.name?.es || '' : ''}" required />
              </div>
              <div class="field-half">
                <label>Nombre (EN)</label>
                <input id="name_en" value="${product ? product.name?.en || '' : ''}" />
              </div>
            </div>

            <div class="field-row">
              <div class="field-half">
                <label>Categoría</label>
                <select id="category">
                  <option value="necklaces" ${product?.category === 'necklaces' ? 'selected' : ''}>Collares (necklaces)</option>
                  <option value="rings" ${product?.category === 'rings' ? 'selected' : ''}>Anillos (rings)</option>
                  <option value="earrings" ${product?.category === 'earrings' ? 'selected' : ''}>Aretes (earrings)</option>
                  <option value="bracelets" ${product?.category === 'bracelets' ? 'selected' : ''}>Pulseras (bracelets)</option>
                  <option value="other" ${product?.category === 'other' ? 'selected' : ''}>Otro</option>
                </select>
              </div>
            </div>

            <label>Descripción (ES)</label>
            <textarea id="description_es" class="field-full">${product ? product.description?.es || '' : ''}</textarea>

            <label>Descripción (EN)</label>
            <textarea id="description_en" class="field-full">${product ? product.description?.en || '' : ''}</textarea>

            <label>Detalles (ES) – uno por línea</label>
            <textarea id="details_es" class="field-full">${product ? (product.details?.es || []).join('\n') : ''}</textarea>

            <label>Detalles (EN) – uno por línea</label>
            <textarea id="details_en" class="field-full">${product ? (product.details?.en || []).join('\n') : ''}</textarea>

            <div class="field-row">
              <div class="field-half">
                <label>Descripción corta (ES)</label>
                <input id="short_descr_es" value="${product ? product.shortDesc?.es || '' : ''}" />
              </div>
              <div class="field-half">
                <label>Descripción corta (EN)</label>
                <input id="short_descr_en" value="${product ? product.shortDesc?.en || '' : ''}" />
              </div>
            </div>

            <div class="field-row">
              <div class="field-half">
                <label>Quilate (karat)</label>
                <input type="number" id="karat" value="${product ? product.karat : ''}" step="1" required />
              </div>
              <div class="field-half">
                <label>Peso (gramos)</label>
                <input type="number" id="weight" value="${product ? product.weightGrams : ''}" step="0.01" required />
              </div>
            </div>

            <label>Imagen (URL)</label>
            <input id="image" value="${product ? product.image || '' : ''}" placeholder="https://..." class="field-full" />

            <div class="field-row">
              <div class="field-half">
                <label>Tipo de precio</label>
                <select id="price_type">
                  <option value="fixed" ${product && product.priceType === 'fixed' ? 'selected' : ''}>Fijo</option>
                  <option value="range" ${product && product.priceType === 'range' ? 'selected' : ''}>Rango</option>
                  <option value="hidden" ${product && product.priceType === 'hidden' ? 'selected' : ''}>Oculto (consultar)</option>
                </select>
              </div>
              <div class="field-half" id="price-fixed" style="display:${!product || product.priceType === 'fixed' ? 'block' : 'none'}">
                <label>Precio USD</label>
                <input type="number" id="price" value="${product ? product.priceUsd || '' : ''}" step="0.01" />
              </div>
              <div class="field-half" id="price-range" style="display:${product && product.priceType === 'range' ? 'block' : 'none'}">
                <label>Precio mínimo USD</label>
                <input type="number" id="minprice" value="${product ? product.priceMinUsd || '' : ''}" step="0.01" />                <label>Precio máximo USD</label>
                <input type="number" id="maxprice" value="${product ? product.priceMaxUsd || '' : ''}" step="0.01" />
              </div>
            </div>

            <div class="btn-group">
              <button type="submit" class="btn-primary" id="save-product">Guardar</button>
              <button type="button" id="cancel-form" class="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Mostrar/ocultar campos según tipo de precio
    document.getElementById("price_type").addEventListener("change", (e) => {
      const val = e.target.value;
      document.getElementById("price-fixed").style.display = val === 'fixed' ? 'block' : 'none';
      document.getElementById("price-range").style.display = val === 'range' ? 'block' : 'none';
    });

    document.getElementById("cancel-form").addEventListener("click", () => {
      renderPanel();
    });

    document.getElementById("product-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("prod-id").value;

    const formData = {
      name_es: document.getElementById("name_es").value,
      name_en: document.getElementById("name_en").value,
      category: document.getElementById("category").value,
      description_es: document.getElementById("description_es").value,
      description_en: document.getElementById("description_en").value,
      details_es: document.getElementById("details_es").value.split('\n').filter(l => l.trim()),
      details_en: document.getElementById("details_en").value.split('\n').filter(l => l.trim()),
      short_descr_es: document.getElementById("short_descr_es").value,
      short_descr_en: document.getElementById("short_descr_en").value,
      karat: parseInt(document.getElementById("karat").value),
      weight: parseFloat(document.getElementById("weight").value),
      img: document.getElementById("image").value,
      price_type: document.getElementById("price_type").value,
      price: document.getElementById("price_type").value === 'fixed' ? parseFloat(document.getElementById("price").value) || null : null,
      minprice: document.getElementById("price_type").value === 'range' ? parseFloat(document.getElementById("minprice").value) || null : null,
      maxprice: document.getElementById("price_type").value === 'range' ? parseFloat(document.getElementById("maxprice").value) || null : null,
    };

      // Asignamos un UUID solo si es un producto nuevo y la BD espera un UUID explícito
      if (!id) {
        formData.id = crypto.randomUUID();   // ahora sí existe formData
      }

      let error;
      if (id) {
        ({ error } = await supabase.from('Productos').update(formData).eq('id', id));
      } else {
        ({ error } = await supabase.from('Productos').insert([formData]));
      }

      if (error) {
        alert('Error al guardar: ' + error.message);
      } else {
        await refreshAndRender();
      }
    });
  }

  // Función auxiliar para recargar productos y actualizar el panel y la tienda global
  async function refreshAndRender() {
    await fetchProducts();
    // Actualizar el array global que usan shop.js, product.js, etc.
    window.DKY_PRODUCTS = products;
    // Disparar evento para que las páginas de tienda se actualicen
    window.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
    // Volver al panel principal
    renderPanel();
  }

  // Panel principal
  function renderPanel() {
      const app = document.getElementById("app");
      app.innerHTML = `
        <div class="admin-container">
          <div class="admin-card">
            <div class="admin-header">
              <div>
                <h1>Panel de Administración</h1>
                <p class="admin-subtitle">Gestiona los productos de DKY Jewelry</p>
              </div>
              <div style="display:flex; gap:8px;">
                <button id="add-product" class="btn-primary">+ Nuevo Producto</button>
                <button id="logout-btn" class="btn-secondary">Cerrar sesión</button>
              </div>
            </div>
            <div id="products-list" class="admin-list"></div>
          </div>
        </div>
      `;

      document.getElementById("add-product").addEventListener("click", () => openForm(null));
      document.getElementById("logout-btn").addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.hash = "#/login";
      });

      renderList();
  }

  // Entry point
  async function render() {
    const ok = await checkAuth();
    if (ok) {
      await fetchProducts();
      window.DKY_PRODUCTS = products;
      window.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
      renderPanel();
    }
    return () => {}; // cleanup
  }

  return { render };
})();