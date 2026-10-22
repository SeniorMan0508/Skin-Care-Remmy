import React, { useState, useMemo } from 'react';
import { useStore, formatNaira } from '../context/StoreContext';
import { Search, ShoppingBag, Sparkles } from 'lucide-react';
import './ShopPage.css';

export default function ShopPage() {
  const { products, addToCart } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const categories = ['All', 'Serums', 'Moisturizers', 'Cleansers', 'Oils'];

  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.skinType && item.skinType.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'low-high') return a.price - b.price;
      if (sortBy === 'high-low') return b.price - a.price;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="shop-page">
      {/* Banner */}
      <section className="shop-banner">
        <div className="container">
          <span className="section-tag" style={{ color: 'var(--color-gold)' }}>Complete Apothecary</span>
          <h1>Formulations & Radiance Elixirs</h1>
          <p>Potent botanical extracts, cold-pressed oils, and restorative barrier science crafted for healthy, glowing skin.</p>
        </div>
      </section>

      {/* Controls & Grid */}
      <div className="container">
        <div className="shop-controls">
          {/* Category Tabs */}
          <div className="category-tabs">
            {categories.map(cat => (
              <button 
                key={cat}
                type="button" 
                className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="shop-filters-right">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search formulations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="sort-select" 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="default">Featured Sorting</option>
              <option value="low-high">Price: Low to High (₦)</option>
              <option value="high-low">Price: High to Low (₦)</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
            <Sparkles size={40} color="var(--color-gold)" style={{ marginBottom: '16px' }} />
            <h3>No formulations found matching your criteria.</h3>
            <p>Try searching with another keyword or resetting the category filter.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.title} className="product-img" />
                  <div className="product-badge-overlay">
                    {product.isNew && <span className="badge-gold">New</span>}
                    {!product.inStock && <span className="badge-dark" style={{ background: '#C0392B' }}>Out of Stock</span>}
                  </div>
                </div>

                <div className="product-info">
                  <div className="product-meta-row">
                    <span className="product-cat">{product.category}</span>
                    <span>{product.volume || 'Standard'}</span>
                  </div>

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
        )}
      </div>
    </div>
  );
}
