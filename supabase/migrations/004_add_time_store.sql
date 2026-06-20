-- 时间超市数据库迁移脚本

-- 商品表
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_minutes INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 商品购买限制表
CREATE TABLE IF NOT EXISTS store_item_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month')),
  max_count INT NOT NULL,
  UNIQUE(item_id, period)
);

-- 购买记录表
CREATE TABLE IF NOT EXISTS store_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  price_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_item_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;

-- store_items 策略
CREATE POLICY "Parents can view their store items"
  ON store_items FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their store items"
  ON store_items FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their store items"
  ON store_items FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their store items"
  ON store_items FOR DELETE
  USING (auth.uid() = parent_id);

-- store_item_limits 策略
CREATE POLICY "Parents can view their item limits"
  ON store_item_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_items
      WHERE store_items.id = store_item_limits.item_id
      AND store_items.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their item limits"
  ON store_item_limits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM store_items
      WHERE store_items.id = store_item_limits.item_id
      AND store_items.parent_id = auth.uid()
    )
  );

-- store_purchases 策略
CREATE POLICY "Parents can view their children's purchases"
  ON store_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = store_purchases.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert their children's purchases"
  ON store_purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = store_purchases.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- 索引
CREATE INDEX idx_store_items_parent_id ON store_items(parent_id);
CREATE INDEX idx_store_item_limits_item_id ON store_item_limits(item_id);
CREATE INDEX idx_store_purchases_item_id ON store_purchases(item_id);
CREATE INDEX idx_store_purchases_child_id ON store_purchases(child_id);
CREATE INDEX idx_store_purchases_created_at ON store_purchases(created_at);
