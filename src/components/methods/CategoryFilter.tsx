"use client";

import { Category } from "@/lib/supabase/types";

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
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          activeCategory === null
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === cat.id
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  );
}
