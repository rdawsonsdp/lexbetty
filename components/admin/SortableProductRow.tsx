'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CateringProduct } from '@/lib/types';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';

interface AdminProduct extends CateringProduct {
  is_active: boolean;
  sort_position: number;
}

interface SortableProductRowProps {
  product: AdminProduct;
  onEdit: (product: AdminProduct) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

function getPricingBadge(pricing: CateringProduct['pricing']): string {
  switch (pricing.type) {
    case 'tray': return `$${pricing.sizes[0].price}–$${pricing.sizes[pricing.sizes.length - 1].price}`;
    case 'pan': return `$${pricing.sizes[0].price}–$${pricing.sizes[pricing.sizes.length - 1].price}`;
    case 'per-person': return `$${pricing.pricePerPerson}/person`;
    case 'per-dozen': return `$${pricing.pricePerDozen}/dozen`;
    case 'per-each': return `$${pricing.priceEach}/${pricing.unit === 'lb' ? 'lb' : 'each'}`;
    case 'per-lb': return `$${pricing.pricePerLb}/lb`;
    case 'per-container': return `$${pricing.pricePerContainer}/container`;
    case 'flat': return `$${pricing.flatPrice} flat`;
    default: return '';
  }
}

export default function SortableProductRow({ product, onEdit, onToggleFeatured, onToggleActive }: SortableProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow ${
        !product.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        <ProductImagePlaceholder title={product.title} className="text-[8px] sm:text-[8px] p-1" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
          {product.featured && (
            <span className="text-yellow-500 text-xs flex-shrink-0" title="Featured">&#9733;</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {getPricingBadge(product.pricing)}
          </span>
          {product.categories.map(cat => (
            <span key={cat} className="text-xs text-gray-400 capitalize hidden sm:inline">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Featured toggle */}
        <button
          onClick={() => onToggleFeatured(product.id, !product.featured)}
          className={`p-2 rounded-lg transition-colors ${
            product.featured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-50 hover:text-yellow-400'
          }`}
          title={product.featured ? 'Remove featured' : 'Mark as featured'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>

        {/* Active toggle */}
        <button
          onClick={() => onToggleActive(product.id, !product.is_active)}
          className={`relative w-9 h-5 rounded-full transition-colors ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
          title={product.is_active ? 'Deactivate' : 'Activate'}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${product.is_active ? 'translate-x-4' : ''}`} />
        </button>

        {/* Edit button */}
        <button
          onClick={() => onEdit(product)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
