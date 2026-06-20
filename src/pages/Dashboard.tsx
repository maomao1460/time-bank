import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { formatMinutes } from '../lib/utils'
import { Clock, ListTodo, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuthStore()
  const { children, fetchChildren, fetchTasks } = useTaskStore()
  const { records, banks, fetchRecords, fetchBanks } = useBankStore()
  const [loading, setLoading] = useState(true)

  const [selectedChildIdx, setSelectedChildIdx] = useState(0)

  const selectedChild = children[selectedChildIdx]?.id || ''

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchChildren(user.id),
        fetchTasks(user.id),
        fetchRecords(user.id),
        fetchBanks(user.id),
      ]).then(() => setLoading(false))
    }
  }, [user, fetchChildren, fetchTasks, fetchRecords, fetchBanks])

  const currentBank = banks.find((b) => b.child_id === selectedChild)
  const todayRecords = records
    .filter((r) => {
      const today = new Date().toDateString()
      return r.child_id === selectedChild && new Date(r.created_at).toDateString() === today
    })
    .reduce<typeof records>((acc, record) => {
      const existing = acc.find((r) => r.task_id === record.task_id)
      if (!existing) {
        acc.push(record)
      } else if (new Date(record.created_at) > new Date(existing.created_at)) {
        acc.splice(acc.indexOf(existing), 1, record)
      }
      return acc
    }, [])
  const pendingRecords = records.filter(
    (r) => r.child_id === selectedChild && r.status === 'completed'
  )

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
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        {children.length > 0 && (
          <select
            value={selectedChildIdx}
            onChange={(e) => setSelectedChildIdx(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {children.map((child, index) => (
              <option key={child.id} value={index}>
                {child.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">欢迎使用时间银行</h3>
          <p className="text-gray-500 mb-4">请先添加孩子信息</p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            去设置 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">时间余额</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatMinutes(currentBank?.balance_minutes || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日任务</p>
                  <p className="text-2xl font-bold text-gray-900">{todayRecords.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ListTodo className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待审核</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRecords.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">累计存入</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMinutes(currentBank?.total_saved_minutes || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">今日任务</h2>
              <Link
                to="/tasks"
                className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {todayRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">今天还没有任务记录</div>
            ) : (
              <div className="space-y-3">
                {todayRecords.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          record.status === 'approved'
                            ? 'bg-green-500'
                            : record.status === 'completed'
                            ? 'bg-orange-500'
                            : record.status === 'in_progress'
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.task?.name || '未知任务'}
                        </p>
                        <p className="text-sm text-gray-500">
                          计划 {formatMinutes(record.planned_minutes)}
                          {record.actual_minutes && ` · 实际 ${formatMinutes(record.actual_minutes)}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        record.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : record.status === 'completed'
                          ? 'bg-orange-100 text-orange-700'
                          : record.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {record.status === 'approved'
                        ? '已通过'
                        : record.status === 'completed'
                        ? '待审核'
                        : record.status === 'in_progress'
                        ? '进行中'
                        : '待开始'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
