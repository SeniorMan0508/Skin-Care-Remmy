// ===================================================================
// REMI LUXE BEAUTY - SHOP CATALOG LOGIC (shop.js)
// ===================================================================

let currentCategory = "All";
let currentSearch = "";
let currentSort = "newest";

document.addEventListener("DOMContentLoaded", () => {
  initUrlParams();
  initShopControls();
  renderCatalog();
  updateCartBadge();
  setupCartDrawer();
  setupQuickViewModal();
  setupEventListeners();
});

function initUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat) {
    currentCategory = cat;
  }
}

function renderCategoryPills() {
  const container = document.querySelector(".filter-pills");
  if (!container) return;

  const categories = (typeof getCategories === "function") ? getCategories() : ["Face Care"];
  const isAll = !currentCategory || currentCategory.toLowerCase() === "all";

  let html = `<button class="filter-btn ${isAll ? 'active' : ''}" data-category="All">All Formulations</button>`;

  categories.forEach(cat => {
    const isActive = !isAll && currentCategory.toLowerCase() === cat.toLowerCase();
    html += `<button class="filter-btn ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
  });

  container.innerHTML = html;

  // Bind click events on filter buttons
  container.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      renderCatalog();
    });
  });
}

function initShopControls() {
  renderCategoryPills();

  const searchInput = document.getElementById("shop-search-input");
  const sortSelect = document.getElementById("shop-sort-select");

  searchInput?.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderCatalog();
  });

  sortSelect?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderCatalog();
  });

  window.addEventListener("categoriesUpdated", () => {
    renderCategoryPills();
    renderCatalog();
  });

  window.addEventListener("productsUpdated", () => {
    renderCatalog();
  });
}

function renderCatalog() {
  const grid = document.getElementById("shop-grid");
  const countEl = document.getElementById("catalog-item-count");
  if (!grid) return;

  let products = getProducts();

  // Category filter
  if (currentCategory && currentCategory !== "All") {
    products = products.filter(p => p.category.toLowerCase().includes(currentCategory.toLowerCase()));
  }

  // Search filter
  if (currentSearch) {
    products = products.filter(p => 
      p.title.toLowerCase().includes(currentSearch) || 
      p.description.toLowerCase().includes(currentSearch) ||
      (p.skinType && p.skinType.toLowerCase().includes(currentSearch))
    );
  }

  // Sorting
  if (currentSort === "price-low") {
    products.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-high") {
    products.sort((a, b) => b.price - a.price);
  } else if (currentSort === "rating") {
    products.sort((a, b) => (b.rating || 5) - (a.rating || 5));
  } else {
    // newest
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (countEl) {
    countEl.textContent = `Showing ${products.length} luxury ${products.length === 1 ? 'formulation' : 'formulations'}`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-catalog">
        <h3>No Formulations Found</h3>
        <p>No products match your current search or category filter. Try selecting "All" or searching with another term.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const isOutOfStock = product.inStock === false;

    return `
      <article class="product-card" data-id="${product.id}">
        <div class="product-img-wrapper" onclick="openQuickView('${product.id}')" title="Click to view details">
          ${product.isNew ? `<span class="badge-new">New Drop</span>` : ''}
          ${isOutOfStock ? `<span class="badge-outofstock">Sold Out</span>` : ''}
          <img src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy">
          
          <div class="product-quick-actions">
            <button class="btn-quick-view" onclick="event.stopPropagation(); openQuickView('${product.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Quick View
            </button>
          </div>
        </div>

        <div class="product-details">
          <div class="product-meta-row">
            <span class="product-category-tag">${escapeHtml(product.category)}</span>
            <div class="product-rating">
              <span>★</span>
              <span>${product.rating || '5.0'}</span>
            </div>
          </div>

          <h3 class="product-title" onclick="openQuickView('${product.id}')" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</h3>
          <p class="product-skin-tag">${escapeHtml(product.skinType || 'All Skin Types')}</p>

          <div class="product-footer-row">
            <div class="price-wrapper">
              <span class="current-price">${formatNaira(product.price)}</span>
              ${hasDiscount ? `<span class="original-price">${formatNaira(product.originalPrice)}</span>` : ''}
            </div>

            <button class="btn-add-cart" title="${isOutOfStock ? 'Sold Out' : 'Add to Bag'}" ${isOutOfStock ? 'disabled' : ''} onclick="handleAddToCart('${product.id}', event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <span>${isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Quick View Modal
function setupQuickViewModal() {
  const modalBackdrop = document.getElementById("quick-view-modal");
  const closeBtn = document.getElementById("close-modal-btn");

  closeBtn?.addEventListener("click", () => modalBackdrop?.classList.remove("open"));
  modalBackdrop?.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) modalBackdrop.classList.remove("open");
  });
}

