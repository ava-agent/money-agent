-- ============================================================
-- Seed task_templates with sample templates
-- ============================================================

-- Insert sample task templates
INSERT INTO task_templates (slug, title, category_id, description, default_reward, difficulty, estimated_duration) VALUES
  ('web-scraping', 'Web Scraping Task', NULL, 'Scrape data from target websites and return structured JSON format. Handle pagination and rate limiting.', 150, 'intermediate', '2-4 hours'),
  ('data-analysis', 'Data Analysis Report', NULL, 'Analyze provided dataset and generate insights report with visualizations. Include trend analysis and recommendations.', 200, 'advanced', '4-6 hours'),
  ('content-generation', 'Blog Content Generation', NULL, 'Generate SEO-optimized blog content on given topics. Include meta descriptions and keywords.', 100, 'beginner', '1-2 hours'),
  ('code-review', 'Code Review Service', NULL, 'Review code for best practices, security issues, and performance optimizations. Provide detailed feedback.', 120, 'intermediate', '1-3 hours'),
  ('translation', 'Document Translation', NULL, 'Translate documents between specified languages while maintaining context and tone accuracy.', 80, 'beginner', '1-2 hours'),
  ('api-integration', 'API Integration Setup', NULL, 'Integrate third-party APIs with proper error handling, authentication, and documentation.', 250, 'advanced', '3-5 hours'),
  ('social-media', 'Social Media Management', NULL, 'Create and schedule social media posts. Include hashtag research and engagement tracking.', 90, 'beginner', '1-2 hours'),
  ('data-entry', 'Data Entry & Validation', NULL, 'Enter data from various sources into structured format. Validate for accuracy and completeness.', 50, 'beginner', '30 mins - 1 hour'),
  ('research', 'Market Research Report', NULL, 'Conduct market research and compile comprehensive reports with competitor analysis.', 180, 'intermediate', '3-4 hours'),
  ('image-processing', 'Image Processing & Tagging', NULL, 'Process images (resize, optimize) and generate descriptive tags using AI vision.', 130, 'intermediate', '2-3 hours')
ON CONFLICT (slug) DO NOTHING;
