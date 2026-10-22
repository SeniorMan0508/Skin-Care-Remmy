import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import './ContactPage.css';

export default function ContactPage() {
  const { STORE_CONFIG, showToast } = useStore();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    showToast("✨ Inquiry sent! Our concierge will reply within 2 hours.");
    setFormData({ name: '', email: '', phone: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="contact-page">
      {/* Hero */}
      <section className="contact-hero">
        <div className="container">
          <span className="section-tag" style={{ color: 'var(--color-gold)' }}>We Are Here For You</span>
          <h1>Client Concierge & Inquiries</h1>
          <p>Get personalized skincare advice, inquire about wholesale orders, or connect with our beauty specialists.</p>
        </div>
      </section>

      <div className="container">
        <div className="contact-grid">
          {/* Contact Form */}
          <div className="contact-card">
            <h2>Send A Message</h2>
            <p>Fill out the form below and our beauty concierge will contact you promptly.</p>

            {submitted && (
              <div style={{ background: '#E8F5E9', border: '1px solid #2E7D32', color: '#1B5E20', padding: '14px', borderRadius: '8px', marginBottom: '18px' }}>
                🎉 Thank you for reaching out! Your message has been received by our Lagos concierge team.
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Amara Okafor" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="e.g. amara@example.com" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone / WhatsApp Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +234 803 123 4567"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Your Inquiry or Skin Concern *</label>
                <textarea 
                  rows="4" 
                  placeholder="How can we assist your glow journey?" 
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                <Send size={16} /> Send Direct Message
              </button>
            </form>
          </div>

          {/* Concierge Info & WhatsApp Box */}
          <div className="concierge-card">
            <div className="concierge-item">
              <div className="concierge-icon">
                <Phone size={20} />
              </div>
              <div className="concierge-info">
                <h4>Direct Phone & WhatsApp</h4>
                <a href={`https://wa.me/2349013255068`} target="_blank" rel="noreferrer">
                  {STORE_CONFIG.businessPhone}
                </a>
              </div>
            </div>

            <div className="concierge-item">
              <div className="concierge-icon">
                <Mail size={20} />
              </div>
              <div className="concierge-info">
                <h4>Client Inquiries & Support</h4>
                <p>{STORE_CONFIG.businessEmail}</p>
              </div>
            </div>

            <div className="concierge-item">
              <div className="concierge-icon">
                <MapPin size={20} />
              </div>
              <div className="concierge-info">
                <h4>Lagos Dispatch Showroom</h4>
                <p>Lekki Phase 1, Victoria Island & Mainland Fast Dispatch Hubs, Lagos State, Nigeria.</p>
              </div>
            </div>

            <div className="concierge-item">
              <div className="concierge-icon">
                <Clock size={20} />
              </div>
              <div className="concierge-info">
                <h4>Concierge Operating Hours</h4>
                <p>Monday – Saturday: 8:00 AM – 7:00 PM<br />Sunday: 12:00 PM – 6:00 PM</p>
              </div>
            </div>

            {/* Instant WhatsApp Card */}
            <div className="whatsapp-box">
              <h4>💬 Prefer WhatsApp Chat?</h4>
              <p>Chat directly with our skincare specialist right now for instant recommendations & order assistance.</p>
              <a 
                href={`https://wa.me/2349013255068?text=${encodeURIComponent('Hello Remi Luxe Beauty! I would like some advice on which skincare products to order.')}`}
                target="_blank" 
                rel="noreferrer"
                className="btn-whatsapp-chat"
              >
                <MessageSquare size={18} /> Chat on WhatsApp Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
