const AUTH_STORAGE_KEY = "remi_admin_security_v2";
const SESSION_KEY = "remi_admin_session_v2";

let selectedNewProductImage = "./images/product-serum.jpg";
let selectedEditProductImage = "";

// SHA-256 Cryptographic Hash Helper (Web Crypto API)
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Initialize Admin Security Credentials if not already configured
async function initAdminSecurity() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    const defaultPasswordHash = await sha256("remi2026");
    const defaultAnswerHash = await sha256("remi");
    const defaultAltAnswerHash = await sha256("remmy");
    const defaultPinHash = await sha256("8899");

    const initialSecurity = {
      passwordHash: defaultPasswordHash,
      securityAnswerHash: defaultAnswerHash,
      altAnswerHash: defaultAltAnswerHash,
      recoveryPinHash: defaultPinHash
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(initialSecurity));
    return initialSecurity;
  }
  return JSON.parse(stored);
}

document.addEventListener("DOMContentLoaded", async () => {
  await initAdminSecurity();
  checkAuthenticationState();
  initAuthEventListeners();
  initAdminTabs();
  initOrderTracking();
  populateCategoryDropdowns();
  initCategoryCreationHandlers();
  initImageHandlers();
  initProductUploadForm();
  initProductEditForm();
  initSecuritySettings();
  renderAdminTable();
  updateDashboardStats();
});



// ===================================================================
// 1. AUTHENTICATION & PASSWORD PROTECTION
// ===================================================================
function checkAuthenticationState() {
  const overlay = document.getElementById("admin-auth-overlay");
  const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === "active";

  if (isAuthenticated) {
    overlay?.classList.add("hidden");
  } else {
    overlay?.classList.remove("hidden");
  }
}

function initAuthEventListeners() {
  const loginForm = document.getElementById("admin-login-form");
  const resetForm = document.getElementById("admin-reset-form");
  const linkForgot = document.getElementById("link-forgot-pass");
  const linkBack = document.getElementById("link-back-to-login");
  const loginCard = document.getElementById("auth-login-card");
  const resetCard = document.getElementById("auth-reset-card");
  const btnLogout = document.getElementById("btn-admin-logout");

  // Toggle to Forgot Password view
  linkForgot?.addEventListener("click", () => {
    loginCard.style.display = "none";
    resetCard.style.display = "block";
    const errorMsg = document.getElementById("reset-error-msg");
    const successMsg = document.getElementById("reset-success-msg");
    if (errorMsg) errorMsg.style.display = "none";
    if (successMsg) successMsg.style.display = "none";
  });

  // Toggle back to Login view
  linkBack?.addEventListener("click", () => {
    resetCard.style.display = "none";
    loginCard.style.display = "block";
  });

  // Login submission
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const passInput = document.getElementById("admin-pass-input");
    const errorMsg = document.getElementById("login-error-msg");
    const enteredPass = passInput?.value || "";

    const security = await initAdminSecurity();
    const enteredHash = await sha256(enteredPass);

    if (enteredHash === security.passwordHash) {
      sessionStorage.setItem(SESSION_KEY, "active");
      document.getElementById("admin-auth-overlay")?.classList.add("hidden");
      if (passInput) passInput.value = "";
      if (errorMsg) errorMsg.style.display = "none";
    } else {
      if (errorMsg) {
        errorMsg.textContent = "Incorrect password. If you forgot your password, click 'Forgot Password?' below.";
        errorMsg.style.display = "block";
      }
    }
  });

  // Password Reset Submission (Verifies registered admin business email)
  resetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("reset-admin-email")?.value.trim().toLowerCase();
    const newPass = document.getElementById("reset-new-pass")?.value || "";
    const confirmPass = document.getElementById("reset-confirm-pass")?.value || "";
    const errorMsg = document.getElementById("reset-error-msg");
    const successMsg = document.getElementById("reset-success-msg");

    if (errorMsg) errorMsg.style.display = "none";
    if (successMsg) successMsg.style.display = "none";

    // 1. Verify registered business email
    const registeredEmail = (typeof STORE_CONFIG !== "undefined" && STORE_CONFIG.businessEmail) 
      ? STORE_CONFIG.businessEmail.toLowerCase() 
      : "remigold049@gmail.com";

    if (emailInput !== registeredEmail) {
      if (errorMsg) {
        errorMsg.textContent = `Verification failed: "${emailInput}" is not the registered admin email for this store.`;
        errorMsg.style.display = "block";
      }
      return;
    }

    // 2. Validate passwords
    if (newPass !== confirmPass) {
      if (errorMsg) {
        errorMsg.textContent = "New passwords do not match. Please re-enter.";
        errorMsg.style.display = "block";
      }
      return;
    }

    const security = await initAdminSecurity();

    // 3. Encrypt and save new password
    security.passwordHash = await sha256(newPass);
    security.adminEmail = emailInput;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(security));

    // 4. Send background security alert email
    if (typeof sendPasswordResetAlertEmail === "function") {
      sendPasswordResetAlertEmail(emailInput);
    }

    if (successMsg) {
      successMsg.textContent = `✨ Password successfully reset for ${emailInput}! Redirecting to login...`;
      successMsg.style.display = "block";
    }

    resetForm.reset();
    setTimeout(() => {
      resetCard.style.display = "none";
      loginCard.style.display = "block";
      const passInput = document.getElementById("admin-pass-input");
      if (passInput) passInput.focus();
    }, 2000);
  });

  // Logout button
  btnLogout?.addEventListener("click", () => {
    if (confirm("Are you sure you want to log out of the Admin Portal?")) {
      sessionStorage.removeItem(SESSION_KEY);
      const overlay = document.getElementById("admin-auth-overlay");
      overlay?.classList.remove("hidden");
      loginCard.style.display = "block";
      resetCard.style.display = "none";
    }
  });
}

