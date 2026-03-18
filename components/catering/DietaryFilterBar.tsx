'use client';

interface DietaryFilterBarProps {
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

const DIETARY_FILTERS = [
  { id: 'popular', label: 'Popular' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'southern', label: 'Southern' },
];

export default function DietaryFilterBar({ activeTags, onToggleTag }: DietaryFilterBarProps) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
      {DIETARY_FILTERS.map((filter) => {
        const isActive = activeTags.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => onToggleTag(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#E8621A] hover:text-[#1A1A1A]'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
      {activeTags.length > 0 && (
        <button
          onClick={() => activeTags.forEach(tag => onToggleTag(tag))}
          className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap text-red-500 hover:bg-red-50 transition-all"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
