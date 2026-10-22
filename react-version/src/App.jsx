import React from 'react';
import { useStore } from './context/StoreContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';
import { Sparkles } from 'lucide-react';

export default function App() {
  const { currentPage, toastMessage } = useStore();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'shop':
        return <ShopPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'admin':
        return <AdminPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main>
        {renderCurrentPage()}
      </main>

      {/* Slide-out Shopping Bag Drawer */}
      <CartDrawer />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={18} color="var(--color-gold)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Brand Footer */}
      <Footer />
    </div>
  );
}