// Security Settings Modal (Change password from inside dashboard)
function initSecuritySettings() {
  const btnOpen = document.getElementById("btn-open-settings");
  const modal = document.getElementById("security-settings-modal");
  const btnClose = document.getElementById("close-security-modal-btn");
  const form = document.getElementById("security-settings-form");
  const errorMsg = document.getElementById("settings-error-msg");
  const successMsg = document.getElementById("settings-success-msg");

  btnOpen?.addEventListener("click", () => {
    modal?.classList.add("open");
    if (errorMsg) errorMsg.style.display = "none";
    if (successMsg) successMsg.style.display = "none";
  });

  btnClose?.addEventListener("click", () => {
    modal?.classList.remove("open");
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPass = document.getElementById("settings-current-pass")?.value || "";
    const newPass = document.getElementById("settings-new-pass")?.value || "";
    const confirmPass = document.getElementById("settings-confirm-pass")?.value || "";
    const newPin = document.getElementById("settings-recovery-pin")?.value.trim();

    if (errorMsg) errorMsg.style.display = "none";
    if (successMsg) successMsg.style.display = "none";

    const security = await initAdminSecurity();
    const currentHash = await sha256(currentPass);

    if (currentHash !== security.passwordHash) {
      if (errorMsg) {
        errorMsg.textContent = "Current password is incorrect.";
        errorMsg.style.display = "block";
      }
      return;
    }

    if (newPass !== confirmPass) {
      if (errorMsg) {
        errorMsg.textContent = "New passwords do not match.";
        errorMsg.style.display = "block";
      }
      return;
    }

    security.passwordHash = await sha256(newPass);
    if (newPin) {
      security.recoveryPinHash = await sha256(newPin);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(security));

    if (successMsg) {
      successMsg.textContent = "✨ Admin password updated and encrypted successfully!";
      successMsg.style.display = "block";
    }

    form.reset();
    setTimeout(() => {
      modal?.classList.remove("open");
    }, 1800);
  });
}

// ===================================================================
// 2. PRODUCT UPLOAD & EDITING HANDLERS
// ===================================================================
function initImageHandlers() {
  const fileInput = document.getElementById("admin-image-file");
  const urlInput = document.getElementById("admin-image-url");
  const previewImg = document.getElementById("admin-preview-img");
  const presetChips = document.querySelectorAll(".preset-chip");

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedNewProductImage = event.target.result;
        if (previewImg) previewImg.src = selectedNewProductImage;
        if (urlInput) urlInput.value = "";
        presetChips.forEach(c => c.classList.remove("active"));
      };
      reader.readAsDataURL(file);
    }
  });

  urlInput?.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      selectedNewProductImage = val;
      if (previewImg) previewImg.src = selectedNewProductImage;
      presetChips.forEach(c => c.classList.remove("active"));
    }
  });

  presetChips.forEach(chip => {
    chip.addEventListener("click", () => {
      presetChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedNewProductImage = chip.dataset.src;
      if (previewImg) previewImg.src = selectedNewProductImage;
      if (urlInput) urlInput.value = "";
    });
  });

  // Edit Modal Image File Handler
  const editFileInput = document.getElementById("edit-image-file");
  const editUrlInput = document.getElementById("edit-image-url");
  const editPreviewImg = document.getElementById("edit-preview-img");

  editFileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedEditProductImage = event.target.result;
        if (editPreviewImg) editPreviewImg.src = selectedEditProductImage;
        if (editUrlInput) editUrlInput.value = "";
      };
      reader.readAsDataURL(file);
    }
  });

  editUrlInput?.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      selectedEditProductImage = val;
      if (editPreviewImg) editPreviewImg.src = selectedEditProductImage;
    }
  });
}

