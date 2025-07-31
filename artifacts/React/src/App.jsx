import './App.css';
import { useState, useEffect } from 'react';
import { 
  MdInventory, 
  MdNotifications, 
  MdArchive, 
  MdDevices, 
  MdDry, 
  MdLocalPharmacy, 
  MdChair,
  MdCategory,
  MdSearch,
  MdAdd,
  MdLogout,
  MdEdit,
  MdDelete,
  MdPerson,
  MdCheckCircle,
  MdError,
  MdWarning,
  MdClose
} from 'react-icons/md';

// ----- API Configuration -----
const API_BASE_URL = 'http://localhost:8000';

// ----- API Functions -----
const api = {
  async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async createProduct(product) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async updateProduct(id, product) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

// ----- Data -----
const sidebarIcons = {
  inventory: <MdInventory className="w-2.5 h-2.5 mr-2 flex-shrink-0" />,
  alerts: <MdNotifications className="w-2.5 h-2.5 mr-2 flex-shrink-0" />,
};

// ----- Utility Functions -----
const getProductIcon = (category) => {
  const iconClass = "w-5 h-5 flex-shrink-0";
  
  switch (category?.toLowerCase()) {
    case 'electronics':
      return <MdDevices className={`${iconClass} text-[#6246ea]`} />;
    case 'apparel':
      return <MdDry className={`${iconClass} text-gray-900`} />;
    case 'wellness':
      return <MdLocalPharmacy className={`${iconClass} text-gray-900`} />;
    case 'furniture':
      return <MdChair className={`${iconClass} text-gray-900`} />;
    default:
      return <MdCategory className={`${iconClass} text-gray-900`} />;
  }
};

// Helper function to format price
const formatPrice = (priceInCents) => {
  if (!priceInCents && priceInCents !== 0) return '$0.00';
  return `$${(priceInCents / 100).toFixed(2)}`;
};

const NotificationToast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <MdCheckCircle size={20} />;
      case 'error':
        return <MdError size={20} />;
      case 'warning':
        return <MdWarning size={20} />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return { bg: '#10b981', text: 'white' };
      case 'error': return { bg: '#dc2626', text: 'white' };
      case 'warning': return { bg: '#f59e0b', text: 'white' };
      default: return { bg: '#6366f1', text: 'white' };
    }
  };

  const colors = getColor();

  return (
    <div 
      className="notification-toast" 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: colors.bg,
        color: colors.text,
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10000,
        minWidth: '320px',
        animation: 'slideInFromRight 0.3s ease-out',
        backdropFilter: 'blur(10px)'
      }}
    >
      {getIcon()}
      <span style={{ flex: 1, fontWeight: '500' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          opacity: 0.8,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
      >
        <MdClose size={16} />
      </button>
    </div>
  );
};

const isLowStock = (stock, reorderPoint = 10) => {
  const stockNum = parseInt(stock);
  return stockNum > 0 && stockNum <= reorderPoint;
};

const isOutOfStock = (stock) => {
  const stockNum = parseInt(stock);
  return stockNum <= 0;
};

const isAlertItem = (product) => {
  return isOutOfStock(product.stock) || isLowStock(product.stock);
};

// ----- Components -----
const StyledButton = ({ children, className = "", type = "button", ...props }) => (
  <button type={type} className={className} {...props}>{children}</button>
);

const LoadingSpinner = () => (
  <div className="loading-spinner"></div>
);

const AddProductModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    price: '',
    stock: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.sku || !formData.name) {
      alert('SKU and Name are required fields');
      return;
    }

    // Convert price from dollars to cents for storage
    const priceInDollars = formData.price ? parseFloat(formData.price) : 0;
    const priceInCents = Math.round(priceInDollars * 100);
    const stock = formData.stock ? parseInt(formData.stock) : 0;

    onSubmit({
      ...formData,
      price: priceInCents,
      stock
    });
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      price: '',
      stock: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Product</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="sku">SKU *</label>
            <input
              id="sku"
              name="sku"
              type="text"
              className="form-input"
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g., ABC123"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Wireless Headphones"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className="form-input"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Furniture">Furniture</option>
              <option value="Wellness">Wellness</option>
              <option value="Books">Books</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="price">Price ($)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 29.99"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stock">Initial Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              className="form-input"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional product description..."
              disabled={isSubmitting}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner /> Creating...
                </>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SidebarLogo = () => (
  <div className="flex items-center mb-6 mt-1 select-none">
    <span className="font-semibold text-lg text-gray-900 tracking-tight font-sans" style={{ fontFamily: "inherit" }}>Inventory App</span>
  </div>
);

