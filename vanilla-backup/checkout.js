const STANDARD_DELIVERY_FEE = 3500; // ₦3,500 for orders under ₦60k
let selectedPaymentMethod = "whatsapp"; // "whatsapp" or "bank"
let generatedOrderRef = "RLB-" + Math.floor(100000 + Math.random() * 900000);

document.addEventListener("DOMContentLoaded", () => {
  renderCheckoutSummary();
  initPaymentTabs();
  initCheckoutActions();
});

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
  const isFreeDelivery = subtotal >= FREE_SHIPPING_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const finalTotal = subtotal + deliveryFee;

  if (subtotalEl) subtotalEl.textContent = formatNaira(subtotal);
  if (deliveryEl) {
    deliveryEl.innerHTML = isFreeDelivery 
      ? `<span style="color:#2E7D32; font-weight:700;">FREE (Nationwide)</span>` 
      : formatNaira(deliveryFee);
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
  const successModal = document.getElementById("checkout-success-modal");
  const closeSuccessBtn = document.getElementById("close-success-btn");

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
    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    const delivery = isFree ? "FREE" : formatNaira(STANDARD_DELIVERY_FEE);
    const total = isFree ? subtotal : subtotal + STANDARD_DELIVERY_FEE;

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
*Delivery:* ${delivery}
*TOTAL AMOUNT:* *${formatNaira(total)}*

Please confirm availability and share payment/delivery schedule!`;

    const waUrl = `https://wa.me/2349013255068?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    // Automatically send order email to business owner (remigold049@gmail.com)
    sendOrderNotificationEmail({
      orderRef: generatedOrderRef,
      name,
      phone,
      email: document.getElementById("cust-email")?.value.trim() || "",
      address,
      state,
      notes,
      items: cart,
      subtotal,
      deliveryFee: isFree ? 0 : STANDARD_DELIVERY_FEE,
      total,
      paymentMethod: "WhatsApp Order Checkout"
    });

    // Also open modal so user can leave a review / comment
    const modalRef = document.getElementById("modal-order-ref");
    if (modalRef) modalRef.textContent = generatedOrderRef;
    const reviewNameInput = document.getElementById("review-customer-name");
    if (reviewNameInput && name) reviewNameInput.value = name;

    setTimeout(() => {
      successModal?.classList.add("open");
      clearCart();
      renderCheckoutSummary();
    }, 800);
  });

  // Bank Transfer Confirmation
  btnBankConfirm?.addEventListener("click", () => {
    const cart = getCart();
    if (!cart || cart.length === 0) {
      alert("Your shopping bag is empty.");
      return;
    }

    const name = document.getElementById("cust-name")?.value.trim();
    const phone = document.getElementById("cust-phone")?.value.trim();
    const address = document.getElementById("cust-address")?.value.trim();
    const state = document.getElementById("cust-state")?.value || "Lagos";
    const notes = document.getElementById("cust-notes")?.value.trim() || "None";
    const email = document.getElementById("cust-email")?.value.trim() || "";

    if (!name || !phone || !address) {
      alert("Please complete your Name, Phone Number, and Delivery Address before confirming payment.");
      return;
    }

    const subtotal = getCartTotal();
    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    const deliveryFee = isFree ? 0 : STANDARD_DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    // Automatically send order email to business owner (remigold049@gmail.com)
    sendOrderNotificationEmail({
      orderRef: generatedOrderRef,
      name,
      phone,
      email,
      address,
      state,
      notes,
      items: cart,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: "Direct Bank Transfer (UBA Bank: 2155821394)"
    });

    // Populate modal reference and customer name in review box
    const modalRef = document.getElementById("modal-order-ref");
    if (modalRef) modalRef.textContent = generatedOrderRef;
    const reviewNameInput = document.getElementById("review-customer-name");
    if (reviewNameInput && name) reviewNameInput.value = name;

    successModal?.classList.add("open");

    // Clear cart once order is placed
    clearCart();
    renderCheckoutSummary();
  });

  closeSuccessBtn?.addEventListener("click", () => {
    successModal?.classList.remove("open");
    window.location.href = "index.html";
  });

  initPostPaymentReview();
}

// Post-payment review and star rating interaction
function initPostPaymentReview() {
  const stars = document.querySelectorAll(".star-btn");
  const starInput = document.getElementById("selected-star-rating");
  const reviewForm = document.getElementById("post-payment-review-form");
  const successAlert = document.getElementById("comment-success-alert");
  const submitBtn = document.getElementById("btn-submit-review");

  stars.forEach(btn => {
    btn.addEventListener("click", () => {
      const rating = parseInt(btn.dataset.rating, 10);
      if (starInput) starInput.value = rating;

      stars.forEach(s => {
        const r = parseInt(s.dataset.rating, 10);
        if (r <= rating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  reviewForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("review-customer-name")?.value.trim() || "Verified Buyer";
    const skinType = document.getElementById("review-skin-type")?.value.trim() || "Verified Customer";
    const rating = parseInt(starInput?.value || "5", 10);
    const comment = document.getElementById("review-comment-text")?.value.trim();

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

    if (submitBtn) {
      submitBtn.textContent = "✓ Comment Published to Home Page!";
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
      submitBtn.style.cursor = "default";
    }
  });
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