// ===================================================================
// DYNAMIC CATEGORY DROPDOWNS & CATEGORY CREATION
// ===================================================================
function populateCategoryDropdowns(selectedCategory = null) {
  const uploadSelect = document.getElementById("prod-category");
  const editSelect = document.getElementById("edit-prod-category");
  const categories = getCategories(); // ["Face Care", ...]

  const optionsHtml = categories.map(cat => 
    `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
  ).join("");

  if (uploadSelect) {
    const currentVal = selectedCategory || uploadSelect.value || "Face Care";
    uploadSelect.innerHTML = optionsHtml;
    if (categories.includes(currentVal)) {
      uploadSelect.value = currentVal;
    } else {
      uploadSelect.value = "Face Care";
    }
  }

  if (editSelect) {
    const editCurrentVal = selectedCategory || editSelect.value || "Face Care";
    editSelect.innerHTML = optionsHtml;
    if (categories.includes(editCurrentVal)) {
      editSelect.value = editCurrentVal;
    } else {
      editSelect.value = "Face Care";
    }
  }
}

function initCategoryCreationHandlers() {
  // 1. Upload Form Category Creator
  const toggleBtn = document.getElementById("btn-toggle-new-cat");
  const creatorBox = document.getElementById("new-category-box");
  const input = document.getElementById("new-category-input");
  const saveBtn = document.getElementById("btn-save-new-cat");
  const cancelBtn = document.getElementById("btn-cancel-new-cat");
  const feedback = document.getElementById("new-cat-feedback");

  toggleBtn?.addEventListener("click", () => {
    const isHidden = creatorBox.style.display === "none";
    creatorBox.style.display = isHidden ? "block" : "none";
    if (isHidden) {
      input.value = "";
      input.focus();
    }
  });

  cancelBtn?.addEventListener("click", () => {
    creatorBox.style.display = "none";
    input.value = "";
    if (feedback) feedback.style.display = "none";
  });

  const handleSaveUploadCategory = () => {
    const name = input.value.trim();
    if (!name) {
      alert("Please enter a category name (e.g. Body Care, Sun Care).");
      return;
    }
    const added = addCategory(name);
    populateCategoryDropdowns(added);
    document.getElementById("prod-category").value = added;
    creatorBox.style.display = "none";
    input.value = "";

    if (feedback) {
      feedback.textContent = `✓ Category "${added}" created and selected!`;
      feedback.style.display = "block";
      setTimeout(() => { feedback.style.display = "none"; }, 4000);
    }
  };

  saveBtn?.addEventListener("click", handleSaveUploadCategory);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveUploadCategory();
    }
  });

  // 2. Edit Modal Category Creator
  const editToggleBtn = document.getElementById("btn-toggle-edit-new-cat");
  const editCreatorBox = document.getElementById("new-edit-category-box");
  const editInput = document.getElementById("new-edit-category-input");
  const editSaveBtn = document.getElementById("btn-save-edit-new-cat");
  const editCancelBtn = document.getElementById("btn-cancel-edit-new-cat");

  editToggleBtn?.addEventListener("click", () => {
    const isHidden = editCreatorBox.style.display === "none";
    editCreatorBox.style.display = isHidden ? "block" : "none";
    if (isHidden) {
      editInput.value = "";
      editInput.focus();
    }
  });

  editCancelBtn?.addEventListener("click", () => {
    editCreatorBox.style.display = "none";
    editInput.value = "";
  });

  const handleSaveEditCategory = () => {
    const name = editInput.value.trim();
    if (!name) {
      alert("Please enter a category name.");
      return;
    }
    const added = addCategory(name);
    populateCategoryDropdowns(added);
    document.getElementById("edit-prod-category").value = added;
    editCreatorBox.style.display = "none";
    editInput.value = "";
  };

  editSaveBtn?.addEventListener("click", handleSaveEditCategory);
  editInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEditCategory();
    }
  });

  // Re-populate if categories are updated elsewhere
  window.addEventListener("categoriesUpdated", () => {
    populateCategoryDropdowns();
  });
}

// Upload Product Form
function initProductUploadForm() {
  const form = document.getElementById("product-upload-form");
  const successBox = document.getElementById("upload-success-message");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("prod-title").value.trim();
    const category = document.getElementById("prod-category").value;
    const price = parseFloat(document.getElementById("prod-price").value) || 0;
    const originalPrice = document.getElementById("prod-original-price").value ? parseFloat(document.getElementById("prod-original-price").value) : null;
    const volume = document.getElementById("prod-volume").value.trim() || "50ml";
    const skinType = document.getElementById("prod-skin-type").value.trim() || "All Skin Types";
    const description = document.getElementById("prod-description").value.trim();
    const isNew = document.getElementById("prod-is-new").checked;
    const inStock = document.getElementById("prod-in-stock").checked;

    if (!title || price <= 0) {
      alert("Please provide a valid product title and price in Naira.");
      return;
    }

    const newProd = {
      title,
      category,
      price,
      originalPrice,
      volume,
      skinType,
      description,
      image: selectedNewProductImage,
      isNew: isNew,
      isFeatured: true,
      inStock: inStock
    };

    addProduct(newProd);

    if (successBox) {
      successBox.style.display = "block";
      setTimeout(() => {
        successBox.style.display = "none";
      }, 5000);
    }

    form.reset();
    document.getElementById("prod-is-new").checked = true;
    document.getElementById("prod-in-stock").checked = true;
    selectedNewProductImage = "./images/product-serum.jpg";
    const previewImg = document.getElementById("admin-preview-img");
    if (previewImg) previewImg.src = selectedNewProductImage;

    renderAdminTable();
    updateDashboardStats();
  });
}

// ===================================================================
// 3. EDIT PRODUCT FUNCTIONALITY (PRICE ADJUSTMENTS & DETAILS)
// ===================================================================
function initProductEditForm() {
  const editModal = document.getElementById("edit-product-modal");
  const closeBtn = document.getElementById("close-edit-modal-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const form = document.getElementById("edit-product-form");

  closeBtn?.addEventListener("click", () => editModal?.classList.remove("open"));
  cancelBtn?.addEventListener("click", () => editModal?.classList.remove("open"));
  editModal?.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.classList.remove("open");
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-prod-id").value;
    const title = document.getElementById("edit-prod-title").value.trim();
    const category = document.getElementById("edit-prod-category").value;
    const price = parseFloat(document.getElementById("edit-prod-price").value) || 0;
    const originalPrice = document.getElementById("edit-prod-original-price").value ? parseFloat(document.getElementById("edit-prod-original-price").value) : null;
    const volume = document.getElementById("edit-prod-volume").value.trim();
    const skinType = document.getElementById("edit-prod-skin-type").value.trim();
    const description = document.getElementById("edit-prod-description").value.trim();
    const isNew = document.getElementById("edit-prod-is-new").checked;
    const inStock = document.getElementById("edit-prod-in-stock").checked;

    const updatedData = {
      title,
      category,
      price,
      originalPrice,
      volume,
      skinType,
      description,
      isNew,
      inStock
    };

    if (selectedEditProductImage) {
      updatedData.image = selectedEditProductImage;
    }

    const updated = updateProduct(id, updatedData);
    if (updated) {
      editModal?.classList.remove("open");
      renderAdminTable();
      updateDashboardStats();
      alert(`✨ "${updated.title}" successfully updated! New price: ${formatNaira(updated.price)}.`);
    }
  });
}

// Open Edit Modal with Pre-populated Product Values
function handleOpenEditModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  // Ensure all categories are loaded and select the product's category
  populateCategoryDropdowns(product.category);

  const editModal = document.getElementById("edit-product-modal");
  document.getElementById("edit-prod-id").value = product.id;
  document.getElementById("edit-prod-title").value = product.title;
  document.getElementById("edit-prod-category").value = product.category || "Face Care";
  document.getElementById("edit-prod-price").value = product.price;
  document.getElementById("edit-prod-original-price").value = product.originalPrice || "";
  document.getElementById("edit-prod-volume").value = product.volume || "50ml";
  document.getElementById("edit-prod-skin-type").value = product.skinType || "";
  document.getElementById("edit-prod-description").value = product.description;
  document.getElementById("edit-prod-is-new").checked = !!product.isNew;
  document.getElementById("edit-prod-in-stock").checked = product.inStock !== false;

  selectedEditProductImage = product.image;
  const previewImg = document.getElementById("edit-preview-img");
  if (previewImg) previewImg.src = product.image;

  editModal?.classList.add("open");
}

// ===================================================================
// 4. ADMIN TABLE & STATS RENDERING
// ===================================================================
function renderAdminTable() {
  const tableBody = document.getElementById("admin-products-table-body");
  if (!tableBody) return;

  const products = getProducts();

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #888;">
          No formulations uploaded yet. Use the form above to add your first product!
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = products.map(product => {
    const isStock = product.inStock !== false;
    return `
      <tr>
        <td>
          <div class="table-product-cell">
            <img src="${product.image}" class="table-product-thumb" alt="${escapeHtml(product.title)}">
            <div>
              <strong style="display:block; color: var(--color-dark);">${escapeHtml(product.title)}</strong>
              <small style="color: var(--color-text-muted);">${escapeHtml(product.volume || '50ml')}</small>
            </div>
          </div>
        </td>
        <td><span style="font-weight:600; font-size:0.85rem;">${escapeHtml(product.category)}</span></td>
        <td><strong style="color: var(--color-dark);">${formatNaira(product.price)}</strong></td>
        <td>
          <span class="status-badge ${isStock ? 'status-instock' : 'status-outofstock'}">
            ${isStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </td>
        <td>
          <div class="product-actions-cell">
            <button class="btn-table-action btn-edit-prod" onclick="handleOpenEditModal('${product.id}')" title="Edit price, title, or details">
              ✏️ Edit
            </button>
            <button class="btn-table-action btn-toggle-stock" onclick="handleStockToggle('${product.id}')" title="Toggle stock availability">
              ${isStock ? 'Mark Sold' : 'Restock'}
            </button>
            <button class="btn-table-action btn-delete-prod" onclick="handleDeleteProduct('${product.id}')" title="Delete formulation">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function handleStockToggle(id) {
  toggleProductStock(id);
  renderAdminTable();
  updateDashboardStats();
}

function handleDeleteProduct(id) {
  if (confirm("Are you sure you want to permanently remove this formulation from the store?")) {
    deleteProduct(id);
    renderAdminTable();
    updateDashboardStats();
  }
}

function updateDashboardStats() {
  const products = getProducts();
  const totalCountEl = document.getElementById("stat-total-products");
  const inStockEl = document.getElementById("stat-in-stock");
  const outStockEl = document.getElementById("stat-out-stock");
  const avgPriceEl = document.getElementById("stat-avg-price");
  const badgeProductsEl = document.getElementById("badge-products-count");

  const total = products.length;
  const inStock = products.filter(p => p.inStock !== false).length;
  const outStock = total - inStock;
  const avgPrice = total > 0 ? (products.reduce((acc, p) => acc + p.price, 0) / total) : 0;

  if (totalCountEl) totalCountEl.textContent = total;
  if (inStockEl) inStockEl.textContent = inStock;
  if (outStockEl) outStockEl.textContent = outStock;
  if (avgPriceEl) avgPriceEl.textContent = formatNaira(avgPrice);
  if (badgeProductsEl) badgeProductsEl.textContent = total;
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ===================================================================
// ADMIN DASHBOARD TABS MANAGEMENT
// ===================================================================
function initAdminTabs() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  const panels = document.querySelectorAll(".admin-panel");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPanelId = btn.getAttribute("data-target");

      tabBtns.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      sessionStorage.setItem("admin_active_tab", targetPanelId);

      // Instantly reload orders whenever admin switches to Orders tab
      if (targetPanelId === "panel-orders") {
        loadAndRenderOrders();
      }
    });
  });

  // Restore active tab if previously set
  const savedTab = sessionStorage.getItem("admin_active_tab");
  if (savedTab) {
    const targetBtn = document.querySelector(`.admin-tab-btn[data-target="${savedTab}"]`);
    if (targetBtn) {
      targetBtn.click();
    }
  }
}