const SidebarNav = ({ items, onItemClick }) => (
  <nav className="space-y-1">
    {items.map((item) => (
      <button 
        key={item.key} 
        onClick={() => onItemClick(item.key)}
        className={`w-full text-left flex items-center px-2.5 py-2.5 rounded-lg text-[17px] transition-colors duration-100 ${item.active ? "bg-[#f6f6f8] text-black font-semibold" : "text-gray-600 hover:text-black hover:bg-[#f6f6f8]"}`} 
        aria-current={item.active ? "page" : undefined} 
        style={{ fontWeight: item.active ? 600 : 500, background: 'none', border: 'none' }}
      >
        {item.icon}{item.label}
      </button>
    ))}
  </nav>
);

const UserProfile = () => (
  <div className="flex items-center mt-10 mb-0 pb-4">
    <div className="flex-shrink-0">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f6f8] border border-gray-200">
        <MdPerson className="h-6 w-6 text-gray-400" />
      </span>
    </div>
    <div className="ml-3">
      <div className="text-gray-900 font-medium text-sm leading-tight">Hi John!</div>
      
    </div>
  </div>
);

const Sidebar = ({ currentView, onViewChange, alertCount }) => {
  const menuItems = [
    {
      label: "Inventory",
      key: "inventory",
      icon: sidebarIcons.inventory,
      active: currentView === 'inventory',
    },
    {
      label: `Alerts${alertCount > 0 ? ` (${alertCount})` : ''}`,
      key: "alerts",
      icon: sidebarIcons.alerts,
      active: currentView === 'alerts',
    },
  ];

  return (
    <aside className="sidebar">
      <div>
        <SidebarLogo />
        <SidebarNav items={menuItems} onItemClick={onViewChange} />
      </div>
      <UserProfile />
    </aside>
  );
};

const MainHeader = ({ onAddProduct, currentView, alertCount }) => (
  <div className="main-header">
    <h1>{currentView === 'alerts' ? `ALERTS${alertCount > 0 ? ` (${alertCount})` : ''}` : 'INVENTORY'}</h1>
    <div className="header-actions">
      <button className="logout-btn" title="Log out">
        <MdLogout size={22} />
        <span className="logout-text">Log out</span>
      </button>
      <StyledButton className="add-btn" onClick={onAddProduct}>
        <MdAdd size={18} />
        Add Product
      </StyledButton>
    </div>
  </div>
);

