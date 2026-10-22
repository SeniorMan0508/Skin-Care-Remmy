import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Heart, Award, Shield } from 'lucide-react';
import './AboutPage.css';

export default function AboutPage() {
  const { navigateTo, STORE_CONFIG } = useStore();

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="container">
          <span className="section-tag" style={{ color: 'var(--color-gold)' }}>Our Origin & Craft</span>
          <h1>Elegance In Every Drop</h1>
          <p>Born in Lagos with an uncompromising devotion to luminous, healthy, and nourished melanin skin.</p>
        </div>
      </section>

      {/* Story Grid */}
      <div className="container">
        <div className="about-story-grid">
          <div className="about-image-frame">
            <img src="/images/hero-banner.jpg" alt="Remi Luxe Formulations" />
          </div>

          <div className="about-text-content">
            <span className="section-tag">Founder Philosophy</span>
            <h2>Where Botanical Purity Meets Clinical Efficacy</h2>
            <p>
              At <strong>{STORE_CONFIG.brandName}</strong>, we believe true luxury is found in what you choose to put on your skin. Founded with the mission to elevate African skincare, our formulas combine ancient African botanical wisdom with modern cosmetic science.
            </p>
            <p>
              We formulate without harsh bleaching agents, hydroquinone, parabens, or aggressive fillers. Instead, we harness cold-pressed botanical oils, bio-fermented Vitamin C, low-molecular Hyaluronic Acid, and barrier-repairing peptides that harmonize with your skin’s biological rhythm.
            </p>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => navigateTo('shop')}
              style={{ marginTop: '10px' }}
            >
              Explore Our Botanical Rituals
            </button>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="section-header">
          <span className="section-tag">Ethical Standards</span>
          <h2 className="section-title">The Remi Luxe Promise</h2>
          <p className="section-subtitle">
            Every bottle reflects our rigorous standards of safety, integrity, and clinical efficacy.
          </p>
        </div>

        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <Sparkles size={28} />
            </div>
            <h3>Glass-Skin Illumination</h3>
            <p>Deep cellular hydration and bio-active antioxidants create that lit-from-within glow without greasiness.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <Heart size={28} />
            </div>
            <h3>Melanin-Respecting</h3>
            <p>Formulations specifically engineered to soothe post-inflammatory hyperpigmentation safely and gently.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <Award size={28} />
            </div>
            <h3>Small-Batch Compounding</h3>
            <p>Crafted in limited luxury batches to preserve ingredient freshness, bio-availability, and peak potency.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <Shield size={28} />
            </div>
            <h3>100% Cruelty Free</h3>
            <p>Never tested on animals. Ethically harvested botanicals that support sustainable agricultural communities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
