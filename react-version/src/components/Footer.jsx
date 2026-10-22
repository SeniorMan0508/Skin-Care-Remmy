import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Phone, Mail, MapPin, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const { navigateTo, STORE_CONFIG } = useStore();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Brand Mission */}
        <div className="footer-col">
          <div className="brand-link footer-brand-link" onClick={() => navigateTo('home')} style={{ cursor: 'pointer', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-wrapper" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--color-gold)', overflow: 'hidden', background: '#fff', padding: '2px' }}>
              <img src="./images/logo-image.jpeg" alt="Remi Luxe Beauty Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div className="brand-info">
              <span className="brand-name" style={{ color: '#fff', fontSize: '1.3rem', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>REMI LUXE</span>
              <span className="brand-tagline" style={{ color: 'var(--color-gold)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>BEAUTY</span>
            </div>
          </div>
          <p className="footer-brand-desc">
            Ultra-potent, organic botanical skincare crafted with bio-active antioxidants and precious oils. Formulated to enhance and illuminate radiant melanin-rich skin.
          </p>
          <div style={{ display: 'flex', gap: '8px', color: 'var(--color-gold)', fontSize: '0.85rem' }}>
            <Sparkles size={16} /> 100% Organic & Ethically Sourced in Nigeria
          </div>
        </div>

        {/* Navigation Links */}
        <div className="footer-col">
          <h4>Boutique</h4>
          <ul className="footer-links">
            <li><span className="footer-link" onClick={() => navigateTo('home')}>Home</span></li>
            <li><span className="footer-link" onClick={() => navigateTo('shop')}>All Formulations</span></li>
            <li><span className="footer-link" onClick={() => navigateTo('about')}>Our Philosophy</span></li>
            <li><span className="footer-link" onClick={() => navigateTo('contact')}>Client Concierge</span></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul className="footer-links">
            <li><span className="footer-link" onClick={() => navigateTo('checkout')}>Track Bag / Checkout</span></li>
            <li><span className="footer-link" onClick={() => navigateTo('contact')}>Direct WhatsApp Assistance</span></li>
            <li><span className="footer-link" onClick={() => navigateTo('about')}>Skin Consultation</span></li>
            <li><span className="footer-link" onClick={() => navigateTo('contact')}>Delivery & Bank Transfer Info</span></li>
          </ul>
        </div>

        {/* Lagos Concierge */}
        <div className="footer-col">
          <h4>Lagos Concierge</h4>
          <ul className="footer-links" style={{ gap: '14px' }}>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#B5ABA2', fontSize: '0.88rem' }}>
              <Phone size={16} color="var(--color-gold)" />
              <a href={`https://wa.me/2349013255068`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                {STORE_CONFIG.businessPhone} (WhatsApp)
              </a>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#B5ABA2', fontSize: '0.88rem' }}>
              <Mail size={16} color="var(--color-gold)" />
              <span>{STORE_CONFIG.businessEmail}</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#B5ABA2', fontSize: '0.88rem' }}>
              <MapPin size={16} color="var(--color-gold)" style={{ marginTop: '3px' }} />
              <span>Lekki Phase 1, Victoria Island & Mainland Express, Lagos State, Nigeria</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <div>
          &copy; {new Date().getFullYear()} {STORE_CONFIG.brandName}. All rights reserved. Handcrafted with <Heart size={14} color="var(--color-gold)" style={{ display: 'inline', verticalAlign: 'middle' }} /> in Nigeria.
        </div>

        {/* Subtle Admin Entrance */}
        <div>
          <span 
            className="footer-admin-link"
            onClick={() => navigateTo('admin')}
            title="Admin Management Portal"
          >
            Staff Portal • Encrypted Access
          </span>
        </div>
      </div>
    </footer>
  );
}
