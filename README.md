# 💍 DKY Jewelry

**E-commerce para tienda de joyería con catálogo dinámico, carrito de compras y panel de administración.**

Sitio web comercial para [DKY Jewelry](https://dkygold.com) — una tienda especializada en oro fino de 14k a 22k. La plataforma permite navegar productos, ver precios actualizados con tasas internacionales en vivo, y gestionar el inventario desde un panel de administración conectado a Supabase.

---

## 🚀 Características

| Característica | Descripción |
|---------------|-------------|
| 🏪 **Catálogo dinámico** | Productos cargados desde Supabase con imágenes, descripciones y precios |
| 💰 **Precios en vivo** | Tasas de oro actualizadas automáticamente según el mercado internacional |
| 🛒 **Carrito de compras** | Agrega, elimina y ajusta cantidades antes de finalizar la compra |
| 🔍 **Búsqueda y filtros** | Encuentra productos por categoría, quilates y precio |
| 🌙 **Modo oscuro/claro** | Diseño adaptable con tema claro y oscuro |
| 📱 **Responsive** | Funciona en escritorio, tablet y móvil |
| 📞 **Contacto directo** | Botón de WhatsApp integrado para consultas y ventas |
| 🔄 **SPA** | Navegación tipo aplicación de una sola página sin recargas |
| ⚡ **404 redirect** | Redirección inteligente para SPA con sessionStorage |

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML5, CSS3 (variables CSS / OKLCH), JavaScript (ES2024) |
| **Backend** | Supabase (PostgreSQL + API REST) |
| **Hosting** | GitHub Pages + dominio personalizado (dkygold.com) |
| **Pagos** | WhatsApp Business (consulta directa) |

---

## 📂 Estructura

```
dky-jewelry/
├── index.html        ← Entrada principal (SPA)
├── config.js         ← Configuración global (API keys, tasas)
├── products.js       ← Lógica de productos y carrito
├── styles.css        ← Estilos con tema claro/oscuro
├── assets/           ← Imágenes y recursos
├── 404.html          ← Redirección SPA
├── CNAME             ← Dominio personalizado
└── .gitignore
```

---

## 🚀 Despliegue

El sitio está publicado en **GitHub Pages** con dominio personalizado:

**🌐 [https://dkygold.com](https://dkygold.com)**

Para desplegar tu propia copia:
1. Haz fork del repositorio
2. Configura tu propio `CNAME` y `config.js`
3. Activa GitHub Pages desde **Settings → Pages**
4. Apunta tu dominio al CNAME de GitHub

---

## ⚙️ Configuración

Edita `config.js` para personalizar:
- `BUSINESS_NAME` — Nombre del negocio
- `WHATSAPP_NUMBER` — Número de contacto
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Credenciales de Supabase
- `BUYBACK_MIN_PCT` / `BUYBACK_MAX_PCT` — Márgenes de recompra

---

## 📄 Licencia

MIT © 2024 Felipe Hernández
