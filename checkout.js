const STANDARD_DELIVERY_FEE = 3500; // ₦3,500 for orders under ₦60k
const ACTIVE_VERIFICATION_KEY = "remi_active_verification_session";
let selectedPaymentMethod = "whatsapp"; // "whatsapp" or "bank"
let generatedOrderRef = "RLB-" + Math.floor(100000 + Math.random() * 900000);

function recordOrderLocally(orderData) {
  try {
    const key = "remi_luxe_orders";
    let orders = JSON.parse(localStorage.getItem(key) || "[]");
    const existingIdx = orders.findIndex(o => o.orderRef === orderData.orderRef);
    const orderRecord = {
      ...orderData,
      status: (existingIdx !== -1 && orders[existingIdx].status) ? orders[existingIdx].status : (orderData.status || "Pending Verification"),
      receivedAt: (existingIdx !== -1 && orders[existingIdx].receivedAt) ? orders[existingIdx].receivedAt : new Date().toISOString()
    };
    if (existingIdx !== -1) {
      orders[existingIdx] = orderRecord;
    } else {
      orders.unshift(orderRecord);
    }
    localStorage.setItem(key, JSON.stringify(orders));

    // Also proactively log order to backend server immediately (with cross-port fallback)
    let logEndpoints = ["/api/log-order"];
    if (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050"))) {
      logEndpoints = ["http://localhost:5050/api/log-order", "/api/log-order"];
    }
    for (const ep of logEndpoints) {
      fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderRecord)
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Notice: Local order record:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initInPageVerificationInteractions();
  const hasActiveSession = restoreActiveVerificationIfAny();
  
  if (!hasActiveSession) {
    renderCheckoutSummary();
  }
  
  initPaymentTabs();
  initCheckoutActions();
});

// Checks if the customer currently has an active order waiting for verification
function restoreActiveVerificationIfAny() {
  try {
    const saved = sessionStorage.getItem(ACTIVE_VERIFICATION_KEY);
    if (saved) {
      const orderData = JSON.parse(saved);
      if (orderData && orderData.orderRef) {
        showInPageVerificationView(orderData);
        return true;
      }
    }
  } catch (err) {
    console.warn("Notice: session restore:", err);
  }
  return false;
}

