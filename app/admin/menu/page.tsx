'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';
import AdminHeader from '@/components/admin/AdminHeader';
import CategoryTabs from '@/components/admin/CategoryTabs';
import SortableProductList from '@/components/admin/SortableProductList';
import ProductEditModal from '@/components/admin/ProductEditModal';
import ProductEditForm from '@/components/admin/ProductEditForm';
import { CateringProduct, CateringPackage, EventType } from '@/lib/types';
import { ProductFormData } from '@/lib/product-schema';
import { exportMenuPDF, exportMenuXLS } from '@/lib/menu-export';

interface AdminProduct extends CateringProduct {
  is_active: boolean;
  sort_position: number;
}

interface AdminPackage extends CateringPackage {
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
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  // Packages state
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<AdminPackage | null>(null);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [pkgForm, setPkgForm] = useState({ id: '', title: '', description: '', pricePerPerson: '', image: '/images/bbq_brisket.jpg', items: '', categories: 'lunch', minHeadcount: '', maxHeadcount: '' });
  const [activeTab, setActiveTab] = useState<'products' | 'packages'>('products');
  // Snapshot of products at last save/load, used to detect real changes
  const [cleanSnapshot, setCleanSnapshot] = useState<Map<string, { is_active: boolean; featured?: boolean }>>(new Map());

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      const { products: fetched } = await res.json();
      setProducts(fetched);
      // Capture clean state for dirty tracking
      const snap = new Map<string, { is_active: boolean; featured?: boolean }>();
      for (const p of fetched as AdminProduct[]) {
        snap.set(p.id, { is_active: p.is_active, featured: p.featured });
      }
      setCleanSnapshot(snap);
      setDirtyIds(new Set());
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

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/packages', { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const { packages: fetched } = await res.json();
      setPackages(fetched || []);
    } catch {
      // Packages may not be in DB yet — fall back silently
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchDisabledCategories();
    fetchPackages();
  }, [fetchProducts, fetchDisabledCategories, fetchPackages]);

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
      result = result.filter(p => p.categories.includes(activeCategory as EventType));
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

  // Helper: mark a product dirty or clean based on whether it differs from snapshot
  const updateDirty = (id: string, newState: { is_active: boolean; featured?: boolean }) => {
    const clean = cleanSnapshot.get(id);
    setDirtyIds(prev => {
      const next = new Set(prev);
      if (clean && clean.is_active === newState.is_active && (clean.featured ?? false) === (newState.featured ?? false)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle featured — local only
  const handleToggleFeatured = (id: string, featured: boolean) => {
    setProducts(ps => ps.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, featured };
      updateDirty(id, { is_active: updated.is_active, featured });
      return updated;
    }));
  };

  // Toggle active — local only
  const handleToggleActive = (id: string, active: boolean) => {
    setProducts(ps => ps.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, is_active: active };
      updateDirty(id, { is_active: active, featured: updated.featured });
      return updated;
    }));
  };

  // Batch save all dirty changes
  const handleBatchSave = async () => {
    if (dirtyIds.size === 0) return;
    setIsBatchSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of Array.from(dirtyIds)) {
      const product = products.find(p => p.id === id);
      if (!product) continue;

      try {
        if (!product.is_active) {
          const res = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
          });
          if (!res.ok) throw new Error();
        } else {
          const res = await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(product),
          });
          if (!res.ok) throw new Error();
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      showToast(`Saved ${successCount} change${successCount !== 1 ? 's' : ''}`);
      // Update snapshot to current state
      const snap = new Map<string, { is_active: boolean; featured?: boolean }>();
      for (const p of products) {
        snap.set(p.id, { is_active: p.is_active, featured: p.featured });
      }
      setCleanSnapshot(snap);
      setDirtyIds(new Set());
    } else {
      showToast(`${failCount} change${failCount !== 1 ? 's' : ''} failed to save`, 'error');
    }

    setIsBatchSaving(false);
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

  // Package handlers
  const handleSavePackage = async () => {
    setIsSaving(true);
    try {
      const isEdit = !!editingPackage;
      const payload = {
        id: pkgForm.id,
        title: pkgForm.title,
        description: pkgForm.description,
        pricePerPerson: parseFloat(pkgForm.pricePerPerson) || 0,
        image: pkgForm.image,
        items: pkgForm.items.split('\n').filter(s => s.trim()),
        categories: [pkgForm.categories],
        minHeadcount: pkgForm.minHeadcount ? parseInt(pkgForm.minHeadcount) : null,
        maxHeadcount: pkgForm.maxHeadcount ? parseInt(pkgForm.maxHeadcount) : null,
        is_active: true,
        sort_position: isEdit ? editingPackage.sort_position : packages.length,
      };

      const res = await fetch('/api/admin/packages', {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');

      showToast(isEdit ? 'Package updated' : 'Package created');
      setEditingPackage(null);
      setIsCreatingPackage(false);
      setPkgForm({ id: '', title: '', description: '', pricePerPerson: '', image: '/images/bbq_brisket.jpg', items: '', categories: 'lunch', minHeadcount: '', maxHeadcount: '' });
      await fetchPackages();
    } catch {
      showToast('Failed to save package', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePackageActive = async (pkg: AdminPackage) => {
    const newActive = !pkg.is_active;
    // Optimistic update
    setPackages(ps => ps.map(p => p.id === pkg.id ? { ...p, is_active: newActive } : p));

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          id: pkg.id,
          title: pkg.title,
          description: pkg.description,
          pricePerPerson: pkg.pricePerPerson,
          image: pkg.image,
          items: pkg.items,
          categories: pkg.categories,
          minHeadcount: pkg.minHeadcount,
          maxHeadcount: pkg.maxHeadcount,
          sort_position: pkg.sort_position,
          is_active: newActive,
        }),
      });
      if (!res.ok) throw new Error();
      showToast(newActive ? `${pkg.title} is now visible` : `${pkg.title} hidden from customers`);
    } catch {
      // Revert on failure
      setPackages(ps => ps.map(p => p.id === pkg.id ? { ...p, is_active: pkg.is_active } : p));
      showToast('Failed to update package', 'error');
    }
  };

  const openEditPackage = (pkg: AdminPackage) => {
    setEditingPackage(pkg);
    setPkgForm({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      pricePerPerson: String(pkg.pricePerPerson),
      image: pkg.image,
      items: pkg.items.join('\n'),
      categories: pkg.categories[0] || 'lunch',
      minHeadcount: pkg.minHeadcount ? String(pkg.minHeadcount) : '',
      maxHeadcount: pkg.maxHeadcount ? String(pkg.maxHeadcount) : '',
    });
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
    minOrderQuantity: product.minOrderQuantity,
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
      <AdminNav />
      {/* Sticky Save Bar */}
      {dirtyIds.size > 0 && (
        <div className="sticky top-0 z-50 bg-amber-50 border-b-2 border-amber-300 shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800">
              {dirtyIds.size} unsaved change{dirtyIds.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Revert: reload products from server
                  setLoading(true);
                  fetchProducts();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isBatchSaving}
              >
                Discard
              </button>
              <button
                onClick={handleBatchSave}
                disabled={isBatchSaving}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isBatchSaving ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  `Save Changes (${dirtyIds.size})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Products / Packages Tab Switcher */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2.5 font-oswald font-bold tracking-wider rounded-lg transition-colors ${
              activeTab === 'products' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            MENU ITEMS ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-2.5 font-oswald font-bold tracking-wider rounded-lg transition-colors ${
              activeTab === 'packages' ? 'bg-[#E8621A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            PACKAGES ({packages.length})
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => exportMenuPDF(products, packages)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download menu as PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              PDF
            </button>
            <button
              onClick={() => exportMenuXLS(products, packages)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download menu as Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              XLS
            </button>
          </div>
        </div>

        {activeTab === 'packages' ? (
          /* ==================== PACKAGES TAB ==================== */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-oswald text-2xl font-bold text-[#1A1A1A]">Package Deals</h2>
              <button
                onClick={() => { setIsCreatingPackage(true); setPkgForm({ id: '', title: '', description: '', pricePerPerson: '', image: '/images/bbq_brisket.jpg', items: '', categories: 'lunch', minHeadcount: '', maxHeadcount: '' }); }}
                className="bg-[#E8621A] text-white font-oswald font-bold px-5 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Package
              </button>
            </div>

            {/* Package List */}
            <div className="space-y-3">
              {packages.map(pkg => (
                <div key={pkg.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between ${pkg.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-oswald font-bold text-[#1A1A1A] text-lg">{pkg.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{pkg.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="text-[#E8621A] font-bold">${pkg.pricePerPerson}/person</span>
                      {pkg.minHeadcount && <span>Min {pkg.minHeadcount} guests</span>}
                      <span>{pkg.items.length} items included</span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePackageActive(pkg)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${pkg.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={pkg.is_active ? 'Active — visible to customers' : 'Inactive — hidden from customers'}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${pkg.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                    <button
                      onClick={() => openEditPackage(pkg)}
                      className="px-4 py-2 text-sm font-medium text-[#1A1A1A] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {packages.length === 0 && (
                <div className="text-center py-12 text-gray-400">No packages yet. Add your first package deal.</div>
              )}
            </div>

            {/* Package Edit/Create Form Modal */}
            {(editingPackage || isCreatingPackage) && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                  <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4">
                    {editingPackage ? 'Edit Package' : 'New Package'}
                  </h2>
                  <div className="space-y-4">
                    {!editingPackage && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID (slug)</label>
                        <input value={pkgForm.id} onChange={e => setPkgForm(f => ({ ...f, id: e.target.value }))} placeholder="e.g., betty-party-deal-5" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input value={pkgForm.title} onChange={e => setPkgForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A] resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Person ($)</label>
                        <input type="number" step="0.01" value={pkgForm.pricePerPerson} onChange={e => setPkgForm(f => ({ ...f, pricePerPerson: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select value={pkgForm.categories} onChange={e => setPkgForm(f => ({ ...f, categories: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]">
                          <option value="lunch">Lunch</option>
                          <option value="dessert">Dessert</option>
                          <option value="breakfast">Breakfast</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Headcount</label>
                        <input type="number" value={pkgForm.minHeadcount} onChange={e => setPkgForm(f => ({ ...f, minHeadcount: e.target.value }))} placeholder="e.g., 10" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Headcount</label>
                        <input type="number" value={pkgForm.maxHeadcount} onChange={e => setPkgForm(f => ({ ...f, maxHeadcount: e.target.value }))} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image Path</label>
                      <input value={pkgForm.image} onChange={e => setPkgForm(f => ({ ...f, image: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s Included (one item per line)</label>
                      <textarea value={pkgForm.items} onChange={e => setPkgForm(f => ({ ...f, items: e.target.value }))} rows={4} placeholder={"Choice of 3 Betty Meats\nChoice of 3 Betty Soulful Sides"} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A] resize-none font-mono text-sm" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleSavePackage} disabled={isSaving} className="flex-1 bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#4a4747] disabled:opacity-50">
                        {isSaving ? 'Saving...' : editingPackage ? 'Save Changes' : 'Create Package'}
                      </button>
                      <button onClick={() => { setEditingPackage(null); setIsCreatingPackage(false); }} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
        /* ==================== PRODUCTS TAB ==================== */
        <>
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
        </>
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
