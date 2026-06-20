import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { Plus, Pencil, Trash2, X, Play, Zap, Clock, Loader } from 'lucide-react'

interface TaskFormData {
  name: string
  category: string
  planned_minutes: number
  child_id: string
  is_template: boolean
}

export function Tasks() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const {
    children,
    tasks,
    quickTasks,
    fetchChildren,
    fetchTasks,
    fetchQuickTasks,
    addTask,
    createTaskFromTemplate,
    updateTask,
    deleteTask,
  } = useTaskStore()
  const { records, fetchRecords } = useBankStore()
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    category: '生活',
    planned_minutes: 30,
    child_id: '',
    is_template: false,
  })
  const [loading, setLoading] = useState(true)
  const [selectChildForTemplate, setSelectChildForTemplate] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchChildren(user.id),
        fetchTasks(user.id),
        fetchQuickTasks(user.id),
        fetchRecords(user.id),
      ]).then(() => setLoading(false))
    }
  }, [user, fetchChildren, fetchTasks, fetchQuickTasks, fetchRecords])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (editingTask) {
      await updateTask(editingTask, {
        name: formData.name,
        category: formData.category,
        planned_minutes: formData.planned_minutes,
      })
    } else {
      const now = new Date()
      await addTask({
        parent_id: user.id,
        child_id: formData.child_id,
        name: formData.name,
        category: formData.category,
        planned_minutes: formData.planned_minutes,
        is_active: true,
        is_template: formData.is_template,
        scheduled_date: now.toISOString().split('T')[0],
        scheduled_time: now.toTimeString().slice(0, 5),
      })
    }

    setShowForm(false)
    setEditingTask(null)
    setFormData({ name: '', category: '生活', planned_minutes: 30, child_id: children[0]?.id || '', is_template: false })
  }

  const handleEdit = (task: typeof tasks[0]) => {
    setEditingTask(task.id)
    setFormData({
      name: task.name,
      category: task.category || '生活',
      planned_minutes: task.planned_minutes,
      child_id: task.child_id,
      is_template: task.is_template,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      await deleteTask(id)
    }
  }

  const handleQuickTaskClick = async (template: typeof quickTasks[0]) => {
    if (children.length === 1) {
      await createTaskFromTemplate(template, children[0].id)
    } else if (children.length > 1) {
      setSelectChildForTemplate(template.id)
    }
  }

  const handleSelectChildForTemplate = async (childId: string) => {
    const template = quickTasks.find((t) => t.id === selectChildForTemplate)
    if (template) {
      await createTaskFromTemplate(template, childId)
    }
    setSelectChildForTemplate(null)
  }

  const categories = ['学习', '生活', '运动', '其他']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
        <button
          onClick={() => {
            setEditingTask(null)
    setFormData({ name: '', category: '生活', planned_minutes: 30, child_id: children[0]?.id || '', is_template: false })
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          添加任务
        </button>
      </div>

      {quickTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900">快捷任务</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickTasks.map((template) => (
              <button
                key={template.id}
                onClick={() => handleQuickTaskClick(template)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{template.name}</span>
                <span className="text-xs text-gray-500">{template.category}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {template.planned_minutes}分钟
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectChildForTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">选择孩子</h3>
              <button onClick={() => setSelectChildForTemplate(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChildForTemplate(child.id)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingTask ? '编辑任务' : '添加任务'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：做作业、吃饭、打扫卫生"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  计划时间（分钟）
                </label>
                <input
                  type="number"
                  value={formData.planned_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, planned_minutes: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {!editingTask && children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    指定孩子
                  </label>
                  <select
                    value={formData.child_id}
                    onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!editingTask && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_template"
                    checked={formData.is_template}
                    onChange={(e) => setFormData({ ...formData, is_template: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="is_template" className="text-sm text-gray-700">
                    保存为快捷任务
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingTask ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无任务，请添加</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => {
              const child = children.find((c) => c.id === task.child_id)
              const taskRecords = records.filter((r) => r.task_id === task.id)
              const inProgressRecord = taskRecords.find((r) => r.status === 'in_progress')
              const completedRecord = taskRecords.find((r) => r.status === 'completed' || r.status === 'approved')
              const isRunning = !!inProgressRecord
              const isCompleted = !!completedRecord

              return (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{task.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded font-medium">
                          {task.category}
                        </span>
                        {task.scheduled_date && task.scheduled_time && (
                          <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded font-medium">
                            {new Date(task.scheduled_date + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} {task.scheduled_time.slice(0, 5)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        计划时间：{task.planned_minutes}分钟
                        {child && ` · ${child.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRunning ? (
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-sm">
                          <Loader className="w-4 h-4 animate-spin" />
                          进行中
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">
                          已完成
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/tasks/${task.id}/timer`)}
                          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700"
                        >
                          <Play className="w-4 h-4" />
                          开始
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