// Displays the dedicated in-page verification screen and hides the checkout form
function showInPageVerificationView(orderData) {
  const checkoutGrid = document.getElementById("checkout-grid-container");
  const verificationView = document.getElementById("checkout-verification-view");

  if (checkoutGrid) checkoutGrid.style.display = "none";
  if (verificationView) verificationView.style.display = "block";

  // Populate fields
  const refEl = document.getElementById("inpage-order-ref");
  const refCopyEl = document.getElementById("inpage-order-ref-copy");
  const nameEl = document.getElementById("inpage-customer-name");
  const totalEl = document.getElementById("inpage-order-total");
  const reviewNameEl = document.getElementById("inpage-review-customer-name");
  const btnWaProof = document.getElementById("btn-inpage-whatsapp-proof");

  if (refEl) refEl.textContent = orderData.orderRef;
  if (refCopyEl) refCopyEl.textContent = orderData.orderRef;
  if (nameEl) nameEl.textContent = orderData.name || "Customer";
  if (totalEl) totalEl.textContent = formatNaira(orderData.total || 0);
  if (reviewNameEl) reviewNameEl.value = orderData.name || "";

  if (btnWaProof) {
    const waMsg = encodeURIComponent(
      `Hello Remi Luxe Beauty, I just placed an order on your website.\n\nOrder Ref: ${orderData.orderRef}\nCustomer: ${orderData.name}\nAmount: ${formatNaira(orderData.total || 0)}\n\nHere is my transfer receipt screenshot:`
    );
    btnWaProof.href = `https://wa.me/2349013255068?text=${waMsg}`;
  }

  // Smooth scroll to top of verification screen
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// In-page verification view button handlers (Reviews, Star rating, New order, Return home)
function initInPageVerificationInteractions() {
  const starBtns = document.querySelectorAll("#inpage-star-rating-container .star-btn");
  const starInput = document.getElementById("inpage-selected-star-rating");
  const reviewForm = document.getElementById("inpage-post-payment-review-form");
  const successAlert = document.getElementById("inpage-comment-success-alert");
  const submitReviewBtn = document.getElementById("btn-inpage-submit-review");
  const btnReturnHome = document.getElementById("btn-inpage-return-home");
  const btnNewOrder = document.getElementById("btn-inpage-new-order");

  // Star Rating clicks
  starBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const rating = parseInt(btn.dataset.rating, 10);
      if (starInput) starInput.value = rating;

      starBtns.forEach(s => {
        const r = parseInt(s.dataset.rating, 10);
        if (r <= rating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  // Post-payment review submission
  reviewForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("inpage-review-customer-name")?.value.trim() || "Verified Buyer";
    const skinType = document.getElementById("inpage-review-skin-type")?.value.trim() || "Verified Customer";
    const rating = parseInt(starInput?.value || "5", 10);
    const comment = document.getElementById("inpage-review-comment-text")?.value.trim();

    if (!comment) {
      alert("Please enter a short comment or review.");
      return;
    }

    addReview({
      name,
      skinType,
      rating,
      comment
    });

    if (successAlert) {
      successAlert.style.display = "block";
    }

    if (submitReviewBtn) {
      submitReviewBtn.textContent = "✓ Comment Published to Home Page!";
      submitReviewBtn.disabled = true;
      submitReviewBtn.style.opacity = "0.7";
      submitReviewBtn.style.cursor = "default";
    }
  });

  // Return home clears session
  btnReturnHome?.addEventListener("click", () => {
    sessionStorage.removeItem(ACTIVE_VERIFICATION_KEY);
  });

  // Place another order clears session and restores checkout
  btnNewOrder?.addEventListener("click", () => {
    sessionStorage.removeItem(ACTIVE_VERIFICATION_KEY);
    const checkoutGrid = document.getElementById("checkout-grid-container");
    const verificationView = document.getElementById("checkout-verification-view");
    if (verificationView) verificationView.style.display = "none";
    if (checkoutGrid) checkoutGrid.style.display = "grid";
    generatedOrderRef = "RLB-" + Math.floor(100000 + Math.random() * 900000);
    renderCheckoutSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function renderCheckoutSummary() {
  const itemsContainer = document.getElementById("checkout-items-list");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const deliveryEl = document.getElementById("checkout-delivery");
  const totalEl = document.getElementById("checkout-total");

  const cart = getCart();

  if (!cart || cart.length === 0) {
    if (itemsContainer) {
      itemsContainer.innerHTML = `
        <div style="text-align:center; padding: 30px 10px; color: var(--color-text-muted);">
          <p style="font-size: 1rem; margin-bottom: 12px;">Your shopping bag is empty.</p>
          <a href="shop.html" style="font-size: 0.88rem; font-weight:700; color:var(--color-gold); border-bottom:1px solid var(--color-gold);">Return to Shop Catalog</a>
        </div>
      `;
    }
    if (subtotalEl) subtotalEl.textContent = formatNaira(0);
    if (deliveryEl) deliveryEl.textContent = formatNaira(0);
    if (totalEl) totalEl.textContent = formatNaira(0);
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div class="summary-item">
      <img src="${item.image}" alt="${escapeHtml(item.title)}">
      <div class="summary-item-info">
        <h4>${escapeHtml(item.title)}</h4>
        <span>Qty: ${item.quantity} × ${formatNaira(item.price)}</span>
      </div>
      <strong style="color:var(--color-dark); font-size:0.95rem;">${formatNaira(item.price * item.quantity)}</strong>
    </div>
  `).join("");

  const subtotal = getCartTotal();
  // Shipping fee is paid by receiver upon delivery to the rider
  const finalTotal = subtotal;

  if (subtotalEl) subtotalEl.textContent = formatNaira(subtotal);
  if (deliveryEl) {
    deliveryEl.innerHTML = `<span style="color:#B45309; font-weight:700; font-size:0.85rem;">Paid on Delivery (By Receiver)</span>`;
  }
  if (totalEl) totalEl.textContent = formatNaira(finalTotal);

  // Set order reference in bank box
  const refEl = document.getElementById("order-reference-display");
  if (refEl) refEl.textContent = generatedOrderRef;
}

function initPaymentTabs() {
  const tabWhatsapp = document.getElementById("tab-whatsapp");
  const tabBank = document.getElementById("tab-bank");
  const whatsappSection = document.getElementById("section-whatsapp-checkout");
  const bankSection = document.getElementById("section-bank-checkout");

  tabWhatsapp?.addEventListener("click", () => {
    tabWhatsapp.classList.add("active");
    tabBank?.classList.remove("active");
    selectedPaymentMethod = "whatsapp";
    if (whatsappSection) whatsappSection.style.display = "block";
    if (bankSection) bankSection.style.display = "none";
  });

  tabBank?.addEventListener("click", () => {
    tabBank.classList.add("active");
    tabWhatsapp?.classList.remove("active");
    selectedPaymentMethod = "bank";
    if (bankSection) bankSection.style.display = "block";
    if (whatsappSection) whatsappSection.style.display = "none";
  });
}

function initCheckoutActions() {
  const btnWhatsapp = document.getElementById("btn-submit-whatsapp");
  const btnBankConfirm = document.getElementById("btn-confirm-transfer");

  // WhatsApp Order Submission
  btnWhatsapp?.addEventListener("click", () => {
    const cart = getCart();
    if (!cart || cart.length === 0) {
      alert("Your shopping bag is empty. Please add items before checking out.");
      return;
    }

    const name = document.getElementById("cust-name")?.value.trim();
    const phone = document.getElementById("cust-phone")?.value.trim();
    const address = document.getElementById("cust-address")?.value.trim();
    const state = document.getElementById("cust-state")?.value || "Lagos";
    const notes = document.getElementById("cust-notes")?.value.trim() || "None";

    if (!name || !phone || !address) {
      alert("Please fill in your Full Name, Phone / WhatsApp number, and Delivery Address.");
      return;
    }

    const subtotal = getCartTotal();
    const delivery = "Paid on Delivery (To Rider)";
    const total = subtotal; // Total due now for formulations

    const itemsSummary = cart.map(item => `• ${item.title} (x${item.quantity}) - ${formatNaira(item.price * item.quantity)}`).join("\n");

    const message = 
`✨ *NEW ORDER - REMI LUXE BEAUTY* ✨
Order Reference: *${generatedOrderRef}*

*Customer Details:*
• Name: ${name}
• Phone/WhatsApp: ${phone}
• Delivery Address: ${address}, ${state} State
• Delivery Notes: ${notes}

*Items Ordered:*
${itemsSummary}

*Subtotal:* ${formatNaira(subtotal)}
*Delivery Fee:* Paid by Receiver on Delivery (To Rider)
*TOTAL AMOUNT TO PAY NOW:* *${formatNaira(total)}*

Please confirm availability and share payment confirmation!`;

    // Open WhatsApp in new tab
    const waUrl = `https://wa.me/2349013255068?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    const orderPayload = {
      orderRef: generatedOrderRef,
      name,
      phone,
      email: document.getElementById("cust-email")?.value.trim() || "",
      address,
      state,
      notes,
      items: cart,
      subtotal,
      deliveryFee: "Paid on Delivery (By Receiver)",
      total,
      paymentMethod: "WhatsApp Order Checkout"
    };

    // Save locally for instant admin tracking & dispatch email
    recordOrderLocally(orderPayload);
    sendOrderNotificationEmail(orderPayload);
    sessionStorage.setItem(ACTIVE_VERIFICATION_KEY, JSON.stringify(orderPayload));

    // Show persistent verification screen & clear cart
    clearCart();
    showInPageVerificationView(orderPayload);
  });

  // Direct Bank Transfer Submission
  btnBankConfirm?.addEventListener("click", async () => {
    const cart = getCart();
    if (!cart || cart.length === 0) {
      alert("Your shopping bag is empty. Please add formulations before checking out.");
      return;
    }

    const name = document.getElementById("cust-name")?.value.trim();
    const phone = document.getElementById("cust-phone")?.value.trim();
    const address = document.getElementById("cust-address")?.value.trim();
    const state = document.getElementById("cust-state")?.value || "Lagos";
    const notes = document.getElementById("cust-notes")?.value.trim() || "None";
    const email = document.getElementById("cust-email")?.value.trim() || "";

    if (!name || !phone || !address) {
      alert("Please complete your Full Name, Phone / WhatsApp number, and Delivery Address.");
      return;
    }

    const subtotal = getCartTotal();
    const total = subtotal; // Total due now to bank account

    const orderPayload = {
      orderRef: generatedOrderRef,
      name,
      phone,
      email,
      address,
      state,
      notes,
      items: cart,
      subtotal,
      deliveryFee: "Paid on Delivery (By Receiver)",
      total,
      paymentMethod: "Direct Bank Transfer (Opay: 9013255068)"
    };

    // Show button loading state
    const originalBtnHtml = btnBankConfirm.innerHTML;
    btnBankConfirm.innerHTML = `<span>⏳ Submitting Order For Bank Verification...</span>`;
    btnBankConfirm.disabled = true;

    // 1. Save locally for instant admin tracking
    recordOrderLocally(orderPayload);

    // 2. Persist in sessionStorage so page reload NEVER kicks customer back to form
    sessionStorage.setItem(ACTIVE_VERIFICATION_KEY, JSON.stringify(orderPayload));

    // 3. Dispatch email notification to store owner (with safety timeout)
    try {
      await Promise.race([
        sendOrderNotificationEmail(orderPayload),
        new Promise(resolve => setTimeout(resolve, 4000))
      ]);
    } catch (e) {
      console.warn("Notice: Email dispatch:", e);
    }

    // 4. Clear shopping cart bag
    clearCart();

    // 5. Render dedicated in-page verification view
    showInPageVerificationView(orderPayload);

    btnBankConfirm.innerHTML = originalBtnHtml;
    btnBankConfirm.disabled = false;
  });
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
