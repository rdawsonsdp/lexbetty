'use client';

interface AdminHeaderProps {
  itemCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export default function AdminHeader({ itemCount, searchTerm, onSearchChange, onAddClick }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-500 mt-1">{itemCount} items</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#dabb64] focus:border-transparent"
          />
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-[#dabb64] text-gray-900 px-4 py-2.5 rounded-lg font-semibold hover:bg-[#c5a855] transition-colors whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>
    </div>
  );
}
