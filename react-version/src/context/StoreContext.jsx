import React, { createContext, useContext, useState, useEffect } from 'react';

// ===================================================================
// REMI LUXE BEAUTY - STORE & BUSINESS CONFIGURATION
// 💡 CHANGE THE ADMIN EMAIL HERE ANYTIME WHEN HANDING OVER TO CLIENT:
// ===================================================================
export const STORE_CONFIG = {
  businessEmail: "remigold049@gmail.com", // <-- EDIT THIS EMAIL ANYTIME TO CHANGE OWNER EMAIL
  businessPhone: "+2349013255068",        // <-- WhatsApp Concierge Phone
  brandName: "Remi Luxe Beauty",
  logoUrl: "https://iili.io/nO1RNea.jpg"      // Direct web-accessible Brand Logo for email notifications
};

export const NAIRA_SYMBOL = "₦";
export const FREE_SHIPPING_THRESHOLD = 60000; // ₦60,000
export const STANDARD_DELIVERY_FEE = 3500;   // ₦3,500

export function formatNaira(amount) {
  const num = parseFloat(amount) || 0;
  return `${NAIRA_SYMBOL}${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// SHA-256 Cryptographic Hash Helper
export async function sha256(str) {
  const enc = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export const DEFAULT_PRODUCTS = [
  {
    id: "remi-001",
    title: "Radiance Glow Serum",
    category: "Serums",
    price: 45000,
    originalPrice: 55000,
    rating: 4.9,
    reviewsCount: 142,
    image: "/images/product-serum.jpg",
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
    image: "/images/product-cream.jpg",
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
    image: "/images/product-cleanser.jpg",
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
    image: "/images/product-oil.jpg",
    description: "An indulgent elixir infused with genuine 24-karat gold leaf flakes, cold-pressed rosehip seed, and golden jojoba oil to seal in ultimate silkiness and golden hour radiance.",
    skinType: "Normal / Dry / Melanin-Rich",
    volume: "30ml / 1.0 fl. oz.",
    isNew: true,
    isFeatured: true,
    inStock: true,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

export const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    name: "Chioma Adebayo",
    rating: 5,
    skinType: "Combination • Melanin-Rich",
    comment: "My stubborn hyperpigmentation started fading in just 2 weeks! The Radiance Glow Serum has completely transformed my complexion.",
    date: "2 days ago",
    orderRef: "RLB-8831"
  },
  {
    id: "rev-2",
    name: "Hadiza Bello",
    rating: 5,
    skinType: "Dry / Sensitive Skin",
    comment: "The Velvet Barrier Cream rescued my damaged skin barrier after harsh weather. It sinks right in without clogging pores. Worth every Naira!",
    date: "4 days ago",
    orderRef: "RLB-9142"
  },
  {
    id: "rev-3",
    name: "Zainab Aliyu",
    rating: 5,
    skinType: "Normal • Uneven Tone",
    comment: "Super fast delivery to Abuja! The packaging feels like pure royalty, and the glow oil leaves an ethereal golden finish all day long.",
    date: "1 week ago",
    orderRef: "RLB-7210"
  },
  {
    id: "rev-4",
    name: "Blessing Okon",
    rating: 5,
    skinType: "Sensitive Skin",
    comment: "Most cleansers leave my face tight and dry, but this Gentle Purifying Cleanser is so calming and silky. My skin feels fresh and balanced.",
    date: "1 week ago",
    orderRef: "RLB-6059"
  },
  {
    id: "rev-5",
    name: "Folashade Adeleke",
    rating: 5,
    skinType: "Mature • Melanin Glow",
    comment: "Hands down the best skincare brand in Nigeria. High potency botanical formulations that actually respect our melanin skin tone.",
    date: "2 weeks ago",
    orderRef: "RLB-5481"
  },
  {
    id: "rev-6",
    name: "Amarachi Eze",
    rating: 5,
    skinType: "Oily / Acne Prone",
    comment: "I was hesitant because of my oily T-zone, but the serum absorbs in seconds with zero sticky residue. Makeup applies so effortlessly over it!",
    date: "3 weeks ago",
    orderRef: "RLB-4920"
  }
];

const STORAGE_KEYS = {
  PRODUCTS: "remi_luxe_products_v2",
  CART: "remi_luxe_cart_v2",
  REVIEWS: "remi_luxe_comments_v2",
  AUTH: "remi_luxe_admin_security_v2",
  SESSION: "remi_luxe_admin_session_v2"
};

const StoreContext = createContext();

export function StoreProvider({ children }) {
  // Page Navigation State
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["home", "shop", "about", "contact", "checkout", "admin"].includes(hash) ? hash : "home";
  });

  // Sync hash with currentPage
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "shop", "about", "contact", "checkout", "admin"].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Products State
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CART);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  // Reviews State
  const [reviews, setReviews] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return stored ? JSON.parse(stored) : DEFAULT_REVIEWS;
    } catch {
      return DEFAULT_REVIEWS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  // Cart Drawer & Toast State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart Helpers
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity
      }];
    });
    showToast(`✨ Added "${product.title}" to your shopping bag.`);
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isFreeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD;
  const deliveryFee = cartSubtotal === 0 ? 0 : (isFreeShipping ? 0 : STANDARD_DELIVERY_FEE);
  const cartTotal = cartSubtotal + deliveryFee;

  // Product Management (Admin)
  const addProduct = (newProduct) => {
    const product = {
      ...newProduct,
      id: "remi-" + Date.now().toString().slice(-4),
      createdAt: new Date().toISOString()
    };
    setProducts(prev => [product, ...prev]);
    showToast(`🎉 "${product.title}" published successfully!`);
    return product;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    showToast("✨ Product details updated successfully!");
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast("🗑️ Product removed from catalog.");
  };

  // Review Management
  const addReview = (newReview) => {
    const rev = {
      ...newReview,
      id: "rev-" + Date.now(),
      date: "Just now"
    };
    setReviews(prev => [rev, ...prev]);
    showToast("✨ Thank you! Your review is now live on the Home page.");
  };

  // Order Notification Email Dispatch with Brand Logo
  const sendOrderNotificationEmail = async (orderData) => {
    try {
      const itemsList = orderData.items.map(item => `• ${item.title} (Qty: ${item.quantity}) - ${formatNaira(item.price * item.quantity)}`).join("\n");
      const emailSubject = `🛍️ NEW ORDER: ${orderData.orderRef} - ${formatNaira(orderData.total)} (${STORE_CONFIG.brandName})`;

      // 1. Direct Node server rich email with embedded brand logo
      try {
        let endpoint = "/api/send-order-email";
        if (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050"))) {
          endpoint = "http://localhost:5050/api/send-order-email";
        }
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderData,
            businessEmail: STORE_CONFIG.businessEmail,
            brandName: STORE_CONFIG.brandName
          })
        });
      } catch (srvErr) {
        console.warn("Node server email dispatch notice:", srvErr);
      }

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

      // 2. Dispatch to FormSubmit with safety timeout
      const fsController = new AbortController();
      const fsTimeout = setTimeout(() => fsController.abort(), 3500);
      fetch(`https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" },
        signal: fsController.signal
      }).catch(() => {}).finally(() => clearTimeout(fsTimeout));

    } catch (err) {
      console.warn("Order email background dispatch notice:", err);
    }
  };

  // Customer Payment Confirmation & Status Email Dispatch
  const sendCustomerStatusEmail = async (orderData, status = "Payment Confirmed") => {
    if (!orderData || !orderData.email || !orderData.email.includes("@")) return;
    try {
      let endpoint = "/api/send-customer-status-email";
      if (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "5050"))) {
        endpoint = "http://localhost:5050/api/send-customer-status-email";
      }
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: orderData.orderRef, status, orderData })
      });
    } catch (err) {
      console.warn("Customer status email dispatch notice:", err);
    }
  };

  // Password Reset Alert Email Dispatch with Brand Logo
  const sendPasswordResetAlertEmail = async (email) => {
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

      try {
        const logoRes = await fetch('/images/logo-image.jpeg');
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          formData.append("attachment", logoBlob, "remi-luxe-beauty-logo.jpeg");
          formData.append("file", logoBlob, "remi-luxe-beauty-logo.jpeg");
        }
      } catch {}

      fetch(`https://000form.com/f/${STORE_CONFIG.businessEmail}`, {
        method: "POST",
        body: formData
      }).catch(() => {});

      const fsController = new AbortController();
      const fsTimeout = setTimeout(() => fsController.abort(), 3500);
      fetch(`https://formsubmit.co/ajax/${STORE_CONFIG.businessEmail}`, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" },
        signal: fsController.signal
      }).catch(() => {}).finally(() => clearTimeout(fsTimeout));

    } catch (err) {
      console.warn("Reset email dispatch notice:", err);
    }
  };

  // Admin Security Management
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION) === "true";
  });

  const getAdminSecurity = async () => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const defaultHash = await sha256("admin123");
    const security = {
      passwordHash: defaultHash,
      adminEmail: STORE_CONFIG.businessEmail,
      salt: "remi_luxe_salt_2026",
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(security));
    return security;
  };

  const loginAdmin = async (password) => {
    const security = await getAdminSecurity();
    const inputHash = await sha256(password);
    if (inputHash === security.passwordHash) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEYS.SESSION, "true");
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  const resetAdminPassword = async (email, newPassword) => {
    const security = await getAdminSecurity();
    const registeredEmail = STORE_CONFIG.businessEmail.toLowerCase();
    if (email.trim().toLowerCase() !== registeredEmail) {
      throw new Error(`Verification failed: "${email}" is not the registered admin email for this store.`);
    }
    security.passwordHash = await sha256(newPassword);
    security.adminEmail = registeredEmail;
    security.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(security));
    sendPasswordResetAlertEmail(registeredEmail);
    return true;
  };

  const value = {
    STORE_CONFIG,
    currentPage,
    navigateTo,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartCount,
    isFreeShipping,
    deliveryFee,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    toastMessage,
    showToast,
    reviews,
    addReview,
    sendOrderNotificationEmail,
    sendCustomerStatusEmail,
    sendPasswordResetAlertEmail,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    resetAdminPassword
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
