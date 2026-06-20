import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { requestNotificationPermission } from '../lib/notifications'
import { Plus, Pencil, Trash2, X, Bell } from 'lucide-react'

export function Settings() {
  const { user } = useAuthStore()
  const { children, fetchChildren, addChild, updateChild, deleteChild } = useTaskStore()
  const [showForm, setShowForm] = useState(false)
  const [editingChild, setEditingChild] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted'
    }
    return false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchChildren(user.id).then(() => setLoading(false))
    }
  }, [user, fetchChildren])

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !childName.trim()) return

    if (editingChild) {
      await updateChild(editingChild, childName.trim())
    } else {
      await addChild(user.id, childName.trim())
    }

    setShowForm(false)
    setEditingChild(null)
    setChildName('')
  }

  const handleEdit = (child: typeof children[0]) => {
    setEditingChild(child.id)
    setChildName(child.name)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个孩子吗？相关任务和记录也会被删除。')) {
      await deleteChild(id)
    }
  }

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      setNotificationsEnabled(granted)
    } else {
      setNotificationsEnabled(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">设置</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">孩子管理</h2>
          <button
            onClick={() => {
              setEditingChild(null)
              setChildName('')
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            添加孩子
          </button>
        </div>

        {children.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂未添加孩子，请点击上方按钮添加
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {children.map((child) => (
              <div key={child.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{child.name}</h3>
                  <p className="text-sm text-gray-500">
                    添加于 {new Date(child.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(child)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(child.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingChild ? '编辑孩子' : '添加孩子'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  孩子姓名
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="请输入孩子姓名"
                />
              </div>

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
                  {editingChild ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">通知设置</h2>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">浏览器通知</p>
                <p className="text-sm text-gray-500">倒计时结束时发送通知提醒</p>
              </div>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">关于</h2>
        </div>
        <div className="p-4 text-sm text-gray-600">
          <p>时间银行 v1.0.0</p>
          <p className="mt-1">帮助孩子管理时间，培养良好习惯</p>
        </div>
      </div>
    </div>
  )
}
