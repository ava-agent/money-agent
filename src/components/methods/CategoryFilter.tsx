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
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
          activeCategory === null
            ? "text-white shadow-md"
            : "hover:opacity-80"
        }`}
        style={
          activeCategory === null
            ? { backgroundColor: "var(--accent)" }
            : { backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }
        }
      >
        All
      </button>
      {categories.map((cat) => {
        const colors = getCategoryColors(cat.code);
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? "text-white shadow-md"
                : "hover:opacity-80"
            }`}
            style={
              isActive
                ? { backgroundColor: colors.hex }
                : { backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }
            }
          >
            {cat.icon} {cat.name}
          </button>
        );
      })}
    </div>
  );
}
