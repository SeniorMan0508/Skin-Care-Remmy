import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { currentPage, navigateTo, cartCount, setIsCartOpen, STORE_CONFIG } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
    // NOTE: Admin link is STRICTLY hidden from navbar as requested!
  ];

  const handleNavClick = (id) => {
    navigateTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Identity */}
        <div className="nav-brand" onClick={() => handleNavClick('home')}>
          <img 
            src="/images/logo-image.jpeg" 
            alt={STORE_CONFIG.brandName} 
            className="nav-brand-logo" 
          />
          <div className="nav-brand-text">
            <h1>{STORE_CONFIG.brandName}</h1>
            <span>Luxury Organic Glow</span>
          </div>
        </div>

        {/* Navigation Links - Hidden Admin */}
        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <li key={item.id}>
              <span 
                className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Actions: Shopping Bag Drawer & Mobile Menu Button */}
        <div className="nav-actions">
          <button 
            type="button" 
            className="btn-nav-cart" 
            onClick={() => setIsCartOpen(true)}
            aria-label="View Shopping Bag"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="cart-badge-count">{cartCount}</span>
            )}
          </button>

          <button 
            type="button" 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>
    </header>
  );
}