// ===================================================================
// CUSTOMER ORDER TRACKING & PURCHASE HISTORY
// ===================================================================
let adminOrders = [];
let activeOrderSearch = "";
let activeOrderStatusFilter = "ALL";

function initOrderTracking() {
  const searchInput = document.getElementById("order-search-input");
  const clearSearchBtn = document.getElementById("clear-order-search-btn");
  const statusFilter = document.getElementById("order-status-filter");
  const refreshBtn = document.getElementById("btn-refresh-orders");
  const exportBtn = document.getElementById("btn-export-orders");
  const closeReceiptBtn = document.getElementById("close-receipt-modal-btn");
  const receiptModal = document.getElementById("order-receipt-modal");

  // Search input handler
  searchInput?.addEventListener("input", (e) => {
    activeOrderSearch = (e.target.value || "").trim().toLowerCase();
    if (clearSearchBtn) {
      clearSearchBtn.style.display = activeOrderSearch ? "block" : "none";
    }
    applyOrdersFilterAndRender();
  });

  // Clear search button
  clearSearchBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    activeOrderSearch = "";
    clearSearchBtn.style.display = "none";
    applyOrdersFilterAndRender();
    searchInput?.focus();
  });

  // Status dropdown filter handler
  statusFilter?.addEventListener("change", (e) => {
    activeOrderStatusFilter = e.target.value;
    applyOrdersFilterAndRender();
  });

  // Refresh orders button
  refreshBtn?.addEventListener("click", () => {
    refreshBtn.innerHTML = `<span>⏳ Refreshing...</span>`;
    loadAndRenderOrders(true).finally(() => {
      setTimeout(() => {
        refreshBtn.innerHTML = `<span>🔄 Refresh Orders</span>`;
      }, 500);
    });
  });

  // Export orders to CSV button
  exportBtn?.addEventListener("click", () => {
    exportOrdersToCSV();
  });

  // Close receipt modal
  closeReceiptBtn?.addEventListener("click", () => {
    receiptModal?.classList.remove("open");
  });

  receiptModal?.addEventListener("click", (e) => {
    if (e.target === receiptModal) {
      receiptModal.classList.remove("open");
    }
  });

  // Real-time cross-tab sync: whenever an order is placed or updated in another tab
  window.addEventListener("storage", (e) => {
    if (e.key === "remi_luxe_orders") {
      loadAndRenderOrders();
    }
  });

  // Background auto-refresh polling every 5 seconds so incoming customer orders appear immediately
  setInterval(() => {
    // Only refresh if tab is visible, user is logged in, and not actively typing in search
    if (document.visibilityState === "visible" && !activeOrderSearch && sessionStorage.getItem(SESSION_KEY) === "active") {
      loadAndRenderOrders(false, true);
    }
  }, 5000);

  // Initial load
  loadAndRenderOrders();
}

