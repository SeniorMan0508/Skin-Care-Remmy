import React, { useState } from 'react';
import { useStore, formatNaira, FREE_SHIPPING_THRESHOLD, STANDARD_DELIVERY_FEE } from '../context/StoreContext';
import confetti from 'canvas-confetti';
import { CreditCard, MessageSquare, CheckCircle, Sparkles, Star, ArrowLeft } from 'lucide-react';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { 
    cart, 
    cartSubtotal, 
    isFreeShipping, 
    deliveryFee, 
    cartTotal, 
    clearCart, 
    navigateTo, 
    sendOrderNotificationEmail, 
    addReview, 
    STORE_CONFIG 
  } = useStore();

  const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank' or 'whatsapp'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    state: 'Lagos',
    notes: ''
  });

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSkinType, setReviewSkinType] = useState('Verified Client');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  const states = [
    'Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Ogun', 'Delta', 'Edo', 'Enugu', 'Kaduna', 'Kano', 'Anambra', 'Ondo', 'Imo', 'Other State'
  ];

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 20px' }}>
        <h2>Your Shopping Bag Is Empty</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '14px 0 28px 0' }}>
          Explore our collection of organic serums and elixirs before checking out.
        </p>
        <button type="button" className="btn-primary" onClick={() => navigateTo('shop')}>
          Return to Shop
        </button>
      </div>
    );
  }

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Please enter your Full Name, Phone / WhatsApp number, and Delivery Address.");
      return;
    }

    const generatedRef = "RLB-" + Math.floor(1000 + Math.random() * 9000);
    setOrderRef(generatedRef);

    const orderData = {
      orderRef: generatedRef,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      state: formData.state,
      notes: formData.notes,
      items: cart,
      subtotal: cartSubtotal,
      deliveryFee,
      total: cartSubtotal,
      deliveryFee: "Paid on Delivery (By Receiver)",
      paymentMethod: paymentMethod === 'bank' 
        ? "Direct Bank Transfer (Opay: 9013255068)" 
        : "WhatsApp Order Concierge"
    };

    // 1. Record order locally and sync with backend database
    try {
      const key = "remi_luxe_orders";
      let localOrders = JSON.parse(localStorage.getItem(key) || "[]");
      const orderRecord = { ...orderData, status: "Pending Verification", receivedAt: new Date().toISOString() };
      localOrders.unshift(orderRecord);
      localStorage.setItem(key, JSON.stringify(localOrders));

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
    } catch (e) {}

    // 2. Send Order Notification Email (with Brand Logo attached)
    sendOrderNotificationEmail(orderData);

    // 2. If WhatsApp was chosen, open WhatsApp concierge
    if (paymentMethod === 'whatsapp') {
      const itemsText = cart.map(item => `• ${item.title} (x${item.quantity}) - ${formatNaira(item.price * item.quantity)}`).join('\n');
      const waMsg = `✨ *NEW ORDER - REMI LUXE BEAUTY* ✨\nRef: *${generatedRef}*\n\n*Customer:* ${formData.name}\n*Phone:* ${formData.phone}\n*Address:* ${formData.address}, ${formData.state} State\n\n*Items Ordered:*\n${itemsText}\n\n*Subtotal:* ${formatNaira(cartSubtotal)}\n*Delivery:* ${isFreeShipping ? 'FREE' : formatNaira(deliveryFee)}\n*TOTAL AMOUNT DUE:* *${formatNaira(cartTotal)}*\n\nPlease confirm availability and share payment confirmation!`;
      window.open(`https://wa.me/2349013255068?text=${encodeURIComponent(waMsg)}`, '_blank');
    }

    // 3. Fire Confetti Celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    // 4. Mark order placed and clear bag
    setOrderSuccess(true);
    clearCart();
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    addReview({
      name: formData.name || "Valued Client",
      rating: reviewRating,
      skinType: reviewSkinType || "Verified Client",
      comment: reviewComment.trim(),
      orderRef
    });

    setCommentSubmitted(true);
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <button 
          type="button" 
          onClick={() => navigateTo('shop')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold)', fontWeight: '600', marginBottom: '20px' }}
        >
          <ArrowLeft size={16} /> Continue Shopping
        </button>

        <h1>Secure Checkout</h1>
        <p className="checkout-page-desc">Complete your delivery address and choose your preferred Nigerian payment method.</p>

        <form onSubmit={handlePlaceOrder} className="checkout-layout">
          {/* Left Column: Details & Payment */}
          <div>
            {/* Customer Information */}
            <div className="checkout-box">
              <h3 className="checkout-box-title">
                1. Delivery & Contact Details
              </h3>

              <div className="checkout-form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Amara Nwachukwu" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp / Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 0803 123 4567" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Email Address (For Receipt & Tracking)</label>
                  <input 
                    type="email" 
                    placeholder="e.g. amara@gmail.com" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Delivery Address *</label>
                  <input 
                    type="text" 
                    placeholder="Street Address, Estate, Apartment Number" 
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Delivery State *</label>
                  <select 
                    value={formData.state} 
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Delivery Instructions</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Call before arriving" 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="checkout-box">
              <h3 className="checkout-box-title">
                2. Select Payment Method
              </h3>

              <div className="payment-methods-tabs">
                <div 
                  className={`payment-tab ${paymentMethod === 'bank' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  <div className="payment-tab-indicator" />
                  <CreditCard size={18} color="var(--color-gold)" />
                  <div>
                    <div>Direct Bank Transfer</div>
                    <small style={{ color: 'var(--color-text-muted)' }}>UBA Bank Account</small>
                  </div>
                </div>

                <div 
                  className={`payment-tab ${paymentMethod === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('whatsapp')}
                >
                  <div className="payment-tab-indicator" />
                  <MessageSquare size={18} color="#25D366" />
                  <div>
                    <div>Order on WhatsApp</div>
                    <small style={{ color: 'var(--color-text-muted)' }}>Instant Concierge</small>
                  </div>
                </div>
              </div>

              {/* Bank Details Display */}
              {paymentMethod === 'bank' && (
                <div className="bank-transfer-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B27B08', fontWeight: '700', marginBottom: '14px' }}>
                    <Sparkles size={18} /> Official Store Bank Account Details
                  </div>
                  <div className="bank-detail-row">
                    <span>Bank Name:</span>
                    <span className="bank-detail-val">Opay</span>
                  </div>
                  <div className="bank-detail-row">
                    <span>Account Name:</span>
                    <span className="bank-detail-val">Emokpae Remilekun Shukurat</span>
                  </div>
                  <div className="bank-detail-row">
                    <span>Account Number:</span>
                    <span className="bank-account-big">9013255068</span>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '0.84rem', color: '#724E09', lineHeight: '1.5' }}>
                    💡 Please transfer <strong>{formatNaira(cartSubtotal)}</strong> to the Opay account above. Shipping fee is paid directly to the rider upon delivery.
                  </div>
                </div>
              )}

              {paymentMethod === 'whatsapp' && (
                <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '12px', padding: '18px', color: '#1B5E20', fontSize: '0.9rem' }}>
                  Clicking <strong>"Submit Order via WhatsApp"</strong> will automatically package your order details into WhatsApp and connect you directly with our concierge at <strong>{STORE_CONFIG.businessPhone}</strong>.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="checkout-box">
              <h3 className="checkout-box-title">Order Summary</h3>

              <div className="summary-items-list">
                {cart.map(item => (
                  <div key={item.id} className="summary-item-row">
                    <div>
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Qty: {item.quantity} × {formatNaira(item.price)}
                      </div>
                    </div>
                    <span>{formatNaira(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="summary-cost-row">
                <span>Subtotal</span>
                <span>{formatNaira(cartSubtotal)}</span>
              </div>

              <div className="summary-cost-row">
                <span>Delivery / Courier Fee</span>
                <span style={{ color: '#B45309', fontWeight: '700', fontSize: '0.85rem' }}>Paid on Delivery (By Receiver)</span>
              </div>

              <div className="summary-cost-row summary-cost-total">
                <span>Total Amount Due Now</span>
                <span style={{ color: 'var(--color-gold)' }}>{formatNaira(cartSubtotal)}</span>
              </div>

              <button 
                type="submit" 
                className="btn-primary btn-gold" 
                style={{ width: '100%', marginTop: '20px' }}
              >
                {paymentMethod === 'bank' ? 'I Have Made The Transfer' : 'Submit Order Via WhatsApp'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Order Confirmation Modal with Review / Comment Box */}
      {orderSuccess && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <CheckCircle size={60} color="#2E7D32" style={{ margin: '0 auto 12px auto' }} />
              <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                Order Placed Successfully!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Thank you for choosing <strong>{STORE_CONFIG.brandName}</strong>! Your order reference is <strong style={{ color: 'var(--color-gold)' }}>{orderRef}</strong>.
              </p>
            </div>

            {/* Post-Payment Customer Review / Comment Box */}
            <div className="post-payment-comment-card">
              <div className="comment-card-header">
                <h3>✨ Leave A Customer Review & Comment</h3>
                <p>Share your glow expectation or experience. Your comment will appear on our Home page!</p>
              </div>

              {commentSubmitted ? (
                <div style={{ background: '#E8F5E9', border: '1px solid #2E7D32', color: '#1B5E20', padding: '14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  🎉 Thank you {formData.name || 'valued customer'}! Your review has been published and is now live on the Home page.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit}>
                  <div className="star-rating-select">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        type="button" 
                        className={`star-btn ${reviewRating >= star ? 'active' : ''}`}
                        onClick={() => setReviewRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Skin Type / Concern</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Melanin-Rich • Sensitive • Dry"
                      value={reviewSkinType}
                      onChange={e => setReviewSkinType(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>Your Comment / Review *</label>
                    <textarea 
                      rows="3" 
                      placeholder="Tell us what you love about this order or your glow goals..."
                      required
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '0.88rem' }}>
                    Post Comment to Home Page ✨
                  </button>
                </form>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigateTo('home')}
                style={{ width: '100%' }}
              >
                Return To Home Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
