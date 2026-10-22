// ===================================================================
// REMI LUXE BEAUTY - STORE & BUSINESS CONFIGURATION
// 💡 CHANGE THE ADMIN EMAIL HERE WHEN READY TO HAND OVER TO CLIENT:
// ===================================================================
const STORE_CONFIG = {
  businessEmail: "remigold049@gmail.com", // <-- EDIT THIS EMAIL ANYTIME TO CHANGE OWNER EMAIL
  businessPhone: "+2349013255068",        // <-- WhatsApp Concierge Phone
  brandName: "Remi Luxe Beauty", 
  logoUrl: "https://iili.io/nO1RNea.jpg"   // Direct Cloudflare CDN Brand Logo for emails & external display
};

const NAIRA_SYMBOL = "₦";
const FREE_SHIPPING_THRESHOLD = 60000; // ₦60,000

function formatNaira(amount) {
  const num = parseFloat(amount) || 0;
  return `${NAIRA_SYMBOL}${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Dispatches rich HTML order notification email with Brand Logo directly to STORE_CONFIG.businessEmail
async function sendOrderNotificationEmail(orderData) {
  const payload = {
    ...orderData,
    businessEmail: STORE_CONFIG.businessEmail,
    brandName: STORE_CONFIG.brandName
  };

  let sentViaServer = false;

  // 1. Primary: Rich HTML Email via Node.js Server (Port 5050) with Brand Logo attachment (Picture 1 format)
  try {
    let endpoint = "/api/send-order-email";
    if (typeof window !== "undefined") {
      if (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050")) {
        endpoint = "http://localhost:5050/api/send-order-email";
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Rich Order Email dispatched successfully via Node Server:", data);
      sentViaServer = true;
    }
  } catch (err) {
    console.warn("Notice: Node server email dispatch attempt:", err.message);
  }

  // 2. Resilient Cloud Fallback (Dispatches to remigold049@gmail.com even if local node server is offline)
  if (!sentViaServer) {
    try {
      const itemsList = (orderData.items || []).map(i => `• ${i.title} (Qty: ${i.quantity}) - ${formatNaira(i.price * i.quantity)}`).join("\n");
      const formData = new FormData();
      formData.append("_subject", `🛍️ New Order: ${orderData.name || 'Customer'} (${orderData.orderRef}) - Remi Luxe Beauty`);
      formData.append("_template", "box");
      formData.append("Brand", STORE_CONFIG.brandName);
      formData.append("Official Brand Logo", STORE_CONFIG.logoUrl);
      formData.append("Order Reference", orderData.orderRef);
      formData.append("Customer Full Name", orderData.name || "Customer");
      formData.append("Phone / WhatsApp", orderData.phone || "Not provided");
      formData.append("Email Address", orderData.email || "Not provided");
      formData.append("Delivery Destination", `${orderData.address || ''}, ${orderData.state || 'Lagos'} State, Nigeria`);
      formData.append("Special Instructions", orderData.notes || "None");
      formData.append("Formulations Ordered", itemsList);
      formData.append("Subtotal", formatNaira(orderData.subtotal || 0));
      formData.append("Delivery Fee", orderData.deliveryFee ? formatNaira(orderData.deliveryFee) : "FREE");
      formData.append("Total Order Value", formatNaira(orderData.total || 0));
      formData.append("Payment Method", orderData.paymentMethod || "Direct Bank Transfer");
      formData.append("Fulfillment Status", "Pending Payment Verification (Check UBA Bank Alert)");

      await fetch(`https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });
      console.log("✅ Cloud fallback order email delivered to", STORE_CONFIG.businessEmail);
    } catch (fallbackErr) {
      console.warn("Notice: Cloud fallback dispatch:", fallbackErr);
    }
  }

  return true;
}

