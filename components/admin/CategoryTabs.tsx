'use client';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dessert', label: 'Dessert' },
] as const;

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  disabledCategories?: string[];
  onToggleCategory?: (category: string, enabled: boolean) => void;
}

export default function CategoryTabs({
  activeCategory,
  onCategoryChange,
  disabledCategories = [],
  onToggleCategory,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const isDisabled = disabledCategories.includes(cat.id);

        return (
          <div key={cat.id} className="flex items-center gap-1.5">
            <button
              onClick={() => onCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#383838] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>

            {/* Toggle switch — only for real categories (not "all") */}
            {cat.id !== 'all' && onToggleCategory && (
              <button
                type="button"
                onClick={() => onToggleCategory(cat.id, isDisabled)}
                title={isDisabled ? `Enable ${cat.label} on public pages` : `Disable ${cat.label} on public pages`}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  isDisabled ? 'bg-gray-300' : 'bg-green-500'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    isDisabled ? '' : 'translate-x-4'
                  }`}
                />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
