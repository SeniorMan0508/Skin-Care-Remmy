document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  renderNewArrivals();
  renderHomeReviews();
  initReviewsToggle();
  updateCartBadge();
  setupEventListeners();
  setupCartDrawer();
  setupQuickViewModal();
  setupNewsletter();
});

// 1. Header scroll effect & mobile toggle
function initHeader() {
  const header = document.querySelector(".main-header");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  });

  mobileToggle?.addEventListener("click", () => {
    navMenu?.classList.toggle("open");
  });
}

// 2. Render dynamic "New Arrivals" section (Directly from products.js / localStorage)
function renderNewArrivals() {
  const container = document.getElementById("new-arrivals-grid");
  if (!container) return;

  const arrivals = getNewArrivals(4);

  if (!arrivals || arrivals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No new products currently uploaded. Check back soon or visit our admin panel to upload fresh formulations!</p>
        <a href="admin.html" class="btn-primary">Go to Admin Upload</a>
      </div>
    `;
    return;
  }

  container.innerHTML = arrivals.map(product => {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    return `
      <article class="product-card" data-id="${product.id}">
        <div class="product-img-wrapper">
          <span class="badge-new">New Release</span>
          <img src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy">
          
          <div class="product-quick-actions">
            <button class="btn-quick-view" onclick="openQuickView('${product.id}')">
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

          <h3 class="product-title" onclick="openQuickView('${product.id}')">${escapeHtml(product.title)}</h3>
          <p class="product-skin-tag">${escapeHtml(product.skinType || 'All Skin Types')}</p>

          <div class="product-footer-row">
            <div class="price-wrapper">
              <span class="current-price">${formatNaira(product.price)}</span>
              ${hasDiscount ? `<span class="original-price">${formatNaira(product.originalPrice)}</span>` : ''}
            </div>

            <button class="btn-add-cart" title="Add to Bag" onclick="handleAddToCart('${product.id}', event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <span>Add to Bag</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// 3. Quick View Modal Setup
function setupQuickViewModal() {
  const modalBackdrop = document.getElementById("quick-view-modal");
  const closeBtn = document.getElementById("close-modal-btn");

  closeBtn?.addEventListener("click", () => {
    modalBackdrop?.classList.remove("open");
  });

  modalBackdrop?.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.remove("open");
    }
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

// 4. Cart Drawer Logic
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
    if (shippingText) shippingText.textContent = `Add ${formatNaira(FREE_SHIPPING_THRESHOLD)} for FREE express shipping`;
    if (shippingFill) shippingFill.style.width = "0%";
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

  // Shipping progress calculation (FREE_SHIPPING_THRESHOLD ₦60,000)
  if (total >= FREE_SHIPPING_THRESHOLD) {
    if (shippingText) shippingText.textContent = "🎉 You've unlocked FREE Luxury Express Shipping!";
    if (shippingFill) shippingFill.style.width = "100%";
  } else {
    const diff = FREE_SHIPPING_THRESHOLD - total;
    const pct = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    if (shippingText) shippingText.textContent = `Add ${formatNaira(diff)} more for FREE express delivery`;
    if (shippingFill) shippingFill.style.width = `${pct}%`;
  }
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

// 5. Toast Notifications
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

// 6. Global event listener for localStorage changes (e.g. products added from Admin or reviews from Checkout)
function setupEventListeners() {
  window.addEventListener("productsUpdated", () => {
    renderNewArrivals();
  });

  window.addEventListener("cartUpdated", () => {
    updateCartBadge();
    renderCartItems();
  });

  window.addEventListener("reviewsUpdated", () => {
    renderHomeReviews();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "remi_luxe_products_v2") {
      renderNewArrivals();
    }
    if (e.key === "remi_luxe_cart_v2") {
      updateCartBadge();
      renderCartItems();
    }
    if (e.key === "remi_luxe_customer_reviews_v1") {
      renderHomeReviews();
    }
  });
}

// 6b. Customer Comments / Reviews Rendering (Max 6 by default with "See More" toggle)
let isShowingAllReviews = false;

function renderHomeReviews() {
  const container = document.getElementById("home-testimonials-grid");
  const toggleBtnContainer = document.getElementById("see-more-comments-container");
  const toggleBtn = document.getElementById("btn-toggle-comments");
  if (!container) return;

  const allReviews = getReviews();
  const maxInitial = 6;
  const reviewsToDisplay = isShowingAllReviews ? allReviews : allReviews.slice(0, maxInitial);

  container.innerHTML = reviewsToDisplay.map(rev => {
    const initials = rev.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AM";
    const stars = "★".repeat(rev.rating || 5);

    return `
      <div class="testimonial-card">
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-quote">"${escapeHtml(rev.comment)}"</p>
        <div class="testimonial-author">
          <div class="author-avatar">${escapeHtml(initials)}</div>
          <div class="author-info">
            <h4>${escapeHtml(rev.name)}</h4>
            <span>${rev.verifiedBuyer ? 'Verified Buyer • ' : ''}${escapeHtml(rev.skinType || 'Verified Customer')}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Manage "See More Comments" button
  if (toggleBtnContainer && toggleBtn) {
    if (allReviews.length > maxInitial) {
      toggleBtnContainer.style.display = "block";
      const remainingCount = allReviews.length - maxInitial;
      if (isShowingAllReviews) {
        toggleBtn.innerHTML = `<span>Show Less Comments ▲</span>`;
      } else {
        toggleBtn.innerHTML = `<span>See More Comments (${remainingCount} more) ▼</span>`;
      }
    } else {
      toggleBtnContainer.style.display = "none";
    }
  }
}

function initReviewsToggle() {
  const toggleBtn = document.getElementById("btn-toggle-comments");
  toggleBtn?.addEventListener("click", () => {
    isShowingAllReviews = !isShowingAllReviews;
    renderHomeReviews();
    if (!isShowingAllReviews) {
      document.getElementById("customer-reviews")?.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// 7. Newsletter Subscription Simulation
function setupNewsletter() {
  const form = document.getElementById("newsletter-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (input && input.value) {
      showToast("✨ Welcome to the Remi VIP Circle! Check your inbox for 15% off.");
      input.value = "";
    }
  });
}

// Helper: Escape HTML to avoid XSS
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