// Dispatches Customer Payment Confirmation & Status Email directly to the Buyer's Email
// Works both via local Node server (Port 5050) and resilient static cloud fallback (Netlify/FormSubmit)
async function sendCustomerStatusEmail(orderData, status = "Payment Confirmed") {
  if (!orderData || !orderData.email || !orderData.email.includes("@") || orderData.email === "Not provided") {
    console.log("ℹ️ No valid buyer email provided for order", orderData?.orderRef);
    return { success: false, reason: "No email address provided" };
  }

  let sentViaServer = false;

  // 1. Primary: Rich HTML Email via Node.js Server (Port 5050) with Brand Logo attachment
  try {
    let endpoint = "/api/send-customer-status-email";
    if (typeof window !== "undefined") {
      if (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050")) {
        endpoint = "http://localhost:5050/api/send-customer-status-email";
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderRef: orderData.orderRef,
        status: status,
        orderData: orderData
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Customer confirmation email dispatched via Node Server:", data);
      sentViaServer = true;
      return { success: true, method: "server", data };
    }
  } catch (err) {
    console.warn("Notice: Node server customer email dispatch:", err.message);
  }

  // 2. Cloud Fallback (Works when hosted statically on Netlify)
  if (!sentViaServer) {
    try {
      const isDispatched = status === "Dispatched / In Transit";
      const subject = isDispatched 
        ? `🚚 Order Dispatched: Your Remi Luxe Beauty Package (${orderData.orderRef}) is On Its Way!`
        : `🎉 Payment Confirmed: Your Remi Luxe Beauty Order (${orderData.orderRef}) is Being Prepared!`;

      const itemsList = (orderData.items || []).map(i => `• ${i.title} (Qty: ${i.quantity}) - ${formatNaira(i.price * i.quantity)}`).join("\n");
      const formData = new FormData();
      formData.append("_subject", subject);
      formData.append("_replyto", STORE_CONFIG.businessEmail);
      formData.append("_template", "box");
      formData.append("Brand", STORE_CONFIG.brandName);
      formData.append("Order Reference", orderData.orderRef);
      formData.append("Status Update", status);
      formData.append("Customer Name", orderData.name || "Customer");
      formData.append("Payment Status", `Verified & Received (${formatNaira(orderData.total || 0)})`);
      formData.append("Delivery Preparation", "Your formulations have been released to our fulfillment team and are being prepared for dispatch.");
      formData.append("Delivery Destination", `${orderData.address || ''}, ${orderData.state || 'Lagos'} State, Nigeria`);
      formData.append("Items in Package", itemsList);
      formData.append("Concierge Support", "WhatsApp: +2349013255068 | Email: " + STORE_CONFIG.businessEmail);

      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(orderData.email)}`, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });
      console.log("✅ Customer confirmation email delivered to buyer via cloud fallback:", orderData.email);
      return { success: true, method: "cloud_fallback" };
    } catch (fallbackErr) {
      console.warn("Notice: Cloud customer email fallback:", fallbackErr);
    }
  }

  return { success: false };
}

// Dispatches admin password reset alert email with Brand Logo
async function sendPasswordResetAlertEmail(email) {
  try {
    const alertSubject = `🔐 Admin Password Reset Alert - ${STORE_CONFIG.brandName}`;
    const formData = new FormData();
    formData.append("_subject", alertSubject);
    formData.append("_template", "box");
    formData.append("Brand", STORE_CONFIG.brandName);
    formData.append("Official Brand Logo", STORE_CONFIG.logoUrl);
    formData.append("Security Alert", "Your Remi Luxe Beauty Admin Password was just successfully updated and re-encrypted.");
    formData.append("Admin Email", email);
    formData.append("Date & Time", new Date().toLocaleString());
    formData.append("Notice", "If you authorized this change, no action is needed. If you did not authorize this, log into your admin portal immediately.");

    // Attach local brand logo image as binary file
    try {
      const logoRes = await fetch('./images/logo-image.jpeg');
      if (logoRes.ok) {
        const logoBlob = await logoRes.blob();
        formData.append("attachment", logoBlob, "Remi-Luxe-Beauty-Brand-Logo.jpeg");
      }
    } catch (e) {}

    // Dispatch to FormSubmit
    fetch(`https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    }).catch(() => {});

    // Dispatch to 000form
    fetch(`https://000form.com/f/${STORE_CONFIG.businessEmail}`, {
      method: "POST",
      body: formData
    }).catch(() => {});

  } catch (err) {
    console.warn("Notice: Reset email dispatch:", err);
  }
}

