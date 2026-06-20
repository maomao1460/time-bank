-- 时间银行数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 孩子档案表
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 任务模板表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  planned_minutes INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 时间记录表
CREATE TABLE IF NOT EXISTS time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_minutes INT NOT NULL,
  actual_minutes INT,
  saved_minutes INT GENERATED ALWAYS AS (planned_minutes - actual_minutes) STORED,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 时间银行账户表
CREATE TABLE IF NOT EXISTS time_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE UNIQUE,
  total_saved_minutes INT DEFAULT 0,
  total_used_minutes INT DEFAULT 0,
  balance_minutes INT GENERATED ALWAYS AS (total_saved_minutes - total_used_minutes) STORED,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 时间交易记录表
CREATE TABLE IF NOT EXISTS time_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  minutes INT NOT NULL,
  source TEXT,
  record_id UUID REFERENCES time_records(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 Row Level Security
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_transactions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- Children 策略
CREATE POLICY "Parents can view their children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- Tasks 策略
CREATE POLICY "Parents can view their tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = parent_id);

-- Time Records 策略
CREATE POLICY "Parents can view their time records"
  ON time_records FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their time records"
  ON time_records FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their time records"
  ON time_records FOR UPDATE
  USING (auth.uid() = parent_id);

-- Time Bank 策略
CREATE POLICY "Parents can view their children's bank"
  ON time_bank FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = time_bank.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert bank for their children"
  ON time_bank FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = time_bank.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update their children's bank"
  ON time_bank FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = time_bank.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Time Transactions 策略
CREATE POLICY "Parents can view their children's transactions"
  ON time_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = time_transactions.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert their children's transactions"
  ON time_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = time_transactions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- 创建索引
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_time_records_parent_id ON time_records(parent_id);
CREATE INDEX idx_time_records_child_id ON time_records(child_id);
CREATE INDEX idx_time_records_task_id ON time_records(task_id);
CREATE INDEX idx_time_bank_child_id ON time_bank(child_id);
CREATE INDEX idx_time_transactions_child_id ON time_transactions(child_id);