function openQuickView(productId) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modalBackdrop = document.getElementById("quick-view-modal");
  const modalImg = document.getElementById("modal-product-img");
  const modalTitle = document.getElementById("modal-product-title");
  const modalCat = document.getElementById("modal-product-cat");
  const modalPrice = document.getElementById("modal-product-price");
  const modalDesc = document.getElementById("modal-product-desc");
  const modalSkin = document.getElementById("modal-product-skin");
  const modalVolume = document.getElementById("modal-product-volume");
  const modalAddBtn = document.getElementById("modal-add-btn");

  if (modalImg) modalImg.src = product.image;
  if (modalTitle) modalTitle.textContent = product.title;
  if (modalCat) modalCat.textContent = product.category;
  if (modalPrice) modalPrice.textContent = formatNaira(product.price);
  if (modalDesc) modalDesc.textContent = product.description;
  if (modalSkin) modalSkin.textContent = product.skinType || "All skin types";
  if (modalVolume) modalVolume.textContent = product.volume || "30ml";

  if (modalAddBtn) {
    modalAddBtn.onclick = () => {
      handleAddToCart(product.id);
      modalBackdrop?.classList.remove("open");
    };
  }

  modalBackdrop?.classList.add("open");
}

// Cart Drawer
function setupCartDrawer() {
  const cartBtn = document.getElementById("cart-trigger-btn");
  const cartBackdrop = document.getElementById("cart-drawer-backdrop");
  const cartDrawer = document.getElementById("cart-drawer");
  const closeDrawerBtn = document.getElementById("close-drawer-btn");

  function openCart() {
    cartBackdrop?.classList.add("open");
    cartDrawer?.classList.add("open");
    renderCartItems();
  }

  function closeCart() {
    cartBackdrop?.classList.remove("open");
    cartDrawer?.classList.remove("open");
  }

  cartBtn?.addEventListener("click", openCart);
  closeDrawerBtn?.addEventListener("click", closeCart);
  cartBackdrop?.addEventListener("click", (e) => {
    if (e.target === cartBackdrop) closeCart();
  });
}

function renderCartItems() {
  const itemsContainer = document.getElementById("cart-items-list");
  const subtotalEl = document.getElementById("cart-subtotal-price");
  const shippingText = document.getElementById("shipping-status-text");
  const shippingFill = document.getElementById("shipping-fill-bar");
  
  if (!itemsContainer) return;

  const cart = getCart();

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--color-text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 12px; font-family: var(--font-serif);">Your Remi Bag is Empty</p>
        <p style="font-size: 0.85rem; margin-bottom: 24px;">Discover pure botanical luxury for your daily glow.</p>
        <button class="btn-primary" onclick="document.getElementById('close-drawer-btn').click();" style="font-size: 0.85rem; padding: 12px 24px;">Start Shopping</button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = formatNaira(0);
    if (shippingText) shippingText.textContent = "📦 Shipping fees are paid directly to the courier rider upon delivery.";
    if (shippingFill) shippingFill.style.width = "100%";
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${escapeHtml(item.title)}" class="cart-item-img">
      <div class="cart-item-info">
        <h4>${escapeHtml(item.title)}</h4>
        <span>${escapeHtml(item.volume || 'Standard')}</span>
        <div class="cart-item-price">${formatNaira(item.price * item.quantity)}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="modifyItemQty('${item.id}', -1)">-</button>
          <span class="qty-number">${item.quantity}</span>
          <button class="qty-btn" onclick="modifyItemQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button onclick="deleteFromCart('${item.id}')" style="color: #999; font-size: 1.1rem;" title="Remove">✕</button>
    </div>
  `).join("");

  const total = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = formatNaira(total);

  if (shippingText) shippingText.textContent = "📦 Shipping fee is paid directly to the courier rider upon delivery.";
  if (shippingFill) shippingFill.style.width = "100%";
}

function handleAddToCart(productId, event) {
  addToCart(productId, 1);
  updateCartBadge();

  const products = getProducts();
  const product = products.find(p => p.id === productId);
  const title = product ? product.title : "Formulation";
  showToast(`✨ ${title} added to your bag!`);

  // Visual feedback on the clicked button
  if (event && event.currentTarget) {
    const btn = event.currentTarget;
    btn.classList.add("added-bounce");
    const labelSpan = btn.querySelector("span");
    const origText = labelSpan ? labelSpan.textContent : "";
    if (labelSpan) labelSpan.textContent = "Added! ✓";
    setTimeout(() => {
      btn.classList.remove("added-bounce");
      if (labelSpan) labelSpan.textContent = origText;
    }, 900);
  }
}

function modifyItemQty(productId, delta) {
  updateCartQty(productId, delta);
  updateCartBadge();
  renderCartItems();
}

function deleteFromCart(productId) {
  removeFromCart(productId);
  updateCartBadge();
  renderCartItems();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge-count");
  if (badge) {
    badge.textContent = getCartCount();
    badge.classList.remove("badge-pulse");
    void badge.offsetWidth; // Trigger reflow for animation restart
    badge.classList.add("badge-pulse");
  }
}

function showToast(message) {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.className = "toast-notice";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function setupEventListeners() {
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");
  mobileToggle?.addEventListener("click", () => {
    navMenu?.classList.toggle("open");
  });

  window.addEventListener("productsUpdated", () => {
    renderCatalog();
  });

  window.addEventListener("cartUpdated", () => {
    updateCartBadge();
    renderCartItems();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "remi_luxe_products_v2") renderCatalog();
    if (e.key === "remi_luxe_cart_v2") {
      updateCartBadge();
      renderCartItems();
    }
  });
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
