import React, { useState } from 'react';
import { useStore, formatNaira } from '../context/StoreContext';
import { Lock, Plus, Edit, Trash2, LogOut, ShieldAlert, Check, X, KeyRound, Sparkles } from 'lucide-react';
import './AdminPage.css';

export default function AdminPage() {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    isAdminAuthenticated, 
    loginAdmin, 
    logoutAdmin, 
    resetAdminPassword, 
    STORE_CONFIG 
  } = useStore();

  // Auth States
  const [authView, setAuthView] = useState('login'); // 'login' or 'reset'
  const [passwordInput, setPasswordInput] = useState('');
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Modals for Products
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State for Add / Edit
  const [formProduct, setFormProduct] = useState({
    title: '',
    category: 'Serums',
    price: '',
    originalPrice: '',
    image: '/images/product-serum.jpg',
    description: '',
    skinType: 'All Skin Types / Melanin Glow',
    volume: '30ml / 1 fl. oz.',
    inStock: true,
    isNew: true
  });

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const success = await loginAdmin(passwordInput);
    if (!success) {
      setAuthError("Incorrect password. If you forgot your password, click 'Forgot Password?' below.");
    } else {
      setPasswordInput('');
    }
  };

  // Handle Password Reset
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (newPasswordInput !== confirmPasswordInput) {
      setAuthError("New passwords do not match. Please re-enter.");
      return;
    }

    try {
      await resetAdminPassword(resetEmailInput, newPasswordInput);
      setAuthSuccess(`✨ Password updated successfully for ${resetEmailInput}! Security alert email sent with brand logo. Switching to login...`);
      setTimeout(() => {
        setAuthView('login');
        setAuthSuccess('');
        setResetEmailInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      }, 2400);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormProduct({
      title: product.title,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || '',
      image: product.image,
      description: product.description,
      skinType: product.skinType || '',
      volume: product.volume || '',
      inStock: product.inStock,
      isNew: product.isNew
    });
  };

  // Submit Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct.id, {
      title: formProduct.title,
      category: formProduct.category,
      price: parseFloat(formProduct.price) || 0,
      originalPrice: formProduct.originalPrice ? parseFloat(formProduct.originalPrice) : null,
      image: formProduct.image,
      description: formProduct.description,
      skinType: formProduct.skinType,
      volume: formProduct.volume,
      inStock: formProduct.inStock,
      isNew: formProduct.isNew
    });

    setEditingProduct(null);
  };

  // Submit Add New Product
  const handleSaveAdd = (e) => {
    e.preventDefault();
    addProduct({
      title: formProduct.title,
      category: formProduct.category,
      price: parseFloat(formProduct.price) || 0,
      originalPrice: formProduct.originalPrice ? parseFloat(formProduct.originalPrice) : null,
      image: formProduct.image || '/images/product-serum.jpg',
      description: formProduct.description,
      skinType: formProduct.skinType,
      volume: formProduct.volume,
      inStock: formProduct.inStock,
      isNew: formProduct.isNew
    });

    setIsAddModalOpen(false);
    setFormProduct({
      title: '',
      category: 'Serums',
      price: '',
      originalPrice: '',
      image: '/images/product-serum.jpg',
      description: '',
      skinType: 'All Skin Types / Melanin Glow',
      volume: '30ml / 1 fl. oz.',
      inStock: true,
      isNew: true
    });
  };

  // Handle Image File Upload to DataURL
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormProduct(prev => ({ ...prev, image: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // IF NOT AUTHENTICATED: Display Luxury Encrypted Auth Overlay
  if (!isAdminAuthenticated) {
    return (
      <div className="admin-auth-overlay">
        <div className="admin-auth-card">
          <div className="admin-lock-icon">
            <Lock size={30} />
          </div>

          {authView === 'login' ? (
            <>
              <h2 className="admin-auth-title">Admin Management Portal</h2>
              <p className="admin-auth-subtitle">Encrypted biometric and cryptographic authentication</p>

              {authError && <div className="admin-error-box">{authError}</div>}

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <label>Admin Master Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter admin password" 
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '14px' }}>
                  Authenticate & Unlock Portal
                </button>
              </form>

              <button 
                type="button" 
                onClick={() => { setAuthView('reset'); setAuthError(''); }}
                style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '600' }}
              >
                Forgot Password? Reset Here
              </button>
            </>
          ) : (
            <>
              <h2 className="admin-auth-title">Reset Admin Password</h2>
              <p className="admin-auth-subtitle">Verify registered admin email ({STORE_CONFIG.businessEmail})</p>

              {authError && <div className="admin-error-box">{authError}</div>}
              {authSuccess && <div className="admin-success-box">{authSuccess}</div>}

              <form onSubmit={handleResetSubmit}>
                <div className="form-group" style={{ marginBottom: '14px', textAlign: 'left' }}>
                  <label>Registered Admin Email *</label>
                  <input 
                    type="email" 
                    placeholder="e.g. remigold049@gmail.com" 
                    required
                    value={resetEmailInput}
                    onChange={e => setResetEmailInput(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px', textAlign: 'left' }}>
                  <label>New Password *</label>
                  <input 
                    type="password" 
                    placeholder="Enter new strong password" 
                    required
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px', textAlign: 'left' }}>
                  <label>Confirm New Password *</label>
                  <input 
                    type="password" 
                    placeholder="Re-type new password" 
                    required
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary btn-gold" style={{ width: '100%', marginBottom: '14px' }}>
                  Encrypt & Update Password
                </button>
              </form>

              <button 
                type="button" 
                onClick={() => { setAuthView('login'); setAuthError(''); }}
                style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}
              >
                Back To Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalValue = products.reduce((sum, p) => sum + (p.price * 10), 0);
  const inStockCount = products.filter(p => p.inStock).length;

  return (
    <div className="admin-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <span className="section-tag" style={{ color: 'var(--color-gold)' }}>Authorized Control</span>
            <h1>{STORE_CONFIG.brandName} Catalog Manager</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
              Logged in as Admin • Connected Email: <strong>{STORE_CONFIG.businessEmail}</strong>
            </p>
          </div>

          <div className="admin-actions-bar">
            <button 
              type="button" 
              className="btn-primary btn-gold" 
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} /> Upload New Formulation
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={logoutAdmin}
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="admin-metrics-grid">
          <div className="metric-card">
            <div className="metric-card-label">Total Formulations</div>
            <div className="metric-card-val">{products.length}</div>
          </div>

          <div className="metric-card">
            <div className="metric-card-label">Active In Stock</div>
            <div className="metric-card-val" style={{ color: '#2E7D32' }}>{inStockCount}</div>
          </div>

          <div className="metric-card">
            <div className="metric-card-label">Est. Catalog Stock Value</div>
            <div className="metric-card-val" style={{ color: 'var(--color-gold)' }}>
              {formatNaira(totalValue)}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Formulation</th>
                <th>Category</th>
                <th>Current Price (₦)</th>
                <th>Original Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-cell">
                      <img src={product.image} alt={product.title} className="admin-product-thumb" />
                      <div>
                        <strong>{product.title}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#9C8F85' }}>ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-gold">{product.category}</span></td>
                  <td><strong style={{ color: 'var(--color-dark)' }}>{formatNaira(product.price)}</strong></td>
                  <td>
                    {product.originalPrice ? (
                      <span style={{ textDecoration: 'line-through', color: '#9C8F85' }}>
                        {formatNaira(product.originalPrice)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {product.inStock ? (
                      <span style={{ color: '#2E7D32', fontWeight: '600', fontSize: '0.84rem' }}>● In Stock</span>
                    ) : (
                      <span style={{ color: '#C0392B', fontWeight: '600', fontSize: '0.84rem' }}>● Out of Stock</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      type="button" 
                      className="btn-action-icon"
                      onClick={() => handleOpenEdit(product)}
                      title="Edit Product Details / Price"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      type="button" 
                      className="btn-action-icon btn-action-delete"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
                          deleteProduct(product.id);
                        }
                      }}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>
                Edit Formulation: {editingProduct.title}
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Formulation Title *</label>
                <input 
                  type="text" 
                  required
                  value={formProduct.title}
                  onChange={e => setFormProduct({ ...formProduct, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Current Price in Naira (₦) *</label>
                  <input 
                    type="number" 
                    required
                    value={formProduct.price}
                    onChange={e => setFormProduct({ ...formProduct, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Original / Compare Price (₦)</label>
                  <input 
                    type="number" 
                    value={formProduct.originalPrice}
                    onChange={e => setFormProduct({ ...formProduct, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formProduct.category}
                    onChange={e => setFormProduct({ ...formProduct, category: e.target.value })}
                  >
                    <option value="Serums">Serums</option>
                    <option value="Moisturizers">Moisturizers</option>
                    <option value="Cleansers">Cleansers</option>
                    <option value="Oils">Oils</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Volume / Size</label>
                  <input 
                    type="text" 
                    value={formProduct.volume}
                    onChange={e => setFormProduct({ ...formProduct, volume: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Skin Type Guidance</label>
                <input 
                  type="text" 
                  value={formProduct.skinType}
                  onChange={e => setFormProduct({ ...formProduct, skinType: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Description *</label>
                <textarea 
                  rows="3" 
                  required
                  value={formProduct.description}
                  onChange={e => setFormProduct({ ...formProduct, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Update Product Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                {formProduct.image && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={formProduct.image} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                    <small style={{ color: 'var(--color-text-muted)' }}>Image preview ready</small>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formProduct.inStock}
                    onChange={e => setFormProduct({ ...formProduct, inStock: e.target.checked })}
                  />
                  <span>Mark as In Stock</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formProduct.isNew}
                    onChange={e => setFormProduct({ ...formProduct, isNew: e.target.checked })}
                  />
                  <span>Mark as New Arrival</span>
                </label>
              </div>

              <button type="submit" className="btn-primary btn-gold" style={{ width: '100%' }}>
                Save Formulation Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>
                Upload New Formulation
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Formulation Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 24K Botanical Illuminating Oil" 
                  required
                  value={formProduct.title}
                  onChange={e => setFormProduct({ ...formProduct, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Price in Naira (₦) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 45000" 
                    required
                    value={formProduct.price}
                    onChange={e => setFormProduct({ ...formProduct, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Original / Cross-out Price (₦)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 55000" 
                    value={formProduct.originalPrice}
                    onChange={e => setFormProduct({ ...formProduct, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formProduct.category}
                    onChange={e => setFormProduct({ ...formProduct, category: e.target.value })}
                  >
                    <option value="Serums">Serums</option>
                    <option value="Moisturizers">Moisturizers</option>
                    <option value="Cleansers">Cleansers</option>
                    <option value="Oils">Oils</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Volume / Size</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 30ml / 1 fl. oz." 
                    value={formProduct.volume}
                    onChange={e => setFormProduct({ ...formProduct, volume: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Skin Type</label>
                <input 
                  type="text" 
                  placeholder="e.g. All Skin Types / Melanin-Rich" 
                  value={formProduct.skinType}
                  onChange={e => setFormProduct({ ...formProduct, skinType: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Description *</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe the botanical formulation, active ingredients, and expected results..." 
                  required
                  value={formProduct.description}
                  onChange={e => setFormProduct({ ...formProduct, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Product Image (Upload or select)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                {formProduct.image && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={formProduct.image} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                    <small style={{ color: 'var(--color-text-muted)' }}>Image preview ready</small>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formProduct.inStock}
                    onChange={e => setFormProduct({ ...formProduct, inStock: e.target.checked })}
                  />
                  <span>Mark as In Stock</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formProduct.isNew}
                    onChange={e => setFormProduct({ ...formProduct, isNew: e.target.checked })}
                  />
                  <span>Mark as New Arrival</span>
                </label>
              </div>

              <button type="submit" className="btn-primary btn-gold" style={{ width: '100%' }}>
                Publish Formulation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
