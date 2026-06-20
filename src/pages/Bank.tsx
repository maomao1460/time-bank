import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { formatMinutes, formatDateTime } from '../lib/utils'
import { Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export function Bank() {
  const { user } = useAuthStore()
  const { children, fetchChildren } = useTaskStore()
  const { banks, transactions, fetchBanks, fetchTransactions } = useBankStore()
  const [loading, setLoading] = useState(true)

  const [selectedChildIdx, setSelectedChildIdx] = useState(0)

  const selectedChild = children[selectedChildIdx]?.id || ''

  useEffect(() => {
    if (user) {
      Promise.all([fetchChildren(user.id), fetchBanks(user.id)]).then(() =>
        setLoading(false)
      )
    }
  }, [user, fetchChildren, fetchBanks])

  useEffect(() => {
    if (selectedChild) {
      fetchTransactions(selectedChild)
    }
  }, [selectedChild, fetchTransactions])

  const currentBank = banks.find((b) => b.child_id === selectedChild)
  const child = children.find((c) => c.id === selectedChild)

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
        <h1 className="text-2xl font-bold text-gray-900">时间银行</h1>
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

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-8 h-8" />
          <span className="text-lg font-medium">{child?.name}的时间银行</span>
        </div>
        <div className="text-4xl font-bold mb-2">
          {formatMinutes(currentBank?.balance_minutes || 0)}
        </div>
        <div className="flex gap-6 text-sm opacity-90">
          <span>累计存入：{formatMinutes(currentBank?.total_saved_minutes || 0)}</span>
          <span>累计使用：{formatMinutes(currentBank?.total_used_minutes || 0)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">交易记录</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无交易记录</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {tx.type === 'deposit' ? (
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.source || (tx.type === 'deposit' ? '任务完成' : '时间消费')}</p>
                    <p className="text-sm text-gray-500">{formatDateTime(tx.created_at)}</p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'deposit' ? '+' : '-'}{tx.minutes}分钟
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
