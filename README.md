# DKY Jewelry — Static site for WordPress

Esta es la versión **100% estática** de DKY Jewelry: HTML + CSS + JavaScript puro, sin compilación, sin Node, sin servidor. Funciona en cualquier WordPress (gratis, .com, .org, hosting compartido, etc.).

Todas las funcionalidades del sitio original están aquí:

- Página principal (Home)
- Tienda de joyería con **filtro por categorías** (`/shop`)
- **Página individual** para cada producto (`/shop/curb-chain-necklace`, etc.)
- Botón **"Add to cart"** en cada producto
- **Carrito lateral** persistente (localStorage) con cantidades, eliminar, total
- Botón **"Inquire on WhatsApp"** que arma un mensaje con todas las joyas + total aproximado
- Calculadora **"Sell Your Gold"** con karat, peso (input numérico), forma sólido/semi-sólido y nuevo/viejo
- **Precio spot del oro en vivo** desde goldprice.org (refresca cada 5 min, con fallback)
- **Gráfico interactivo** del precio del oro: hover con tooltip, selector 1H / 6H / 24H / All, marcadores de máximo y mínimo, latido en vivo
- **Modo claro / oscuro** con tema cálido (no blanco puro)
- Diseño Dark Premium con dorado neón, idéntico al original
- 100% responsive

---

## 📁 Contenido del zip

```
dky-jewelry/
├── index.html          ← punto de entrada
├── styles.css          ← todos los estilos
├── app.js              ← toda la lógica (router, cart, calculadora, gráfico)
├── config.js           ← ⚠ EDITAR: número de WhatsApp, % buy-back, etc.
├── products.js         ← ⚠ EDITAR: catálogo de productos
└── assets/
    ├── dky-logo.png    ← reemplazar con tu logo real
    ├── hero-jewelry.jpg
    └── products/
        ├── chain-necklace.jpg
        ├── wedding-band.jpg
        ├── hoop-earrings.jpg
        ├── tennis-bracelet.jpg
        ├── signet-ring.jpg
        └── pendant.jpg
```

---

## ⚙ Antes de subir — configuración mínima (2 minutos)

### 1. Pon tu número de WhatsApp

Abre **`config.js`** con cualquier editor de texto (Notepad, VS Code) y cambia:

```js
WHATSAPP_NUMBER: "1234567890",   // tu número con código de país, sin + ni espacios
```

Ejemplo para Argentina: `"5491145678901"`. Para España: `"34611223344"`. Para México: `"5215512345678"`.

### 2. Cambia el logo

Reemplaza `assets/dky-logo.png` por tu logo real (PNG transparente, ~512×512).

### 3. (opcional) Edita el % de buy-back y nombre del negocio

Mismo archivo `config.js`:

```js
BUSINESS_NAME: "DKY Jewelry",
BUYBACK_MIN_PCT: 0.90,    // 90 %
BUYBACK_MAX_PCT: 0.92,    // 92 %
```

---

## 🚀 Cómo subirlo a WordPress

Hay **3 formas** según tu plan de WordPress. Elige la que coincida con tu hosting.

---

### ✅ Opción 1 — Plugin "Use Any Font" / "WPCode" / "File Manager" (la más fácil, funciona en casi todos los planes)

**Funciona en:** wordpress.org self-hosted, wordpress.com Business o superior, hosting compartido.

**Pasos:**

1. **Sube los archivos al servidor.** Tres maneras:
   - **(A) FTP / SFTP** con FileZilla a `wp-content/uploads/dky-jewelry/`
   - **(B) Plugin "WP File Manager"** → Install → abre `/wp-content/uploads/` → New Folder `dky-jewelry` → sube todo el contenido del zip dentro
   - **(C) cPanel → File Manager** → entra a `public_html/wp-content/uploads/` → crea carpeta `dky-jewelry` → upload zip → extract

2. **Crea una página nueva en WordPress** (Pages → Add New). Título: "Jewelry" o el que quieras.

3. **Cambia a HTML / Custom HTML block** y pega:

   ```html
   <iframe
     src="/wp-content/uploads/dky-jewelry/index.html"
     style="width:100%;height:100vh;min-height:900px;border:0;display:block;"
     loading="lazy"
     title="DKY Jewelry">
   </iframe>
   ```

4. **Publica la página** y agrégala al menú principal (Appearance → Menus).

✅ Listo. La página se ve dentro de tu sitio WordPress como cualquier otra.

---

### ✅ Opción 2 — Sustituir una página entera (sin iframe, look más nativo)

**Funciona en:** wordpress.org self-hosted con acceso a tema.

1. Sube los archivos por FTP a la raíz del sitio, por ejemplo a `public_html/jewelry/`.
2. Verifica que abre directo: `https://tudominio.com/jewelry/`.
3. Agrega un enlace en el menú de WordPress: Appearance → Menus → **Custom Link** → URL `/jewelry/` → Label "Jewelry".
4. (Opcional) Si quieres que sea la home, edita `wp-config.php` o usa el plugin "Maintenance" para redirigir.

⚠ Si tu instalación tiene reglas `.htaccess` raras, agrega un `.htaccess` dentro de `/jewelry/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /jewelry/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /jewelry/index.html [L]
</IfModule>
```

> No es estrictamente necesario porque uso **hash routing** (`#/shop`), pero ayuda si decides cambiar a URLs limpias en el futuro.

---

