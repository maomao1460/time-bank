-- 给 children 表添加 is_active 字段用于软删除
ALTER TABLE children ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