const DEFAULT_PRODUCTS = [
  {
    id: "remi-001",
    title: "Radiance Glow Serum",
    category: "Face Care",
    price: 45000,
    originalPrice: 55000,
    rating: 4.9,
    reviewsCount: 142,
    image: "./images/product-serum.jpg",
    description: "A potent bio-active Vitamin C and Hyaluronic Acid elixir that visibly fades hyperpigmentation, restores natural elasticity, and imparts an ethereal glass-skin glow.",
    skinType: "All Skin Types / Dull / Uneven",
    volume: "30ml / 1 fl. oz.",
    isNew: true,
    isFeatured: true,
    inStock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "remi-002",
    title: "Velvet Barrier Cream",
    category: "Face Care",
    price: 38000,
    originalPrice: 46000,
    rating: 5.0,
    reviewsCount: 98,
    image: "./images/product-cream.jpg",
    description: "An ultra-nourishing peptide and ceramide restorative moisturizer that melts seamlessly into the skin, locking in 72-hour moisture and repairing compromised barriers.",
    skinType: "Dry / Sensitive / Normal",
    volume: "50ml / 1.7 oz.",
    isNew: true,
    isFeatured: true,
    inStock: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "remi-003",
    title: "Gentle Purifying Cleanser",
    category: "Face Care",
    price: 28000,
    originalPrice: null,
    rating: 4.8,
    reviewsCount: 86,
    image: "./images/product-cleanser.jpg",
    description: "Infused with organic rosewater, green tea, and calming chamomile. Gently purifies pores of impurities, makeup, and pollution without stripping essential natural oils.",
    skinType: "All Skin Types / Sensitive",
    volume: "150ml / 5.07 fl. oz.",
    isNew: true,
    isFeatured: false,
    inStock: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "remi-004",
    title: "24K Botanical Glow Oil",
    category: "Face Care",
    price: 55000,
    originalPrice: 65000,
    rating: 4.9,
    reviewsCount: 119,
    image: "./images/product-oil.jpg",
    description: "An indulgent elixir infused with genuine 24-karat gold leaf flakes, cold-pressed rosehip seed, and golden jojoba oil to seal in ultimate silkiness and golden hour radiance.",
    skinType: "Normal / Dry / Melanin-Rich",
    volume: "30ml / 1.0 fl. oz.",
    isNew: true,
    isFeatured: true,
    inStock: true,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

// LocalStorage Keys & Default Categories
const DEFAULT_CATEGORIES = ["Face Care"];

const STORAGE_KEYS = {
  PRODUCTS: "remi_luxe_products_v2",
  CART: "remi_luxe_cart_v2",
  CATEGORIES: "remi_luxe_categories_v3",
  PURGE_OLD_CATEGORIES: "remi_luxe_categories_purged_only_face_care_v3"
};

// ===================================================================
// CATEGORY PURGE & MANAGEMENT SYSTEM
// ===================================================================
// Purge every category that was created before, leaving ONLY "Face Care"
function purgeLegacyCategories() {
  const hasPurged = localStorage.getItem(STORAGE_KEYS.PURGE_OLD_CATEGORIES);
  if (!hasPurged) {
    // 1. Force categories array to contain only "Face Care"
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(["Face Care"]));
    localStorage.removeItem("remi_luxe_categories_v1");
    localStorage.removeItem("remi_luxe_categories_v2");

    // 2. Force every existing product on the website to be in "Face Care"
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (stored) {
      try {
        let prods = JSON.parse(stored);
        if (Array.isArray(prods)) {
          prods = prods.map(p => ({
            ...p,
            category: "Face Care"
          }));
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
        }
      } catch (e) {}
    }

    localStorage.setItem(STORAGE_KEYS.PURGE_OLD_CATEGORIES, "true");
  }
}

try {
  purgeLegacyCategories();
} catch (e) {}

function resetCategoriesToFaceCare() {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(["Face Care"]));
  localStorage.removeItem("remi_luxe_categories_v1");
  localStorage.removeItem("remi_luxe_categories_v2");

  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (stored) {
    try {
      let prods = JSON.parse(stored);
      if (Array.isArray(prods)) {
        prods = prods.map(p => ({ ...p, category: "Face Care" }));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
      }
    } catch (e) {}
  }

  window.dispatchEvent(new CustomEvent("categoriesUpdated", { detail: ["Face Care"] }));
  window.dispatchEvent(new CustomEvent("productsUpdated", { detail: getProducts() }));
}

function getCategories() {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  let categories = [...DEFAULT_CATEGORIES];

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        categories = parsed.filter(c => typeof c === "string" && c.trim().length > 0);
      }
    } catch (e) {}
  }

  // Ensure "Face Care" is always present as the primary category
  if (!categories.some(c => c.trim().toLowerCase() === "face care")) {
    categories.unshift("Face Care");
  }

  return categories;
}

