import React, { useState } from 'react';
import { useStore, formatNaira } from '../context/StoreContext';
import { Sparkles, ShieldCheck, Leaf, Truck, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const { products, addToCart, navigateTo, reviews, STORE_CONFIG } = useStore();
  const [showAllComments, setShowAllComments] = useState(false);

  // Maximum 6 comments initially, expand when user clicks 'See More Comments'
  const visibleReviews = showAllComments ? reviews : reviews.slice(0, 6);
  const remainingCommentsCount = Math.max(0, reviews.length - 6);

  // Featured / New Arrivals: latest 4 items
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="home-page">
      {/* 1. Hero Showcase */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-subtitle">
            <Sparkles size={16} /> 100% Organic Nigerian Botanical Luxury
          </div>

          <h1 className="hero-title">
            Unlock The Secret To <span>Luminous Melanin Radiance</span>.
          </h1>

          <p className="hero-description">
            Scientifically crafted bio-active botanical serums and rich barrier-restoring elixirs designed specifically for melanin-rich and sensitive skin. Experience glass-skin clarity without compromise.
          </p>

          <div className="hero-cta-group">
            <button 
              type="button" 
              className="btn-primary btn-gold"
              onClick={() => navigateTo('shop')}
            >
              Shop The Collection <ArrowRight size={18} />
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.4)' }}
              onClick={() => navigateTo('about')}
            >
              Our Philosophy
            </button>
          </div>
        </div>
      </section>

      {/* 2. Pillars of Excellence */}
      <section className="pillars-section">
        <div className="container pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-box">
              <Leaf size={24} />
            </div>
            <div className="pillar-text">
              <h4>Pure Botanical Actives</h4>
              <p>Zero parabens, sulfates, or artificial fragrances. Pure plant extracts.</p>
            </div>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <Sparkles size={24} />
            </div>
            <div className="pillar-text">
              <h4>Melanin-First Science</h4>
              <p>Formulated to safely target hyperpigmentation and reveal deep radiance.</p>
            </div>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <Truck size={24} />
            </div>
            <div className="pillar-text">
              <h4>Nationwide Delivery</h4>
              <p>Swift delivery across Lagos, Abuja, Port Harcourt & all 36 states.</p>
            </div>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div className="pillar-text">
              <h4>Dermatologist Approved</h4>
              <p>Gentle on barrier-compromised skin, acne-prone, and dry textures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. New Arrivals & Featured Formulations */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Curated Rituals</span>
            <h2 className="section-title">New Arrivals & Best Sellers</h2>
            <p className="section-subtitle">
              Every formulation is small-batch compounded to ensure peak antioxidant potency and luxurious sensory indulgence.
            </p>
          </div>

          <div className="products-grid">
            {featuredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.title} className="product-img" />
                  <div className="product-badge-overlay">
                    {product.isNew && <span className="badge-gold">New Arrival</span>}
                    {!product.inStock && <span className="badge-dark" style={{ background: '#C0392B' }}>Out of Stock</span>}
                  </div>
                </div>

                <div className="product-info">
                  <span className="product-cat">{product.category}</span>
                  <h3 className="product-title">{product.title}</h3>
                  <p className="product-desc">{product.description}</p>

                  <div className="product-pricing">
                    <span className="price-current">{formatNaira(product.price)}</span>
                    {product.originalPrice && (
                      <span className="price-original">{formatNaira(product.originalPrice)}</span>
                    )}
                  </div>

                  <button 
                    type="button" 
                    className="btn-add-bag"
                    onClick={() => addToCart(product, 1)}
                    disabled={!product.inStock}
                  >
                    <ShoppingBag size={16} /> 
                    {product.inStock ? "Add To Bag" : "Currently Unavailable"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button 
              type="button" 
              className="btn-primary"
              onClick={() => navigateTo('shop')}
            >
              Explore All Formulations ({products.length})
            </button>
          </div>
        </div>
      </section>

      {/* 4. Real Customer Glow Reviews (Max 6 default, See More toggle) */}
      <section className="reviews-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Glowing Feedback</span>
            <h2 className="section-title">Real Words From Radiant Clients</h2>
            <p className="section-subtitle">
              Verified experiences from beauty connoisseurs who trust Remi Luxe Beauty for their daily skincare rituals.
            </p>
          </div>

          <div className="reviews-grid">
            {visibleReviews.map(review => (
              <div key={review.id} className="review-card">
                <div>
                  <div className="review-stars">
                    {Array.from({ length: review.rating || 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="#F5A623" color="#F5A623" style={{ display: 'inline' }} />
                    ))}
                  </div>
                  <p className="review-comment">"{review.comment}"</p>
                </div>

                <div className="review-author">
                  <div>
                    <h5 className="author-name">{review.name}</h5>
                    <span className="author-meta">{review.skinType || "Verified Client"}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#9C8F85' }}>{review.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle: See More Comments / Show Less */}
          {reviews.length > 6 && (
            <div className="see-more-wrap">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments ? (
                  "Show Less Comments"
                ) : (
                  `See More Comments (${remainingCommentsCount} more)`
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
