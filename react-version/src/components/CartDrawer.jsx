import React from 'react';
import { useStore, formatNaira, FREE_SHIPPING_THRESHOLD } from '../context/StoreContext';
import { X, Plus, Minus, Trash2, ShoppingBag, Sparkles } from 'lucide-react';
import './CartDrawer.css';

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    cartSubtotal, 
    isFreeShipping, 
    navigateTo 
  } = useStore();

  if (!isCartOpen) return null;

  const progressPercent = Math.min(100, Math.round((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <h3>Your Glow Bag ({cart.reduce((a, b) => a + b.quantity, 0)})</h3>
          <button 
            type="button" 
            className="btn-close-cart" 
            onClick={() => setIsCartOpen(false)}
            aria-label="Close Shopping Bag"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="shipping-bar-container">
          <div className="shipping-bar-text" style={{ fontSize: '0.82rem', color: '#854D0E' }}>
            <span>📦 Nationwide Delivery • Shipping fee is paid directly to the courier rider upon delivery.</span>
          </div>
        </div>

        {/* Items List */}
        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={48} strokeWidth={1.2} />
              <p>Your shopping bag is currently empty.</p>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => { setIsCartOpen(false); navigateTo('shop'); }}
                style={{ fontSize: '0.82rem', padding: '10px 20px' }}
              >
                Discover Formulations
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.title} className="cart-item-img" />
                <div className="cart-item-info">
                  <div>
                    <h4 className="cart-item-title">{item.title}</h4>
                    <span className="cart-item-price">{formatNaira(item.price)}</span>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button 
                        type="button" 
                        className="qty-btn"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease Quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        type="button" 
                        className="qty-btn"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase Quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      type="button" 
                      className="btn-remove-item"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span className="cart-summary-total">{formatNaira(cartSubtotal)}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#9C8F85', marginBottom: '14px' }}>
              Shipping and bank/transfer details verified at checkout.
            </p>

            <button 
              type="button" 
              className="btn-primary cart-checkout-btn btn-gold"
              onClick={handleProceedToCheckout}
            >
              Proceed To Checkout • {formatNaira(cartSubtotal)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
