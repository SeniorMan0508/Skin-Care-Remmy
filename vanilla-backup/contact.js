// ===================================================================
// REMI LUXE BEAUTY - CONTACT PAGE LOGIC (contact.js)
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
  setupContactForm();
  setupFaqAccordion();
  updateCartBadge();
  setupCartDrawer();
});

// FAQ Accordion
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    questionBtn?.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      faqItems.forEach(i => i.classList.remove("active"));
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

// Contact & Skincare Consultation Form
function setupContactForm() {
  const form = document.getElementById("contact-form");
  const successNotice = document.getElementById("form-success-notice");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("contact-name")?.value || "";
    const phone = document.getElementById("contact-phone")?.value || "";
    const skinConcern = document.getElementById("contact-concern")?.value || "General Skincare";
    const message = document.getElementById("contact-message")?.value || "";

    // Dispatch inquiry email to STORE_CONFIG.businessEmail
    const email = document.getElementById("contact-email")?.value || "";
    const emailEndpoint = (typeof STORE_CONFIG !== "undefined" && STORE_CONFIG.businessEmail)
      ? `https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`
      : "https://formsubmit.co/ajax/remigold049@gmail.com";

    fetch(emailEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `💌 New Customer Inquiry from ${name} - Remi Luxe Beauty`,
        _template: "box",
        "Sender Name": name,
        "Customer Email": email,
        "Phone / WhatsApp": phone,
        "Skin Concern": skinConcern,
        "Message": message,
        "Date": new Date().toLocaleString()
      })
    }).catch(err => console.warn("Notice: Inquiry email dispatch:", err));

    // Show on-page confirmation
    if (successNotice) {
      successNotice.style.display = "block";
      form.reset();
    }

    // Optional direct WhatsApp forward button
    const forwardWhatsApp = confirm("✨ Message received! Would you also like to send this inquiry directly to our WhatsApp Concierge for an instant response?");
    if (forwardWhatsApp) {
      const text = encodeURIComponent(
        `Hello Remi Luxe Beauty! ✨\n\nMy name is ${name}.\nPhone: ${phone}\nSkin Concern: ${skinConcern}\n\nMessage: ${message}`
      );
      window.open(`https://wa.me/2349013255068?text=${text}`, "_blank");
    }
  });
}

// Cart badge and drawer integration
function updateCartBadge() {
  const badge = document.getElementById("cart-badge-count");
  if (badge) {
    badge.textContent = getCartCount();
  }
}

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
  if (!itemsContainer) return;

  const cart = getCart();
  if (cart.length === 0) {
    itemsContainer.innerHTML = `<p style="text-align:center; padding: 40px 10px; color: #888;">Your bag is empty.</p>`;
    if (subtotalEl) subtotalEl.textContent = formatNaira(0);
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div style="display: flex; gap: 12px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #eee;">
      <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
      <div style="flex-grow: 1;">
        <h4 style="font-size: 0.9rem;">${item.title}</h4>
        <span style="font-size: 0.8rem; color: #888;">Qty: ${item.quantity} × ${formatNaira(item.price)}</span>
      </div>
      <strong>${formatNaira(item.price * item.quantity)}</strong>
    </div>
  `).join("");

  if (subtotalEl) subtotalEl.textContent = formatNaira(getCartTotal());
}