const Table = ({ products, onEditProduct, onDeleteProduct, searchTerm, currentView }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // First filter by view (inventory shows all, alerts shows only low/out of stock)
  const viewFilteredProducts = currentView === 'alerts' 
    ? products.filter(product => isAlertItem(product))
    : products;

  // Then filter by search term
  const filteredProducts = viewFilteredProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditStart = (product) => {
    setEditingId(product.id);
    setEditValue(product.name);
  };

  const handleEditSave = (product) => {
    if (editValue.trim() && editValue !== product.name) {
      onEditProduct(product.id, { name: editValue.trim() });
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyPress = (e, product) => {
    if (e.key === 'Enter') {
      handleEditSave(product);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`)) {
      onDeleteProduct(product.id);
    }
  };

  const getStockDisplay = (product) => {
    const stock = product.stock || 0;
    if (stock === 0) {
      return <span style={{ color: '#dc2626', fontWeight: 500 }}>Out of stock</span>;
    } else if (isLowStock(stock)) {
      return <span className="low-stock">Low stock ({stock})</span>;
    }
    return stock;
  };

  if (filteredProducts.length === 0) {
    return (
      <div className="table-card">
        <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
          {searchTerm ? (
            <>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔍</div>
              <div>No products found matching "{searchTerm}"</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
                Try adjusting your search terms
              </div>
            </>
          ) : currentView === 'alerts' ? (
            <>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>✅</div>
              <div>No stock alerts</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
                All products have sufficient stock levels
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>📦</div>
              <div>No products found</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
                Add your first product to get started!
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="product-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id}>
              <td className="product-cell">
                {getProductIcon(product.category || 'default')}
                {editingId === product.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, product)}
                    onBlur={() => handleEditSave(product)}
                    autoFocus
                    style={{
                      border: '1px solid #6366f1',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <span>{product.name}</span>
                )}
              </td>
              <td>
                <span style={{ 
                  display: 'inline-block',
                  background: product.category ? '#f3f4f6' : '#fef3c7',
                  color: product.category ? '#374151' : '#92400e',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {product.category || 'Uncategorized'}
                </span>
              </td>
              <td>{getStockDisplay(product)}</td>
              <td style={{ fontWeight: '500', color: '#059669' }}>
                {formatPrice(product.price)}
              </td>
              <td className="actions-cell">
                <button 
                  className="action-btn" 
                  title="Edit product name" 
                  onClick={() => handleEditStart(product)}
                  disabled={editingId === product.id}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#000'
                  }}
                >
                  <MdEdit size={16} />
                </button>
                <button 
                  className="action-btn" 
                  title="Delete product" 
                  onClick={() => handleDelete(product)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#dc2626'
                  }}
                >
                  <MdDelete size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredProducts.length > 0 && (
        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid #f0f0f0', 
          fontSize: '14px', 
          color: '#666',
          background: '#fafafa'
        }}>
          Showing {filteredProducts.length} of {viewFilteredProducts.length} {currentView === 'alerts' ? 'alert items' : 'products'}
          {searchTerm && ` matching "${searchTerm}"`}
          {currentView === 'alerts' && ` (${products.length} total products)`}
        </div>
      )}
    </div>
  );
};


const SearchBar = ({ searchTerm, onSearchChange }) => (
  <div className="search-bar">
    <MdSearch size={18} color="#bdbdbd" />
    <input 
      type="text" 
      placeholder="Search products..." 
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
    />
  </div>
);

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentView, setCurrentView] = useState('inventory'); // 'inventory' or 'alerts'

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const handleViewChange = (viewKey) => {
    setCurrentView(viewKey);
    setSearchTerm(''); // Clear search when switching views
  };

  // Calculate alert count
  const alertCount = products.filter(product => isAlertItem(product)).length;

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products. Make sure the backend server is running on http://localhost:8000');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    setIsSubmitting(true);
    try {
      const newProduct = await api.createProduct(productData);
      setShowAddModal(false);
      
      // Refresh the entire product list from server
      await loadProducts();
      
      showNotification(`Successfully added "${newProduct.name}"`, 'success');
    } catch (err) {
      showNotification('Failed to create product: ' + err.message, 'error');
      console.error('Error creating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (id, updates) => {
    try {
      await api.updateProduct(id, updates);
      
      // Refresh the entire product list from server
      await loadProducts();
      
      showNotification('Product updated successfully!', 'success');
    } catch (err) {
      showNotification('Failed to update product: ' + err.message, 'error');
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      
      // Refresh the entire product list from server
      await loadProducts();
      
      showNotification('Product deleted successfully!', 'success');
    } catch (err) {
      showNotification('Failed to delete product: ' + err.message, 'error');
      console.error('Error deleting product:', err);
    }
  };

  if (loading) {
    return (
      <div className="app-bg">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <LoadingSpinner />
          Loading products...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-bg">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ marginBottom: '20px' }}>❌ {error}</div>
          <button 
            onClick={loadProducts}
            className="btn btn-primary"
          >
            <LoadingSpinner /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg">
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        alertCount={alertCount}
      />
      <main className="main-content">
        <MainHeader 
          onAddProduct={() => setShowAddModal(true)} 
          currentView={currentView}
          alertCount={alertCount}
        />
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <Table 
          products={products} 
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          searchTerm={searchTerm}
          currentView={currentView}
        />
      </main>
      
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default App;

