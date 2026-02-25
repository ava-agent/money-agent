export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Method {
  id: number;
  slug: string;
  number: number;
  category_id: string;
  title: string;
  description: string;
  income: string;
  icon: string;
  detail_markdown: string;
  difficulty: string;
  risk_level: string;
  created_at: string;
}

export interface BusinessModel {
  id: number;
  slug: string;
  title: string;
  description: string;
  income_range: string;
  steps_markdown: string;
  sort_order: number;
  created_at: string;
}

export interface GuideSection {
  id: number;
  slug: string;
  title: string;
  content_markdown: string;
  sort_order: number;
  section_type: string;
}
