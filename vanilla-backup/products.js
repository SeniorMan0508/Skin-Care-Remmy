// ===================================================================
// REMI LUXE BEAUTY - STORE & BUSINESS CONFIGURATION
// 💡 CHANGE THE ADMIN EMAIL HERE WHEN READY TO HAND OVER TO CLIENT:
// ===================================================================
const STORE_CONFIG = {
  businessEmail: "remigold049@gmail.com", // <-- EDIT THIS EMAIL ANYTIME TO CHANGE OWNER EMAIL
  businessPhone: "+2349013255068",        // <-- WhatsApp Concierge Phone
  brandName: "Remi Luxe Beauty",
  logoUrl: "https://iili.io/nO1RNea.jpg"      // Direct web-accessible Brand Logo for email notifications
};

const NAIRA_SYMBOL = "₦";
const FREE_SHIPPING_THRESHOLD = 60000; // ₦60,000

function formatNaira(amount) {
  const num = parseFloat(amount) || 0;
  return `${NAIRA_SYMBOL}${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Dispatches order notification email with Brand Logo directly to STORE_CONFIG.businessEmail
async function sendOrderNotificationEmail(orderData) {
  try {
    const itemsList = orderData.items.map(item => `• ${item.title} (Qty: ${item.quantity}) - ${formatNaira(item.price * item.quantity)}`).join("\n");
    const emailSubject = `🛍️ NEW ORDER: ${orderData.orderRef} - ${formatNaira(orderData.total)} (${STORE_CONFIG.brandName})`;

    // Prepare FormData with Brand Logo and Order Details
    const formData = new FormData();
    formData.append("_subject", emailSubject);
    formData.append("_template", "box");
    formData.append("Brand", STORE_CONFIG.brandName);
    formData.append("Brand Logo", STORE_CONFIG.logoUrl);
    formData.append("Brand Logo HTML Preview", `<img src="${STORE_CONFIG.logoUrl}" alt="${STORE_CONFIG.brandName}" width="160" style="max-width:160px;height:auto;border-radius:8px;" />`);
    formData.append("Order Reference", orderData.orderRef);
    formData.append("Customer Name", orderData.name);
    formData.append("Customer Phone / WhatsApp", orderData.phone);
    formData.append("Customer Email", orderData.email || "Not Provided");
    formData.append("Delivery Address", `${orderData.address}, ${orderData.state} State, Nigeria`);
    formData.append("Delivery Notes", orderData.notes || "None");
    formData.append("Items Ordered", itemsList);
    formData.append("Subtotal", formatNaira(orderData.subtotal));
    formData.append("Delivery Fee", orderData.deliveryFee === 0 ? "FREE" : formatNaira(orderData.deliveryFee));
    formData.append("Total Amount Due", formatNaira(orderData.total));
    formData.append("Payment Method Selected", orderData.paymentMethod);
    formData.append("Bank Credited", "UBA Bank - Emokpae Remilekun Shukurat (2155821394)");
    formData.append("Order Date", new Date().toLocaleString());

    // Attach local brand logo image as binary file so email clients display it directly
    try {
      const logoRes = await fetch('./images/logo-image.jpeg');
      if (logoRes.ok) {
        const logoBlob = await logoRes.blob();
        formData.append("attachment", logoBlob, "remi-luxe-beauty-logo.jpeg");
        formData.append("file", logoBlob, "remi-luxe-beauty-logo.jpeg");
      }
    } catch (e) {
      // Continue if local fetch is restricted
    }

    // 1. Dispatch to 000form (Fast, zero-config, immediate delivery to STORE_CONFIG.businessEmail)
    fetch(`https://000form.com/f/${STORE_CONFIG.businessEmail}`, {
      method: "POST",
      body: formData
    }).catch(err => console.warn("000form dispatch notice:", err));

    // 2. Dispatch to FormSubmit (with timeout so it never blocks or hangs)
    const formSubmitController = new AbortController();
    const fsTimeout = setTimeout(() => formSubmitController.abort(), 3500);
    fetch(`https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" },
      signal: formSubmitController.signal
    }).catch(err => console.warn("FormSubmit notice:", err))
      .finally(() => clearTimeout(fsTimeout));

    // 3. Local server backup logging (Orders are safely saved locally in orders.json)
    fetch('/api/log-order', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderData,
        brandLogo: STORE_CONFIG.logoUrl,
        itemsFormatted: itemsList
      })
    }).catch(() => {});

  } catch (err) {
    console.warn("Notice: Order email background dispatch:", err);
  }
}

// Dispatches admin password reset alert email with Brand Logo
async function sendPasswordResetAlertEmail(email) {
  try {
    const alertSubject = `🔐 Admin Password Reset Alert - ${STORE_CONFIG.brandName}`;
    const formData = new FormData();
    formData.append("_subject", alertSubject);
    formData.append("_template", "box");
    formData.append("Brand", STORE_CONFIG.brandName);
    formData.append("Brand Logo", STORE_CONFIG.logoUrl);
    formData.append("Security Alert", "Your Remi Luxe Beauty Admin Password was just successfully updated and re-encrypted.");
    formData.append("Admin Email", email);
    formData.append("Date & Time", new Date().toLocaleString());
    formData.append("Notice", "If you authorized this change, no action is needed. If you did not authorize this, log into your admin portal immediately.");

    // Attach local brand logo image as binary file
    try {
      const logoRes = await fetch('./images/logo-image.jpeg');
      if (logoRes.ok) {
        const logoBlob = await logoRes.blob();
        formData.append("attachment", logoBlob, "remi-luxe-beauty-logo.jpeg");
        formData.append("file", logoBlob, "remi-luxe-beauty-logo.jpeg");
      }
    } catch (e) {}

    // Dispatch to 000form
    fetch(`https://000form.com/f/${STORE_CONFIG.businessEmail}`, {
      method: "POST",
      body: formData
    }).catch(() => {});

    // Dispatch to FormSubmit
    const fsController = new AbortController();
    const fsTimeout = setTimeout(() => fsController.abort(), 3500);
    fetch(`https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" },
      signal: fsController.signal
    }).catch(() => {}).finally(() => clearTimeout(fsTimeout));

  } catch (err) {
    console.warn("Notice: Reset email dispatch:", err);
  }
}

const DEFAULT_PRODUCTS = [
  {
    id: "remi-001",
    title: "Radiance Glow Serum",
    category: "Serums",
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
    category: "Moisturizers",
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
    category: "Cleansers",
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
    category: "Oils",
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

// LocalStorage Keys
const STORAGE_KEYS = {
  PRODUCTS: "remi_luxe_products_v2",
  CART: "remi_luxe_cart_v2"
};

// Initialize or get products
function getProducts() {
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return parsed;
  } catch (e) {
    console.error("Error reading products:", e);
    return DEFAULT_PRODUCTS;
  }
}

// Save products
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("productsUpdated", { detail: products }));
}

// Add a product (Used by Admin page)
function addProduct(productData) {
  const products = getProducts();
  const newProduct = {
    id: "remi-" + Date.now(),
    title: productData.title.trim(),
    category: productData.category || "Serums",
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

  products[index] = {
    ...products[index],
    title: updatedData.title !== undefined ? updatedData.title.trim() : products[index].title,
    category: updatedData.category !== undefined ? updatedData.category : products[index].category,
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