// Load orders from API server and sync with localStorage
async function loadAndRenderOrders(isManual = false, isSilent = false) {
  let serverOrders = [];

  // Multi-endpoint fallback chain: guarantees orders load whether on Node server (5050), Live Server (5500), file://, or static hosting
  let endpointsToTry = ["/api/orders", "./orders.json", "orders.json"];
  if (typeof window !== "undefined") {
    if (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050")) {
      endpointsToTry = [
        "http://localhost:5050/api/orders",
        "/api/orders",
        "./orders.json",
        "orders.json"
      ];
    }
  }

  for (const ep of endpointsToTry) {
    try {
      const res = await fetch(ep, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          serverOrders = data;
          break;
        } else if (Array.isArray(data)) {
          serverOrders = data;
        }
      }
    } catch (err) {
      // Continue to next endpoint fallback
    }
  }

  // Also read from localStorage to guarantee 100% data retention even offline
  let localOrders = [];
  try {
    const stored = localStorage.getItem("remi_luxe_orders");
    if (stored) {
      localOrders = JSON.parse(stored);
    }
  } catch (e) {}

  // Merge and deduplicate orders by orderRef
  const ordersMap = new Map();

  // Load server orders first
  serverOrders.forEach(o => {
    if (o && o.orderRef) {
      ordersMap.set(o.orderRef, { ...o, status: o.status || "Pending Verification" });
    }
  });

  // Merge local orders (if any are missing from server, or if local has updated status)
  localOrders.forEach(o => {
    if (o && o.orderRef) {
      if (!ordersMap.has(o.orderRef)) {
        ordersMap.set(o.orderRef, { ...o, status: o.status || "Pending Verification" });
      } else {
        const existing = ordersMap.get(o.orderRef);
        if (o.status && o.status !== "Pending Verification" && existing.status === "Pending Verification") {
          existing.status = o.status;
        }
      }
    }
  });

  adminOrders = Array.from(ordersMap.values());

  // Sort orders by most recent first
  adminOrders.sort((a, b) => {
    const dateA = new Date(a.receivedAt || 0).getTime();
    const dateB = new Date(b.receivedAt || 0).getTime();
    return dateB - dateA;
  });

  // Update localStorage with merged list
  try {
    localStorage.setItem("remi_luxe_orders", JSON.stringify(adminOrders));
  } catch (e) {}

  updateOrderMetrics();
  applyOrdersFilterAndRender();
}

// Update the top 5 metric cards
function updateOrderMetrics() {
  const totalCountEl = document.getElementById("stat-orders-total");
  const revenueEl = document.getElementById("stat-orders-revenue");
  const pendingEl = document.getElementById("stat-orders-pending");
  const dispatchedEl = document.getElementById("stat-orders-dispatched");
  const deliveredEl = document.getElementById("stat-orders-delivered");
  const badgeOrdersEl = document.getElementById("badge-orders-count");

  const total = adminOrders.length;
  const revenue = adminOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pending = adminOrders.filter(o => !o.status || o.status === "Pending Verification").length;
  const dispatched = adminOrders.filter(o => o.status === "Dispatched / In Transit").length;
  const delivered = adminOrders.filter(o => o.status === "Delivered").length;

  if (totalCountEl) totalCountEl.textContent = total;
  if (revenueEl) revenueEl.textContent = formatNaira(revenue);
  if (pendingEl) pendingEl.textContent = pending;
  if (dispatchedEl) dispatchedEl.textContent = dispatched;
  if (deliveredEl) deliveredEl.textContent = delivered;
  if (badgeOrdersEl) badgeOrdersEl.textContent = total;
}

