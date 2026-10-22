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

  const editModal = document.getElementById("edit-product-modal");
  document.getElementById("edit-prod-id").value = product.id;
  document.getElementById("edit-prod-title").value = product.title;
  document.getElementById("edit-prod-category").value = product.category;
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
          <div style="display: flex; gap: 8px;">
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

  const total = products.length;
  const inStock = products.filter(p => p.inStock !== false).length;
  const outStock = total - inStock;
  const avgPrice = total > 0 ? (products.reduce((acc, p) => acc + p.price, 0) / total) : 0;

  if (totalCountEl) totalCountEl.textContent = total;
  if (inStockEl) inStockEl.textContent = inStock;
  if (outStockEl) outStockEl.textContent = outStock;
  if (avgPriceEl) avgPriceEl.textContent = formatNaira(avgPrice);
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
