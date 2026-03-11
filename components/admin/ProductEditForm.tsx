'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/product-schema';
import PricingTypeFields from './PricingTypeFields';
import TagInput from './TagInput';
import ImageUploadZone from './ImageUploadZone';

interface ProductEditFormProps {
  product?: ProductFormData | null;
  onSave: (data: ProductFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function ProductEditForm({ product, onSave, onDelete, onCancel, isSaving }: ProductEditFormProps) {
  const isNew = !product;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      id: '',
      title: '',
      description: '',
      image: '/images/',
      categories: ['lunch'],
      pricing: { type: 'tray', sizes: [
        { size: 'small', price: 0, servesMin: 10, servesMax: 15 },
        { size: 'medium', price: 0, servesMin: 15, servesMax: 24 },
        { size: 'large', price: 0, servesMin: 25, servesMax: 40 },
      ]},
      tags: [],
      featured: false,
      is_active: true,
    },
  });

  const categories = watch('categories');
  const tags = watch('tags') ?? [];
  const featured = watch('featured');
  const isActive = watch('is_active');

  const toggleCategory = (cat: 'breakfast' | 'lunch' | 'dessert') => {
    const current = categories || [];
    if (current.includes(cat)) {
      if (current.length > 1) {
        setValue('categories', current.filter(c => c !== cat));
      }
    } else {
      setValue('categories', [...current, cat]);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Info</h3>

        {isNew && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID (slug)</label>
            <input
              {...register('id')}
              placeholder="e.g., beef-brisket"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
            />
            {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id.message}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            {...register('title')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A] resize-y"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <ImageUploadZone
            value={watch('image') ?? ''}
            onChange={(url) => setValue('image', url)}
          />
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="flex gap-3">
          {(['breakfast', 'lunch', 'dessert'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categories?.includes(cat)
                  ? 'bg-[#383838] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories.message}</p>}
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
        <PricingTypeFields register={register} setValue={setValue} watch={watch} />
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
        <TagInput tags={tags} onChange={(newTags) => setValue('tags', newTags)} />
      </div>

      {/* Flags */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Flags</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setValue('featured', !featured)}
              className={`relative w-11 h-6 rounded-full transition-colors ${featured ? 'bg-[#E8621A]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${featured ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-gray-700">Featured</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setValue('is_active', !isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${isActive !== false ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-[#383838] text-white py-3 rounded-lg font-semibold hover:bg-[#4a4747] transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : isNew ? 'Create Item' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        {!isNew && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