// Filter orders by text and status, then render table
function applyOrdersFilterAndRender() {
  const tbody = document.getElementById("admin-orders-table-body");
  const emptyState = document.getElementById("no-orders-msg");
  const tableContainer = document.querySelector(".admin-table-container");

  if (!tbody) return;

  const filtered = adminOrders.filter(order => {
    // 1. Status Filter
    if (activeOrderStatusFilter !== "ALL") {
      const orderStatus = order.status || "Pending Verification";
      if (orderStatus !== activeOrderStatusFilter) {
        return false;
      }
    }

    // 2. Search Text Filter
    if (activeOrderSearch) {
      const searchTerms = [
        order.orderRef || "",
        order.name || "",
        order.phone || "",
        order.email || "",
        order.address || "",
        order.state || "",
        order.notes || "",
        order.paymentMethod || "",
        ...(order.items || []).map(i => i.title || "")
      ].join(" ").toLowerCase();

      if (!searchTerms.includes(activeOrderSearch)) {
        return false;
      }
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (tableContainer) tableContainer.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (tableContainer) tableContainer.style.display = "block";

  tbody.innerHTML = filtered.map(order => renderOrderTableRow(order)).join("");
}

// Render a single order row inside the Admin Orders Table
function renderOrderTableRow(order) {
  const ref = escapeHtml(order.orderRef || "N/A");
  const name = escapeHtml(order.name || "Customer");
  const phone = escapeHtml(order.phone || "Not provided");
  const email = escapeHtml(order.email || "Not provided");
  const address = escapeHtml(order.address || "Not provided");
  const state = escapeHtml(order.state || "Lagos");
  const notes = escapeHtml(order.notes || "");
  const paymentMethod = escapeHtml(order.paymentMethod || "Bank Transfer");
  const status = order.status || "Pending Verification";
  const dateFormatted = formatOrderDate(order.receivedAt);
  const timeBadge = timeAgo(order.receivedAt);
  const statusClass = getStatusClass(status);

  // Clean phone number for WhatsApp & Tel
  const cleanPhoneNum = cleanNigerianPhone(order.phone || "");
  const whatsappMsg = encodeURIComponent(
    `Hello ${order.name || 'Customer'},\n\nThis is Remi Luxe Beauty regarding your order ${order.orderRef}. We are contacting you to confirm your order details and delivery arrangement.\n\nThank you for choosing Remi Luxe Beauty!`
  );
  const whatsappUrl = cleanPhoneNum ? `https://wa.me/${cleanPhoneNum}?text=${whatsappMsg}` : "#";

  const whatsappConfirmMsg = encodeURIComponent(
    `Hello ${order.name || 'Customer'},\n\nWe have verified and confirmed your payment of ${formatNaira(order.total || 0)} for Order ${order.orderRef}! 🎉\n\nYour luxury botanical formulations have been released for packaging and delivery preparation to:\n📍 ${order.address || ''}, ${order.state || 'Lagos'} State.\n\nThank you for choosing Remi Luxe Beauty! ✨`
  );
  const whatsappConfirmUrl = cleanPhoneNum ? `https://wa.me/${cleanPhoneNum}?text=${whatsappConfirmMsg}` : "#";

  // Items chips
  const itemsHtml = (order.items || []).map(item => `
    <li class="order-item-chip">
      <span class="order-item-qty">${item.quantity || 1}x</span>
      <span class="order-item-title">${escapeHtml(item.title || "Formulation")}</span>
      <span class="order-item-price">${formatNaira((item.price || 0) * (item.quantity || 1))}</span>
    </li>
  `).join("");

  return `
    <tr id="order-row-${ref}">
      <!-- Order Ref & Date -->
      <td>
        <span class="order-ref-code">${ref}</span>
        <span class="order-date-text">${dateFormatted}</span>
        <span class="order-time-badge">${timeBadge}</span>
      </td>

      <!-- Customer Details -->
      <td>
        <div class="customer-name">
          <span>👤</span>
          <span>${name}</span>
        </div>
        <div class="customer-contact-row">
          <a href="tel:${cleanPhoneNum}" class="customer-phone-link" title="Click to call">📞 ${phone}</a>
          ${cleanPhoneNum ? `
            <a href="${status === 'Payment Confirmed' ? whatsappConfirmUrl : whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-pill" title="${status === 'Payment Confirmed' ? 'Send 1-Click WhatsApp Payment Confirmation' : 'Chat on WhatsApp'}">
              💬 ${status === 'Payment Confirmed' ? 'WA Confirmed' : 'WhatsApp'}
            </a>` : ''}
        </div>
        <div class="customer-email-text">✉️ ${email}</div>
      </td>

      <!-- Delivery Destination -->
      <td>
        <div class="destination-address">${address}</div>
        <span class="destination-state">${state} State, Nigeria</span>
        ${notes && notes !== 'None' ? `<div class="destination-notes">📝 Note: "${notes}"</div>` : ''}
      </td>

      <!-- Items Ordered -->
      <td>
        <ul class="order-items-list">
          ${itemsHtml || '<span style="color:#94a3b8; font-style:italic;">No item details</span>'}
        </ul>
      </td>

      <!-- Total Amount -->
      <td>
        <span class="order-total-amount">${formatNaira(order.total || 0)}</span>
        <span class="order-total-breakdown">
          Subtotal: ${formatNaira(order.subtotal || 0)}<br>
          Delivery: ${order.deliveryFee ? formatNaira(order.deliveryFee) : '<span style="color:#15803d; font-weight:600;">Free Delivery</span>'}
        </span>
      </td>

      <!-- Payment Method -->
      <td>
        <span style="display:inline-block; font-size:0.8rem; font-weight:600; color:#1e293b; background:#F8FAFC; border:1px solid #E2E8F0; padding:4px 8px; border-radius:6px;">
          💳 ${paymentMethod}
        </span>
      </td>

      <!-- Tracking Status Dropdown -->
      <td>
        <div class="order-status-select-wrap">
          <select class="order-status-select ${statusClass}" onchange="handleOrderStatusChange('${ref}', this.value, this)">
            <option value="Pending Verification" ${status === 'Pending Verification' ? 'selected' : ''}>🟡 Pending Verification</option>
            <option value="Payment Confirmed" ${status === 'Payment Confirmed' ? 'selected' : ''}>🟢 Payment Confirmed</option>
            <option value="Dispatched / In Transit" ${status === 'Dispatched / In Transit' ? 'selected' : ''}>🔵 Dispatched / In Transit</option>
            <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>🟣 Delivered</option>
            <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>🔴 Cancelled</option>
          </select>
        </div>
      </td>

      <!-- Actions -->
      <td>
        <div class="order-action-buttons">
          <button type="button" class="btn-order-action btn-view-invoice" onclick="handleOpenOrderReceipt('${ref}')" title="View & Print Full Customer Invoice">
            📄 Invoice
          </button>
          ${cleanPhoneNum ? `
          <a href="${status === 'Payment Confirmed' ? whatsappConfirmUrl : whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-order-action" style="color:#15803d; text-decoration:none;" title="${status === 'Payment Confirmed' ? 'Send WhatsApp Payment Confirmed Message' : 'Direct WhatsApp message'}">
            💬 ${status === 'Payment Confirmed' ? 'WA Alert' : 'Chat'}
          </a>` : ''}
          <button type="button" class="btn-order-action btn-delete-order" onclick="handleDeleteOrder('${ref}')" title="Delete order from database">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Sleek Floating Toast Notification for Admin Dashboard
function showAdminToast(message, type = "success", duration = 4500) {
  let container = document.getElementById("admin-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "admin-toast-container";
    container.className = "admin-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `admin-toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? '✨' : type === 'info' ? 'ℹ️' : '⚠️'}</span>
      <span class="toast-text">${message}</span>
    </div>
    <button type="button" class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// Update order status on server and in localStorage
async function handleOrderStatusChange(orderRef, newStatus, selectElement) {
  // Update class on select element immediately
  if (selectElement) {
    selectElement.className = `order-status-select ${getStatusClass(newStatus)}`;
  }

  // Update in local memory
  const order = adminOrders.find(o => o.orderRef === orderRef);
  if (order) {
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
  }

  // Update localStorage
  try {
    localStorage.setItem("remi_luxe_orders", JSON.stringify(adminOrders));
  } catch (e) {}

  // Update top metrics
  updateOrderMetrics();

  // Send update to backend server (with cross-port support for Live Server)
  let updateEndpoints = ["/api/update-order-status"];
  if (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050"))) {
    updateEndpoints = [
      "http://localhost:5050/api/update-order-status",
      "/api/update-order-status"
    ];
  }

  let serverDispatchedEmail = false;
  for (const ep of updateEndpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef, status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.customerEmail?.sent) {
          serverDispatchedEmail = true;
        }
        break;
      }
    } catch (err) {
      // try next endpoint fallback
    }
  }

  // If server was offline or on static hosting (Netlify), trigger cloud fallback email for Payment Confirmed or Dispatched
  if (!serverDispatchedEmail && order && (newStatus === "Payment Confirmed" || newStatus === "Dispatched / In Transit")) {
    if (order.email && order.email.includes("@") && order.email !== "Not provided") {
      try {
        await sendCustomerStatusEmail(order, newStatus);
      } catch (e) {
        console.warn("Notice: Client-side customer email dispatch:", e);
      }
    }
  }

  // Show Toast Feedback to Admin
  if (order) {
    const hasEmail = order.email && order.email.includes("@") && order.email !== "Not provided";
    if (newStatus === "Payment Confirmed") {
      if (hasEmail) {
        showAdminToast(`🎉 Payment Confirmed for ${order.orderRef}! Confirmation email dispatched to ${order.email}.`, "success", 5000);
      } else {
        showAdminToast(`🎉 Payment Confirmed for ${order.orderRef}! Note: Customer did not provide an email; use the WhatsApp button to notify them.`, "info", 5500);
      }
    } else if (newStatus === "Dispatched / In Transit") {
      if (hasEmail) {
        showAdminToast(`🚚 Order ${order.orderRef} marked as Dispatched! Customer email dispatched to ${order.email}.`, "success", 5000);
      } else {
        showAdminToast(`🚚 Order ${order.orderRef} marked as Dispatched! You can notify them on WhatsApp.`, "info", 5000);
      }
    } else {
      showAdminToast(`Status for ${order.orderRef} updated to "${newStatus}".`, "info", 3500);
    }
  }
}

