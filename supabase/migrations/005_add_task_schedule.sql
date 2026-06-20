-- 添加任务计划日期和时间字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- 创建唯一约束：同一天同一时间不能有同名任务
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_unique_schedule 
  ON tasks (name, parent_id, child_id, scheduled_date, scheduled_time) 
  WHERE scheduled_date IS NOT NULL AND scheduled_time IS NOT NULL AND is_active = true;
