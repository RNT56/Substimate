import React, { useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { X } from 'lucide-react';
import { PROTECTED_CATEGORIES } from '../lib/constants';

interface Props {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  subscriptions: { category: string }[];
}

export function CategoryFilter({ selectedCategory, onSelectCategory, subscriptions }: Props) {
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';
  const [categories, setCategories] = React.useState<string[]>(PROTECTED_CATEGORIES);

  useEffect(() => {
    if (!subscriptions?.length) {
      setCategories(PROTECTED_CATEGORIES);
      return;
    }

    // Get unique categories from subscriptions
    const uniqueCategories = new Set(PROTECTED_CATEGORIES);
    subscriptions.forEach(sub => {
      if (sub.category) uniqueCategories.add(sub.category);
    });

    // Sort categories alphabetically, keeping protected categories at the top
    const sortedCategories = Array.from(uniqueCategories).sort((a, b) => {
      const aProtected = PROTECTED_CATEGORIES.includes(a as any);
      const bProtected = PROTECTED_CATEGORIES.includes(b as any);
      if (aProtected && !bProtected) return -1;
      if (!aProtected && bProtected) return 1;
      return a.localeCompare(b);
    });

    setCategories(sortedCategories);
  }, [subscriptions]);

  const deleteCategory = async (categoryName: string) => {
    if (PROTECTED_CATEGORIES.includes(categoryName as any)) return;

    // If this category is selected, switch to 'All'
    if (selectedCategory === categoryName) {
      onSelectCategory('All');
    }

    // Remove category from list if no subscriptions use it
    if (!subscriptions.some(sub => sub.category === categoryName)) {
      setCategories(prev => prev.filter(cat => cat !== categoryName));
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {categories.map(category => (
        <div
          key={`category-${category}`}
          className="relative group"
        >
          <button
            onClick={() => onSelectCategory(category)}
            className={`themed-button px-4 py-2 rounded-lg text-sm transition-all ${
              selectedCategory === category
                ? isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {category}
          </button>
          {!PROTECTED_CATEGORIES.includes(category as any) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteCategory(category);
              }}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete category"
            >
              <X size={12} className="text-red-500" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}