// Delete an order
async function handleDeleteOrder(orderRef) {
  if (!confirm(`Are you sure you want to permanently delete order "${orderRef}" from your records? This action cannot be undone.`)) {
    return;
  }

  // Remove from local memory
  adminOrders = adminOrders.filter(o => o.orderRef !== orderRef);

  // Remove from localStorage
  try {
    localStorage.setItem("remi_luxe_orders", JSON.stringify(adminOrders));
  } catch (e) {}

  updateOrderMetrics();
  applyOrdersFilterAndRender();

  // Send delete request to backend server (with cross-port support for Live Server)
  let deleteEndpoints = ["/api/delete-order"];
  if (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050"))) {
    deleteEndpoints = [
      "http://localhost:5050/api/delete-order",
      "/api/delete-order"
    ];
  }

  for (const ep of deleteEndpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef })
      });
      if (res.ok) break;
    } catch (err) {
      // try next endpoint fallback
    }
  }
}

// Open full printable Order Receipt / Invoice Modal
function handleOpenOrderReceipt(orderRef) {
  const order = adminOrders.find(o => o.orderRef === orderRef);
  if (!order) return;

  const modalBody = document.getElementById("order-receipt-modal-body");
  const modal = document.getElementById("order-receipt-modal");
  if (!modalBody || !modal) return;

  const cleanPhoneNum = cleanNigerianPhone(order.phone || "");
  const status = order.status || "Pending Verification";
  const statusClass = getStatusClass(status);

  const itemsRows = (order.items || []).map(item => `
    <tr>
      <td style="color:#1e293b; font-weight:600;">${escapeHtml(item.title || "Formulation")}</td>
      <td style="text-align:center; font-weight:700;">${item.quantity || 1}</td>
      <td style="text-align:right;">${formatNaira(item.price || 0)}</td>
      <td style="text-align:right; font-weight:700; color:#18422e;">${formatNaira((item.price || 0) * (item.quantity || 1))}</td>
    </tr>
  `).join("");

  modalBody.innerHTML = `
    <div class="receipt-header-banner">
      <img src="./images/logo-image.jpeg" alt="Remi Luxe Beauty Logo">
      <h2>REMI LUXE BEAUTY</h2>
      <p>Luxury Skincare & Botanical Formulations</p>
      <div style="font-size:0.75rem; color:#94A3B8; margin-top:4px;">Official Customer Purchase Invoice</div>
    </div>

    <div class="receipt-body">
      <!-- Order Ref & Date Banner -->
      <div class="receipt-ref-strip">
        <div>
          <div class="ref-title">Order Reference</div>
          <div class="ref-number">${escapeHtml(order.orderRef)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.78rem; color:#64748B;">Date Placed</div>
          <div style="font-size:0.88rem; font-weight:700; color:#1E293B;">${formatOrderDate(order.receivedAt)}</div>
          <span class="order-status-select ${statusClass}" style="display:inline-block; font-size:0.75rem; padding:2px 10px; margin-top:4px; pointer-events:none;">
            ${escapeHtml(status)}
          </span>
        </div>
      </div>

      <!-- Customer Details Table -->
      <h4 style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:#102e20; margin-bottom:10px; border-bottom:1.5px solid #E2E8F0; padding-bottom:6px;">
        Customer & Delivery Details
      </h4>
      <table class="receipt-details-table">
        <tr>
          <td class="label-col">Customer Name:</td>
          <td class="value-col">${escapeHtml(order.name || "Customer")}</td>
        </tr>
        <tr>
          <td class="label-col">Phone / WhatsApp:</td>
          <td class="value-col">
            <a href="tel:${cleanPhoneNum}" style="color:#102e20; text-decoration:none;">${escapeHtml(order.phone || "Not provided")}</a>
          </td>
        </tr>
        <tr>
          <td class="label-col">Email Address:</td>
          <td class="value-col">${escapeHtml(order.email || "Not provided")}</td>
        </tr>
        <tr>
          <td class="label-col">Delivery Address:</td>
          <td class="value-col">${escapeHtml(order.address || "Not provided")}, ${escapeHtml(order.state || "Lagos")} State, Nigeria</td>
        </tr>
        ${order.notes && order.notes !== 'None' ? `
        <tr>
          <td class="label-col">Special Instructions:</td>
          <td class="value-col" style="color:#B45309; font-style:italic;">${escapeHtml(order.notes)}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="label-col">Payment Method:</td>
          <td class="value-col">${escapeHtml(order.paymentMethod || "Direct Bank Transfer")}</td>
        </tr>
      </table>

      <!-- Ordered Items -->
      <h4 style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:#102e20; margin-bottom:10px; border-bottom:1.5px solid #E2E8F0; padding-bottom:6px;">
        Purchased Formulations
      </h4>
      <table class="receipt-items-table">
        <thead>
          <tr>
            <th style="text-align:left;">Item Formulation</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Financial Totals Box -->
      <div class="receipt-totals-box">
        <div class="receipt-total-row">
          <span>Items Subtotal:</span>
          <span>${formatNaira(order.subtotal || 0)}</span>
        </div>
        <div class="receipt-total-row">
          <span>Delivery / Courier Fee:</span>
          <span>${order.deliveryFee ? formatNaira(order.deliveryFee) : 'Free Delivery'}</span>
        </div>
        <div class="receipt-total-row grand-total">
          <span>Total Order Value:</span>
          <span style="color:#15803D;">${formatNaira(order.total || 0)}</span>
        </div>
      </div>

      <!-- Bank Verification Info -->
      <div style="background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px; padding:12px 16px; margin-bottom:10px;">
        <div style="font-size:0.82rem; font-weight:700; color:#166534; margin-bottom:3px;">
          🏦 Bank Transfer Reference Details
        </div>
        <div style="font-size:0.8rem; color:#14532D; line-height:1.5;">
          Bank Name: <strong>United Bank for Africa (UBA)</strong><br>
          Account Number: <strong>2155821394</strong><br>
          Account Name: <strong>REMI LUXE BEAUTY</strong>
        </div>
      </div>
    </div>

    <!-- Receipt Actions -->
    <div class="receipt-footer-actions">
      <button type="button" class="btn-print-receipt" onclick="window.print()">
        <span>🖨️ Print Invoice Receipt</span>
      </button>
    </div>
  `;

  modal.classList.add("open");
}

// Export all orders to Excel CSV
function exportOrdersToCSV() {
  if (adminOrders.length === 0) {
    alert("No orders available to export.");
    return;
  }

  const headers = [
    "Order Reference",
    "Date Placed",
    "Customer Name",
    "Phone Number",
    "Email Address",
    "Delivery Address",
    "State",
    "Special Notes",
    "Items Purchased",
    "Subtotal (NGN)",
    "Delivery Fee (NGN)",
    "Total (NGN)",
    "Payment Method",
    "Fulfillment Status"
  ];

  const rows = adminOrders.map(o => {
    const itemsSummary = (o.items || [])
      .map(i => `${i.quantity || 1}x ${i.title} (${formatNaira(i.price)})`)
      .join(" | ");

    return [
      `"${o.orderRef || ''}"`,
      `"${o.receivedAt ? new Date(o.receivedAt).toLocaleString('en-GB') : ''}"`,
      `"${(o.name || '').replace(/"/g, '""')}"`,
      `"${(o.phone || '').replace(/"/g, '""')}"`,
      `"${(o.email || '').replace(/"/g, '""')}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.state || 'Lagos').replace(/"/g, '""')}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      Number(o.subtotal) || 0,
      Number(o.deliveryFee) || 0,
      Number(o.total) || 0,
      `"${(o.paymentMethod || 'Bank Transfer').replace(/"/g, '""')}"`,
      `"${(o.status || 'Pending Verification').replace(/"/g, '""')}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `Remi_Luxe_Customer_Orders_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helpers
function getStatusClass(status) {
  switch (status) {
    case "Payment Confirmed":
      return "status-confirmed";
    case "Dispatched / In Transit":
      return "status-dispatched";
    case "Delivered":
      return "status-delivered";
    case "Cancelled":
      return "status-cancelled";
    case "Pending Verification":
    default:
      return "status-pending";
  }
}

function cleanNigerianPhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/[^\d+]/g, "");
  if (digits.startsWith("+234")) {
    return digits.substring(1);
  }
  if (digits.startsWith("234")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return "234" + digits.substring(1);
  }
  return digits;
}

function formatOrderDate(isoString) {
  if (!isoString) return "Recent";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) + ", " + date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function timeAgo(isoString) {
  if (!isoString) return "just now";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

