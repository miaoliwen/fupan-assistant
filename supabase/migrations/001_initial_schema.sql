-- Supabase 数据库迁移脚本
-- 将 SQLite schema 迁移到 PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 模板表
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'custom',
  is_built_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 模板章节表
CREATE TABLE IF NOT EXISTS template_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT DEFAULT '',
  placeholder TEXT DEFAULT '',
  type TEXT DEFAULT 'text',
  required BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0
);

-- 复盘记录表
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id),
  title TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  category TEXT DEFAULT 'custom',
  tags TEXT DEFAULT '[]',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 复盘章节表
CREATE TABLE IF NOT EXISTS review_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  content TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0
);

-- 行动项表
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_template_sections_template_id ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category);
CREATE INDEX IF NOT EXISTS idx_review_sections_review_id ON review_sections(review_id);
CREATE INDEX IF NOT EXISTS idx_action_items_review_id ON action_items(review_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- 启用 Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- RLS 策略：模板（所有人可读，只有管理员可写）
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON templates;
CREATE POLICY "Templates are viewable by everyone"
  ON templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Templates are insertable by authenticated users" ON templates;
CREATE POLICY "Templates are insertable by authenticated users"
  ON templates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Templates are updatable by authenticated users" ON templates;
CREATE POLICY "Templates are updatable by authenticated users"
  ON templates FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS 策略：模板章节（跟随模板权限）
DROP POLICY IF EXISTS "Template sections are viewable by everyone" ON template_sections;
CREATE POLICY "Template sections are viewable by everyone"
  ON template_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Template sections are insertable by authenticated users" ON template_sections;
CREATE POLICY "Template sections are insertable by authenticated users"
  ON template_sections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS 策略：复盘记录（用户只能访问自己的）
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 策略：复盘章节（跟随复盘记录权限）
DROP POLICY IF EXISTS "Users can view sections of their own reviews" ON review_sections;
CREATE POLICY "Users can view sections of their own reviews"
  ON review_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_sections.review_id
      AND reviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert sections to their own reviews" ON review_sections;
CREATE POLICY "Users can insert sections to their own reviews"
  ON review_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_sections.review_id
      AND reviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update sections of their own reviews" ON review_sections;
CREATE POLICY "Users can update sections of their own reviews"
  ON review_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_sections.review_id
      AND reviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete sections of their own reviews" ON review_sections;
CREATE POLICY "Users can delete sections of their own reviews"
  ON review_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_sections.review_id
      AND reviews.user_id = auth.uid()
    )
  );

-- RLS 策略：行动项（跟随复盘记录权限）
DROP POLICY IF EXISTS "Users can view actions of their own reviews" ON action_items;
CREATE POLICY "Users can view actions of their own reviews"
  ON action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = action_items.review_id
      AND reviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert actions to their own reviews" ON action_items;
CREATE POLICY "Users can insert actions to their own reviews"
  ON action_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = action_items.review_id
      AND reviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update actions of their own reviews" ON action_items;
CREATE POLICY "Users can update actions of their own reviews"
  ON action_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = action_items.review_id
      AND reviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete actions of their own reviews" ON action_items;
CREATE POLICY "Users can delete actions of their own reviews"
  ON action_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = action_items.review_id
      AND reviews.user_id = auth.uid()
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
