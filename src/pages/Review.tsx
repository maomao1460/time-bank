import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { formatMinutes, formatDateTime } from '../lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'

export function Review() {
  const { user } = useAuthStore()
  const { children, fetchChildren } = useTaskStore()
  const { records, banks, fetchRecords, fetchBanks, approveRecord, rejectRecord } = useBankStore()
  const [loading, setLoading] = useState(true)

  const [selectedChildIdx, setSelectedChildIdx] = useState(0)

  const selectedChild = children[selectedChildIdx]?.id || ''

  const currentBank = banks.find((b) => b.child_id === selectedChild)

  useEffect(() => {
    if (user) {
      Promise.all([fetchChildren(user.id), fetchRecords(user.id), fetchBanks(user.id)]).then(() =>
        setLoading(false)
      )
    }
  }, [user, fetchChildren, fetchRecords, fetchBanks])

  const pendingRecords = records.filter(
    (r) =>
      r.child_id === selectedChild &&
      r.status === 'completed'
  )

  const handledRecords = records.filter(
    (r) =>
      r.child_id === selectedChild &&
      (r.status === 'approved' || r.status === 'rejected')
  )

  const handleApprove = async (id: string) => {
    await approveRecord(id)
    await fetchRecords(user!.id)
    await fetchBanks(user!.id)
  }

  const handleReject = async (id: string) => {
    if (confirm('确定要拒绝这个任务吗？')) {
      await rejectRecord(id)
      await fetchRecords(user!.id)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">审核中心</h1>
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

      {currentBank && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90">当前时间余额</span>
            <span className="text-2xl font-bold">{formatMinutes(currentBank.balance_minutes || 0)}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">待审核 ({pendingRecords.length})</h2>
        </div>

        {pendingRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无待审核任务</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingRecords.map((record) => {
              const savedMinutes = record.planned_minutes - (record.actual_minutes || 0)
              return (
                <div key={record.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {record.task?.name || '未知任务'}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1 space-y-1">
                        <p>计划时间：{formatMinutes(record.planned_minutes)}</p>
                        <p>实际用时：{formatMinutes(record.actual_minutes || 0)}</p>
                        <p className="text-green-600">
                          节约时间：{formatMinutes(savedMinutes)}
                        </p>
                        <p>完成时间：{formatDateTime(record.completed_at || '')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(record.id)}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(record.id)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">已处理 ({handledRecords.length})</h2>
        </div>

        {handledRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无已处理记录</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {handledRecords.slice(0, 20).map((record) => (
              <div key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {record.task?.name || '未知任务'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(record.approved_at || record.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {record.status === 'approved' ? '已通过' : '已拒绝'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
