-- 给 tasks 表添加 is_template 字段用于快捷任务
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
