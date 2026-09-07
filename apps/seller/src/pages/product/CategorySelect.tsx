import React from 'react';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';

export interface Category {
  category_id: string;
  name: string;
  parent_category_id: string | null;
  level: number;
}

interface CategorySelectProps {
  allCategories: Category[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedL1: string | null;
  setSelectedL1: (id: string | null) => void;
  selectedL2: string | null;
  setSelectedL2: (id: string | null) => void;
  onSelectL3: (cat: Category) => void;
  onBack?: () => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  allCategories,
  searchQuery,
  setSearchQuery,
  selectedL1,
  setSelectedL1,
  selectedL2,
  setSelectedL2,
  onSelectL3,
  onBack,
}) => {
  // Filter categories by hierarchy
  const level1Categories = allCategories.filter((c) => c.level === 1);
  const level2Categories = selectedL1
    ? allCategories.filter((c) => c.level === 2 && c.parent_category_id === selectedL1)
    : [];
  const level3Categories = selectedL2
    ? allCategories.filter((c) => c.level === 3 && c.parent_category_id === selectedL2)
    : [];

  // Search filter across Level 3 categories
  const filteredL3Categories = searchQuery.trim() !== ''
    ? allCategories.filter((c) => c.level === 3 && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const selectedL1Name = allCategories.find(c => c.category_id === selectedL1)?.name;
  const selectedL2Name = allCategories.find(c => c.category_id === selectedL2)?.name;

  return (
    <div className="w-full bg-white space-y-4">
      {/* Category Search */}
      <div className="relative w-full max-w-2xl">
        <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search categories e.g. Saree, Handicrafts, Spices, Mug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-neutral-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder-neutral-400"
        />
      </div>

      {searchQuery.trim() !== '' ? (
        // Search Results Mode
        <div className="space-y-2">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-400">Search Results</h4>
          <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden bg-white shadow-sm">
            {filteredL3Categories.length === 0 ? (
              <p className="p-6 text-sm text-neutral-500 italic text-center">No categories matching "{searchQuery}"</p>
            ) : (
              filteredL3Categories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => onSelectL3(cat)}
                  className="w-full px-5 py-3.5 text-left hover:bg-neutral-50 text-sm font-semibold text-neutral-800 flex justify-between items-center transition-colors"
                >
                  <span>{cat.name}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        /* 3-Column Level Selection Content */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[420px] bg-neutral-50/50 p-4 rounded-2xl border border-neutral-200">
          {/* Level 1: Main Categories */}
          <div className={`bg-white border border-neutral-200 rounded-xl overflow-y-auto max-h-[480px] shadow-sm ${selectedL1 ? 'hidden md:block' : 'block'}`}>
            <div className="p-3.5 border-b border-neutral-100 bg-neutral-50">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">1. Main Categories</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {level1Categories.length === 0 ? (
                <p className="p-4 text-xs text-neutral-400">Loading categories...</p>
              ) : (
                level1Categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => {
                      setSelectedL1(cat.category_id);
                      setSelectedL2(null);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all flex justify-between items-center ${
                      selectedL1 === cat.category_id
                        ? 'bg-emerald-50 text-emerald-700 md:bg-emerald-600 md:text-white'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className={`w-4 h-4 ${selectedL1 === cat.category_id ? 'text-emerald-600 md:text-white' : 'text-neutral-300'}`} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Level 2: Sub-categories */}
          <div className={`bg-white border border-neutral-200 rounded-xl overflow-y-auto max-h-[480px] shadow-sm ${selectedL1 && !selectedL2 ? 'block' : 'hidden md:block'}`}>
            {/* Back link for mobile */}
            <button
              type="button"
              onClick={() => setSelectedL1(null)}
              className="md:hidden w-full px-4 py-3 text-left border-b border-neutral-100 flex items-center gap-2 text-xs font-bold text-neutral-800 bg-white"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
              <span>Back: {selectedL1Name}</span>
            </button>

            <div className="hidden md:block p-3.5 border-b border-neutral-100 bg-neutral-50">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                {selectedL1Name ? `2. ${selectedL1Name} Sub-categories` : '2. Sub-categories'}
              </p>
            </div>

            <div className="divide-y divide-neutral-100">
              {!selectedL1 ? (
                <p className="p-6 text-xs text-neutral-400 italic text-center">Select a main category first</p>
              ) : level2Categories.length === 0 ? (
                <p className="p-6 text-xs text-neutral-400 italic text-center">No sub-categories found</p>
              ) : (
                level2Categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => setSelectedL2(cat.category_id)}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all flex justify-between items-center ${
                      selectedL2 === cat.category_id
                        ? 'bg-emerald-50 text-emerald-700 md:bg-emerald-600 md:text-white'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className={`w-4 h-4 ${selectedL2 === cat.category_id ? 'text-emerald-600 md:text-white' : 'text-neutral-300'}`} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Level 3: Product Types */}
          <div className={`bg-white border border-neutral-200 rounded-xl overflow-y-auto max-h-[480px] shadow-sm ${selectedL2 ? 'block' : 'hidden md:block'}`}>
            {/* Back link for mobile */}
            <button
              type="button"
              onClick={() => setSelectedL2(null)}
              className="md:hidden w-full px-4 py-3 text-left border-b border-neutral-100 flex items-center gap-2 text-xs font-bold text-neutral-800 bg-white"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
              <span>Back: {selectedL2Name}</span>
            </button>

            <div className="hidden md:block p-3.5 border-b border-neutral-100 bg-neutral-50">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                {selectedL2Name ? `3. ${selectedL2Name} Types` : '3. Product Types'}
              </p>
            </div>

            <div className="divide-y divide-neutral-100">
              {!selectedL2 ? (
                <p className="p-6 text-xs text-neutral-400 italic text-center">Select a sub-category first</p>
              ) : level3Categories.length === 0 ? (
                <p className="p-6 text-xs text-neutral-400 italic text-center">No product types found</p>
              ) : (
                level3Categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => onSelectL3(cat)}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex justify-between items-center group"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Select &rarr;</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