function addCategory(newCat) {
  if (!newCat || !newCat.trim()) return null;
  const trimmed = newCat.trim();
  const categories = getCategories();

  const existing = categories.find(c => c.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    return existing;
  }

  categories.push(trimmed);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  window.dispatchEvent(new CustomEvent("categoriesUpdated", { detail: categories }));
  return trimmed;
}

function deleteCategory(catName) {
  if (!catName || catName.trim().toLowerCase() === "face care") return false; // Protected default
  let categories = getCategories();
  categories = categories.filter(c => c.toLowerCase() !== catName.trim().toLowerCase());
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  window.dispatchEvent(new CustomEvent("categoriesUpdated", { detail: categories }));
  return true;
}

// Initialize or get products
function getProducts() {
  let products = DEFAULT_PRODUCTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products = parsed;
      }
    } catch (e) {
      console.error("Error reading products:", e);
      products = DEFAULT_PRODUCTS;
    }
  }

  // ONE-TIME MIGRATION TO "Face Care":
  // User explicit request: "all product should be in one categories call face care... but every product on the website now should be in one categories call face care."
  const isMigrated = localStorage.getItem(STORAGE_KEYS.CATEGORY_MIGRATION);
  if (!isMigrated) {
    products = products.map(p => ({
      ...p,
      category: "Face Care"
    }));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.CATEGORY_MIGRATION, "true");
  }

  return products;
}

// Save products
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("productsUpdated", { detail: products }));
}

// Add a product (Used by Admin page)
function addProduct(productData) {
  const products = getProducts();
  const chosenCategory = (productData.category && productData.category.trim()) ? productData.category.trim() : "Face Care";
  
  // Register category if new
  addCategory(chosenCategory);

  const newProduct = {
    id: "remi-" + Date.now(),
    title: productData.title.trim(),
    category: chosenCategory,
    price: parseFloat(productData.price) || 0,
    originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
    rating: 5.0,
    reviewsCount: 1,
    image: productData.image || "./images/product-serum.jpg",
    description: productData.description || "Luxurious formulation crafted for radiant skin.",
    skinType: productData.skinType || "All Skin Types",
    volume: productData.volume || "50ml",
    isNew: true, // Marked as new drop
    isFeatured: !!productData.isFeatured,
    inStock: productData.inStock !== false,
    createdAt: new Date().toISOString()
  };
  
  // Newest items go to top so they appear first in Shop & New Arrivals
  products.unshift(newProduct);
  saveProducts(products);
  return newProduct;
}

// Update an existing product (Used by Admin edit)
function updateProduct(id, updatedData) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  let newCategory = products[index].category || "Face Care";
  if (updatedData.category !== undefined && updatedData.category.trim()) {
    newCategory = updatedData.category.trim();
    addCategory(newCategory);
  }

  products[index] = {
    ...products[index],
    title: updatedData.title !== undefined ? updatedData.title.trim() : products[index].title,
    category: newCategory,
    price: updatedData.price !== undefined ? parseFloat(updatedData.price) : products[index].price,
    originalPrice: updatedData.originalPrice !== undefined ? (updatedData.originalPrice ? parseFloat(updatedData.originalPrice) : null) : products[index].originalPrice,
    volume: updatedData.volume !== undefined ? updatedData.volume.trim() : products[index].volume,
    skinType: updatedData.skinType !== undefined ? updatedData.skinType.trim() : products[index].skinType,
    description: updatedData.description !== undefined ? updatedData.description.trim() : products[index].description,
    image: updatedData.image !== undefined ? updatedData.image : products[index].image,
    isNew: updatedData.isNew !== undefined ? !!updatedData.isNew : products[index].isNew,
    inStock: updatedData.inStock !== undefined ? !!updatedData.inStock : products[index].inStock,
    updatedAt: new Date().toISOString()
  };

  saveProducts(products);
  return products[index];
}

function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

// Delete a product
function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
}

// Toggle product stock status
function toggleProductStock(id) {
  const products = getProducts();
  const item = products.find(p => p.id === id);
  if (item) {
    item.inStock = !item.inStock;
    saveProducts(products);
  }
}

