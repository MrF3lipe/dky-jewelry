// js/pages/admin.js
window.DKYAdmin = (function() {
  const SUPABASE_URL = window.DKY_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.DKY_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let products = [];

  function normalizeProduct(raw) {
    return {
      id: raw.id,
      image: raw.img,
      karat: raw.karat,
      weightGrams: raw.weight,
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
        es: raw.short_descr_es || "",
        en: raw.short_descr_en || ""
      },
      priceType: raw.price_type,
      priceUsd: raw.price || null,
      priceMinUsd: raw.minprice || null,
      priceMaxUsd: raw.maxprice || null,
    };
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.hash = "#/login";
      return false;
    }
    return true;
  }

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
      const categoryDisplay = t('cat_' + (p.category || 'other'));
      const karat = p.karat || '?';
      const weightStr = p.weightGrams > 0 ? p.weightGrams + 'g' : '';
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
              ${weightStr ? `<span class="admin-meta-item">${weightStr}</span>` : ''}
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

  function openForm(id) {
    const product = id ? products.find(p => p.id == id) : null;
    const title = product ? "Editar producto" : "Nuevo producto";

    const i18n = window.DKYI18n;
    const t = (key) => i18n ? i18n.t(key) : key;

    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="admin-form-wrapper">
        <div class="admin-form-card">
          <div class="admin-form-header">
            <div>
              <h1 class="admin-form-title">${title}</h1>
              <p class="admin-form-subtitle">${product ? 'Modifica los datos y guarda los cambios' : 'Completa la información para añadir una nueva pieza'}</p>
            </div>
            <button type="button" id="close-form" class="btn-icon" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <form id="product-form" class="admin-form-new">
            <input type="hidden" id="prod-id" value="${product ? product.id : ''}" />

            <!-- Imagen -->
            <div class="form-section form-section-image">
              <label class="form-label-icon">📷 Imagen del producto</label>
              <div class="image-upload-area" id="image-upload-area">
                <img id="image-preview" class="image-preview" 
                    src="${product ? (product.image || '') : ''}" 
                    alt="Vista previa" 
                    style="display: ${product && product.image ? 'block' : 'none'};" />
                <div id="upload-placeholder" class="upload-placeholder" 
                    style="display: ${product && product.image ? 'none' : 'flex'};">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Arrastra o haz clic para subir imagen</span>
                </div>
                <input type="file" id="image-file" accept="image/*" style="display:none;" />
                <input type="hidden" id="image-url" value="${product ? product.image || '' : ''}" />
              </div>
            </div>

            <!-- Campos en dos columnas -->
            <div class="form-row-2col">
              <!-- Columna izquierda: información básica -->
              <div class="form-col">
                <div class="form-section">
                  <label class="form-label-icon" for="name_es">📝 Nombre (ES)</label>
                  <input id="name_es" value="${product ? product.name?.es || '' : ''}" required placeholder="Ej: Anillo de compromiso" />
                </div>
                <div class="form-section">
                  <label class="form-label-icon" for="name_en">📝 Nombre (EN)</label>
                  <input id="name_en" value="${product ? product.name?.en || '' : ''}" placeholder="Ej: Engagement ring" />
                </div>
                <div class="form-section">
                  <label class="form-label-icon" for="category">🏷️ Categoría</label>
                  <select id="category">
                    <option value="necklaces" ${product?.category === 'necklaces' ? 'selected' : ''}>${t('cat_necklaces') || 'Collares'}</option>
                    <option value="rings" ${product?.category === 'rings' ? 'selected' : ''}>${t('cat_rings') || 'Anillos'}</option>
                    <option value="earrings" ${product?.category === 'earrings' ? 'selected' : ''}>${t('cat_earrings') || 'Aretes'}</option>
                    <option value="bracelets" ${product?.category === 'bracelets' ? 'selected' : ''}>${t('cat_bracelets') || 'Pulseras'}</option>
                    <option value="other" ${product?.category === 'other' ? 'selected' : ''}>${t('cat_other') || 'Otro'}</option>
                  </select>
                </div>
                <div class="form-row-2col-inner">
                  <div class="form-section">
                    <label class="form-label-icon" for="karat">💎 Quilate</label>
                    <input type="number" id="karat" value="${product ? product.karat : ''}" step="1" required placeholder="18" />
                  </div>
                  <div class="form-section">
                    <label class="form-label-icon" for="weight">⚖️ Peso (g)</label>
                    <input type="number" id="weight" value="${product ? product.weightGrams : ''}" step="0.01" required placeholder="10.5" />
                  </div>
                </div>
                <div class="form-section">
                  <label class="form-label-icon">💰 Precio</label>
                  <select id="price_type">
                    <option value="fixed" ${product && product.priceType === 'fixed' ? 'selected' : ''}>Fijo</option>
                    <option value="range" ${product && product.priceType === 'range' ? 'selected' : ''}>Rango</option>
                    <option value="hidden" ${product && product.priceType === 'hidden' ? 'selected' : ''}>Oculto (consultar)</option>
                  </select>
                  <div id="price-fixed" style="display:${!product || product.priceType === 'fixed' ? 'block' : 'none'}; margin-top:12px;">
                    <input type="number" id="price" value="${product ? product.priceUsd || '' : ''}" step="0.01" placeholder="Precio USD" />
                  </div>
                  <div id="price-range" style="display:${product && product.priceType === 'range' ? 'block' : 'none'}; margin-top:12px;">
                    <div class="form-row-2col-inner">
                      <input type="number" id="minprice" value="${product ? product.priceMinUsd || '' : ''}" step="0.01" placeholder="Mínimo USD" />
                      <input type="number" id="maxprice" value="${product ? product.priceMaxUsd || '' : ''}" step="0.01" placeholder="Máximo USD" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Columna derecha: descripciones y detalles -->
              <div class="form-col">
                <div class="form-section">
                  <label class="form-label-icon" for="description_es">📄 Descripción (ES)</label>
                  <textarea id="description_es" rows="3">${product ? product.description?.es || '' : ''}</textarea>
                </div>
                <div class="form-section">
                  <label class="form-label-icon" for="description_en">📄 Descripción (EN)</label>
                  <textarea id="description_en" rows="3">${product ? product.description?.en || '' : ''}</textarea>
                </div>
                <div class="form-section">
                  <label class="form-label-icon" for="details_es">📋 Detalles (ES)</label>
                  <textarea id="details_es" rows="3" placeholder="Uno por línea">${product ? (product.details?.es || []).join('\n') : ''}</textarea>
                </div>
                <div class="form-section">
                  <label class="form-label-icon" for="details_en">📋 Detalles (EN)</label>
                  <textarea id="details_en" rows="3" placeholder="Uno por línea">${product ? (product.details?.en || []).join('\n') : ''}</textarea>
                </div>
                <div class="form-row-2col-inner">
                  <div class="form-section">
                    <label class="form-label-icon" for="short_descr_es">✂️ Corta (ES)</label>
                    <input id="short_descr_es" value="${product ? product.shortDesc?.es || '' : ''}" placeholder="Resumen corto" />
                  </div>
                  <div class="form-section">
                    <label class="form-label-icon" for="short_descr_en">✂️ Corta (EN)</label>
                    <input id="short_descr_en" value="${product ? product.shortDesc?.en || '' : ''}" placeholder="Short summary" />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" id="cancel-form" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary" id="save-product">💾 Guardar producto</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Lógica de subida de imagen
    const fileInput = document.getElementById("image-file");
    const previewImg = document.getElementById("image-preview");
    const placeholder = document.getElementById("upload-placeholder");
    const uploadArea = document.getElementById("image-upload-area");
    const imageUrlHidden = document.getElementById("image-url");
    let selectedFile = null;

    uploadArea.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          previewImg.style.display = 'block';
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
        imageUrlHidden.value = '';
      }
    });

    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    document.getElementById("price_type").addEventListener("change", (e) => {
      const val = e.target.value;
      document.getElementById("price-fixed").style.display = val === 'fixed' ? 'block' : 'none';
      document.getElementById("price-range").style.display = val === 'range' ? 'block' : 'none';
    });

    document.getElementById("cancel-form").addEventListener("click", () => {
      renderPanel();
    });
    document.getElementById("close-form").addEventListener("click", () => {
      renderPanel();
    });

    document.getElementById("product-form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("prod-id").value;
      const saveBtn = document.getElementById("save-product");
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";

      try {
        let finalImageUrl = imageUrlHidden.value;

        if (selectedFile) {
          const bucketName = "product-images";
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw new Error("Error al subir la imagen: " + uploadError.message);

          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          finalImageUrl = publicUrlData.publicUrl;
        }

        if (!finalImageUrl && !imageUrlHidden.value) {
          finalImageUrl = '';
        }

        const formData = {
          name_es: document.getElementById("name_es").value,
          name_en: document.getElementById("name_en").value,
          category: document.getElementById("category").value,
          description_es: document.getElementById("description_es").value,
          description_en: document.getElementById("description_en").value,
          details_es: document.getElementById("details_es").value,
          details_en: document.getElementById("details_en").value,
          short_descr_es: document.getElementById("short_descr_es").value,
          short_descr_en: document.getElementById("short_descr_en").value,
          karat: parseInt(document.getElementById("karat").value),
          weight: parseFloat(document.getElementById("weight").value),
          img: finalImageUrl,
          price_type: document.getElementById("price_type").value,
          price: document.getElementById("price_type").value === 'fixed' ? parseFloat(document.getElementById("price").value) || null : null,
          minprice: document.getElementById("price_type").value === 'range' ? parseFloat(document.getElementById("minprice").value) || null : null,
          maxprice: document.getElementById("price_type").value === 'range' ? parseFloat(document.getElementById("maxprice").value) || null : null,
        };

        if (!id) {
          formData.id = crypto.randomUUID();
        }

        let error;
        if (id) {
          ({ error } = await supabase.from('Productos').update(formData).eq('id', id));
        } else {
          ({ error } = await supabase.from('Productos').insert([formData]));
        }

        if (error) throw new Error(error.message);

        await refreshAndRender();

      } catch (err) {
        alert("Error al guardar producto: " + err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Guardar producto";
      }
    });
  }

  async function refreshAndRender() {
    await fetchProducts();
    window.DKY_PRODUCTS = products;
    window.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
    renderPanel();
  }

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
      window.history.pushState(null, "", "/login");
      window.DKYRouter.navigate();
    });

    renderList();
  }

  async function render() {
    const ok = await checkAuth();
    if (ok) {
      await fetchProducts();
      window.DKY_PRODUCTS = products;
      window.dispatchEvent(new CustomEvent('productsLoaded', { detail: products }));
      renderPanel();
    }
    return () => {};
  }

  return { render };
})();