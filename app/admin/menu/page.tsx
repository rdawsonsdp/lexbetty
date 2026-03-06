'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminHeader from '@/components/admin/AdminHeader';
import CategoryTabs from '@/components/admin/CategoryTabs';
import SortableProductList from '@/components/admin/SortableProductList';
import ProductEditModal from '@/components/admin/ProductEditModal';
import ProductEditForm from '@/components/admin/ProductEditForm';
import { CateringProduct } from '@/lib/types';
import { ProductFormData } from '@/lib/product-schema';

interface AdminProduct extends CateringProduct {
  is_active: boolean;
  sort_position: number;
}

function getToken(): string {
  return sessionStorage.getItem('admin_token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

function AdminMenuPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      const { products } = await res.json();
      setProducts(products);
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDisabledCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.disabled_categories)) {
          setDisabledCategories(data.disabled_categories);
        }
      }
    } catch {
      // ignore — default to empty
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchDisabledCategories();
  }, [fetchProducts, fetchDisabledCategories]);

  // Toggle category enabled/disabled on public pages
  const handleToggleCategory = async (category: string, currentlyDisabled: boolean) => {
    const updated = currentlyDisabled
      ? disabledCategories.filter(c => c !== category)
      : [...disabledCategories, category];

    setDisabledCategories(updated);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ disabled_categories: updated }),
      });
      if (!res.ok) throw new Error();
      showToast(currentlyDisabled ? `${category} enabled` : `${category} hidden from public`);
    } catch {
      setDisabledCategories(disabledCategories);
      showToast('Failed to update category visibility', 'error');
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeCategory !== 'all') {
      result = result.filter(p => p.categories.includes(activeCategory as 'breakfast' | 'lunch' | 'dessert'));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.tags?.some(t => t.toLowerCase().includes(term))
      );
    }

    return result;
  }, [products, activeCategory, searchTerm]);

  // Reorder handler
  const handleReorder = async (reordered: AdminProduct[]) => {
    // Optimistic update
    const prevProducts = [...products];
    const newProducts = products.map(p => {
      const updated = reordered.find(r => r.id === p.id);
      return updated ?? p;
    }).sort((a, b) => a.sort_position - b.sort_position);
    setProducts(newProducts);

    try {
      const items = reordered.map(p => ({ id: p.id, sort_position: p.sort_position }));
      const res = await fetch('/api/admin/products/reorder', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to save order');
    } catch {
      setProducts(prevProducts);
      showToast('Failed to save order', 'error');
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (id: string, featured: boolean) => {
    const prev = [...products];
    setProducts(ps => ps.map(p => p.id === id ? { ...p, featured } : p));

    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...product, featured }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts(prev);
      showToast('Failed to update', 'error');
    }
  };

  // Toggle active
  const handleToggleActive = async (id: string, active: boolean) => {
    const prev = [...products];
    setProducts(ps => ps.map(p => p.id === id ? { ...p, is_active: active } : p));

    if (!active) {
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error();
        showToast('Item deactivated');
      } catch {
        setProducts(prev);
        showToast('Failed to deactivate', 'error');
      }
    } else {
      try {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ ...product, is_active: true }),
        });
        if (!res.ok) throw new Error();
        showToast('Item activated');
      } catch {
        setProducts(prev);
        showToast('Failed to activate', 'error');
      }
    }
  };

  // Save product (create or update)
  const handleSave = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/admin/products/${data.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      showToast(isEdit ? 'Item updated' : 'Item created');
      setEditingProduct(null);
      setIsCreating(false);
      await fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!editingProduct || !confirm('Deactivate this item? It will be hidden from the public menu.')) return;

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();

      showToast('Item deactivated');
      setEditingProduct(null);
      await fetchProducts();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const productToFormData = (product: AdminProduct): ProductFormData => ({
    id: product.id,
    title: product.title,
    description: product.description,
    image: product.image,
    categories: product.categories,
    pricing: product.pricing,
    tags: product.tags,
    featured: product.featured,
    is_active: product.is_active,
    sort_position: product.sort_position,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AdminHeader
          itemCount={products.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setIsCreating(true)}
        />

        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          disabledCategories={disabledCategories}
          onToggleCategory={handleToggleCategory}
        />

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchTerm ? 'No items match your search.' : 'No items in this category.'}
          </div>
        ) : (
          <SortableProductList
            products={filteredProducts}
            onReorder={handleReorder}
            onEdit={(product) => setEditingProduct(product)}
            onToggleFeatured={handleToggleFeatured}
            onToggleActive={handleToggleActive}
          />
        )}
      </div>

      {/* Edit Modal */}
      <ProductEditModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Item"
      >
        {editingProduct && (
          <ProductEditForm
            product={productToFormData(editingProduct)}
            onSave={handleSave}
            onDelete={handleDelete}
            onCancel={() => setEditingProduct(null)}
            isSaving={isSaving}
          />
        )}
      </ProductEditModal>

      {/* Create Modal */}
      <ProductEditModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Add New Item"
      >
        <ProductEditForm
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
          isSaving={isSaving}
        />
      </ProductEditModal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function AdminMenuPageWrapper() {
  return (
    <AdminAuthGate>
      <AdminMenuPage />
    </AdminAuthGate>
  );
}
