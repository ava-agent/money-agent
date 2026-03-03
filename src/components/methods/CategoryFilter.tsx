"use client";

import { Category } from "@/lib/supabase/types";
import { getCategoryColors } from "@/lib/categoryColors";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          activeCategory === null
            ? "bg-indigo-600 text-white shadow-md"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => {
        const colors = getCategoryColors(cat.code);
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? "text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={isActive ? { backgroundColor: colors.hex } : undefined}
          >
            {cat.icon} {cat.name}
          </button>
        );
      })}
    </div>
  );
}
