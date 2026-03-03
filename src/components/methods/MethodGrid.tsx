"use client";

import { useState, useMemo } from "react";
import { Category, Method } from "@/lib/supabase/types";
import CategoryFilter from "./CategoryFilter";
import MethodCard from "./MethodCard";

interface MethodGridProps {
  categories: Category[];
  methods: Method[];
}

export default function MethodGrid({ categories, methods }: MethodGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  const filtered = activeCategory
    ? methods.filter((m) => m.category_id === activeCategory)
    : methods;

  return (
    <div>
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((method, index) => (
          <div
            key={`${activeCategory}-${method.id}`}
            className="animate-card-enter"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <MethodCard
              method={method}
              categoryCode={categoryMap[method.category_id]?.code ?? ""}
            />
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">该分类暂无方法</p>
      )}
    </div>
  );
}