### ✅ Opción 3 — wordpress.com Free / Personal (sin acceso a archivos)

Estos planes **no permiten subir archivos JS/HTML personalizados** por seguridad. La única opción real es:

1. Sube esta carpeta a un host gratis externo: **Netlify Drop** (https://app.netlify.com/drop), **Cloudflare Pages**, **GitHub Pages** o **Vercel**.
2. Te darán una URL como `https://dky-jewelry.netlify.app/`.
3. En tu WordPress, en una Custom HTML block:

   ```html
   <iframe
     src="https://dky-jewelry.netlify.app/"
     style="width:100%;height:100vh;min-height:900px;border:0;display:block;"
     loading="lazy"
     title="DKY Jewelry">
   </iframe>
   ```

(Netlify Drop literalmente es: arrastras la carpeta al navegador y listo, te da la URL.)

---

## ➕ Cómo agregar más productos

1. Pon la foto en `assets/products/mi-anillo.jpg`.
2. Abre **`products.js`** y duplica una entrada existente. Cámbiala:

   ```js
   {
     id: "mi-anillo-de-oro",                         // aparece en la URL
     name: "Mi Anillo de Oro",
     category: "Rings",                              // Necklaces | Rings | Earrings | Bracelets
     karat: 18,                                      // 14 | 18 | 22 | 24
     weightGrams: 8,
     priceUsd: 1200,
     image: "assets/products/mi-anillo.jpg",
     shortDesc: "Tagline corto.",
     description: "Descripción larga que se muestra en la página individual.",
     details: ["Solid 18k", "Hand finished", "Sizes 6–13"],
   }
   ```

3. Guarda. Recarga la página → el producto aparece automáticamente en `/shop` y tiene su página individual en `/shop/mi-anillo-de-oro`.

---

## 🛠 Errores comunes y soluciones

| Síntoma | Causa | Solución |
|---|---|---|
| **El iframe se ve cortado / aparece un scroll feo** | El alto del iframe es fijo | Aumenta `min-height:900px` a `1200px` o usa `height:100vh` |
| **El sitio carga pero no se ve nada / pantalla en blanco** | Los `.js` no se están cargando | Abre la consola del navegador (F12). Si dice 404 en `app.js`, revisa que la ruta del iframe sea correcta y que los 3 archivos `.js` estén en la misma carpeta que `index.html` |
| **El precio del oro no carga, queda en $—** | El navegador bloqueó la API de goldprice.org | Es seguro, hay fallback. Verás el precio fijo de respaldo (`FALLBACK_USD_PER_OZ`). Para usar tu propio API, edita `app.js` función `fetchSpot` |
| **WhatsApp dice "Hi 1234567890"** | No editaste `config.js` | Abre `config.js` y pon tu número real |
| **El carrito está vacío después de cerrar el navegador** | localStorage del iframe puede borrarse en algunos hosts | Comportamiento normal del navegador. Para persistencia real necesitas un backend |
| **La fuente Syne no carga** | Google Fonts bloqueado por la región/red | Descarga las fuentes a `assets/fonts/` y cambia el `<link>` de Google Fonts en `index.html` |
| **Aparece scroll horizontal en móvil** | Algún tema de WP agrega padding raro al iframe | Envuelve el iframe en `<div style="overflow:hidden;">` o usa la Opción 2 |
| **Las imágenes no se ven** | Las subiste a una carpeta diferente | Mantén la estructura: `assets/dky-logo.png`, `assets/products/*.jpg`. No renombres |
| **El botón de WhatsApp no abre nada en iPhone** | Safari bloquea `wa.me` en iframes a veces | El usuario puede tocar largo y "Abrir en nueva pestaña". Para forzar, en `app.js` cambia `target="_blank"` por `target="_top"` |
| **WordPress.com Free no me deja pegar el iframe** | Plan Free filtra `<iframe>` | Necesitas plan Personal o superior, o usar Opción 3 con Netlify |
| **404 al recargar `/shop/curb-chain-necklace`** | No es el caso aquí: este sitio usa **hash routing** (`#/shop/curb-chain-necklace`), nunca da 404 | ✅ Ya está solucionado por diseño |

---

## 🎨 Personalización rápida

| Quiero cambiar... | Archivo | Qué editar |
|---|---|---|
| Colores principales | `styles.css` | Las variables `--gold`, `--gold-bright`, `--background` arriba del archivo |
| Texto del Hero | `app.js` | Buscar `function renderHome` |
| Textos de "Sell Your Gold" | `app.js` | Buscar `function renderSellGold` |
| Número de WhatsApp | `config.js` | `WHATSAPP_NUMBER` |
| Rango de buy-back | `config.js` | `BUYBACK_MIN_PCT` y `BUYBACK_MAX_PCT` |
| Productos | `products.js` | Array `DKY_PRODUCTS` |

---

## 💡 Mi recomendación

- Si tu WordPress es **wordpress.org self-hosted** o tienes plan Business+ → **Opción 1** (subir a `/wp-content/uploads/dky-jewelry/` + iframe). 5 minutos.
- Si estás en **wordpress.com Free / Personal** → **Opción 3** (Netlify Drop + iframe). 3 minutos.
- Si quieres que se vea como página nativa sin iframe → **Opción 2**.

¿Dudas? Lo más útil es siempre la consola del navegador (F12 → Console) — cualquier error aparece ahí con la línea exacta.
#   d k y - j e w e l r y  
 