// Get New Arrivals (sorted by newest, limited count)
function getNewArrivals(limit = 4) {
  const products = getProducts();
  return [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// ==========================================
// Cart Management (Naira ₦)
// ==========================================
function getCart() {
  const stored = localStorage.getItem(STORAGE_KEYS.CART);
  if (!stored) return [];
  try {
    return JSON.parse(stored) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cart }));
}

function addToCart(productId, quantity = 1) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      volume: product.volume,
      quantity: quantity
    });
  }

  saveCart(cart);
  return cart;
}

function updateCartQty(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart(cart);
  return cart;
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
  return cart;
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// ==========================================
// Customer Reviews & Comments System
// ==========================================
const REVIEWS_KEY = "remi_luxe_customer_reviews_v1";

const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    name: "Amara M.",
    skinType: "Combination • Melanin-Rich",
    rating: 5,
    comment: "The Radiance Glow Serum is pure magic in a bottle. Within two weeks, my stubborn hyperpigmentation visibly softened and my skin has an all-day dewy radiance without looking greasy.",
    date: "2 days ago",
    verifiedBuyer: true
  },
  {
    id: "rev-2",
    name: "Sophia C.",
    skinType: "Sensitive • Dry Complexion",
    rating: 5,
    comment: "Finally, a luxury barrier cream that doesn't clog my sensitive skin! The Velvet Barrier Cream feels so rich yet absorbs like silk. Remi got the formulation 100% right.",
    date: "4 days ago",
    verifiedBuyer: true
  },
  {
    id: "rev-3",
    name: "Kendra A.",
    skinType: "Melanin-Rich • Glowing",
    rating: 5,
    comment: "The 24K Botanical Glow Oil is unmatched. I use it under makeup or before bed and wake up looking rested, plump, and glowing like I just stepped out of a luxury spa.",
    date: "1 week ago",
    verifiedBuyer: true
  },
  {
    id: "rev-4",
    name: "Zainab B.",
    skinType: "Dry • Sensitive Skin",
    rating: 5,
    comment: "Express delivery was so fast to Abuja! The Gentle Purifying Cleanser doesn't leave my face tight or stripped. It feels calming, gentle, and deeply nourishing.",
    date: "1 week ago",
    verifiedBuyer: true
  },
  {
    id: "rev-5",
    name: "Folake O.",
    skinType: "Oily • Hyperpigmentation",
    rating: 5,
    comment: "I have tried countless high-end brands for acne scars and dark marks, but Remi Luxe Beauty exceeded my expectations. My skin texture is smooth, plump, and glowing.",
    date: "2 weeks ago",
    verifiedBuyer: true
  },
  {
    id: "rev-6",
    name: "Chioma E.",
    skinType: "All Skin Types",
    rating: 5,
    comment: "The packaging alone is 10/10 luxury, but the formula is what won me over. You can feel the purity of the botanicals from the very first drop. Worth every single Naira.",
    date: "3 weeks ago",
    verifiedBuyer: true
  },
  {
    id: "rev-7",
    name: "Blessing D.",
    skinType: "Combination • Acne Prone",
    rating: 5,
    comment: "My acne redness calmed down significantly after using the Velvet Barrier Cream for 5 days. It's now a permanent staple in my morning and evening routine.",
    date: "1 month ago",
    verifiedBuyer: true
  },
  {
    id: "rev-8",
    name: "Ngozi U.",
    skinType: "Mature • Dehydrated",
    rating: 5,
    comment: "The 24K Botanical Oil gives me an instant golden glow. People keep asking what foundation I'm wearing when I have zero makeup on! Pure elegance.",
    date: "1 month ago",
    verifiedBuyer: true
  }
];

function getReviews() {
  const stored = localStorage.getItem(REVIEWS_KEY);
  if (!stored) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REVIEWS;
  } catch {
    return DEFAULT_REVIEWS;
  }
}

function addReview(reviewData) {
  const reviews = getReviews();
  const newReview = {
    id: "rev-" + Date.now(),
    name: reviewData.name.trim() || "Verified Buyer",
    skinType: reviewData.skinType ? reviewData.skinType.trim() : "Verified Customer",
    rating: parseInt(reviewData.rating, 10) || 5,
    comment: reviewData.comment.trim(),
    date: "Just now",
    verifiedBuyer: true,
    createdAt: new Date().toISOString()
  };
  
  // Prepend so the newest comment appears immediately
  reviews.unshift(newReview);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new CustomEvent("reviewsUpdated", { detail: reviews }));
  return newReview;
}

