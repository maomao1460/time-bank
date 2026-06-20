import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { formatMinutes } from '../lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function Statistics() {
  const { user } = useAuthStore()
  const { children, fetchChildren } = useTaskStore()
  const { records, banks, fetchRecords, fetchBanks } = useBankStore()
  const [loading, setLoading] = useState(true)

  const [selectedChildIdx, setSelectedChildIdx] = useState(0)

  const selectedChild = children[selectedChildIdx]?.id || ''

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchChildren(user.id),
        fetchRecords(user.id),
        fetchBanks(user.id),
      ]).then(() => setLoading(false))
    }
  }, [user, fetchChildren, fetchRecords, fetchBanks])

  const childRecords = records.filter((r) => r.child_id === selectedChild)
  const approvedRecords = childRecords.filter((r) => r.status === 'approved')
  const bank = banks.find((b) => b.child_id === selectedChild)

  const taskStats = approvedRecords.reduce((acc, record) => {
    const taskName = record.task?.name || '未知任务'
    if (!acc[taskName]) {
      acc[taskName] = { count: 0, totalPlanned: 0, totalActual: 0, totalSaved: 0 }
    }
    acc[taskName].count++
    acc[taskName].totalPlanned += record.planned_minutes
    acc[taskName].totalActual += record.actual_minutes || 0
    acc[taskName].totalSaved += record.saved_minutes || 0
    return acc
  }, {} as Record<string, { count: number; totalPlanned: number; totalActual: number; totalSaved: number }>)

  const taskBarData = Object.entries(taskStats).map(([name, stats]) => ({
    name,
    计划时间: stats.totalPlanned,
    实际时间: stats.totalActual,
    节约时间: stats.totalSaved,
  }))

  const categoryStats = approvedRecords.reduce((acc, record) => {
    const category = record.task?.category || '其他'
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += record.saved_minutes || 0
    return acc
  }, {} as Record<string, number>)

  const categoryPieData = Object.entries(categoryStats).map(([name, value]) => ({
    name,
    value,
  }))

  const dailyStats = approvedRecords.reduce((acc, record) => {
    const date = new Date(record.created_at).toLocaleDateString('zh-CN')
    if (!acc[date]) {
      acc[date] = { saved: 0, used: 0 }
    }
    acc[date].saved += record.saved_minutes || 0
    return acc
  }, {} as Record<string, { saved: number; used: number }>)

  const dailyLineData = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      节约时间: stats.saved,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)

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
        <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">完成任务次数</p>
          <p className="text-3xl font-bold text-indigo-600">{approvedRecords.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">累计节约时间</p>
          <p className="text-3xl font-bold text-green-600">
            {formatMinutes(bank?.total_saved_minutes || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">当前余额</p>
          <p className="text-3xl font-bold text-purple-600">
            {formatMinutes(bank?.balance_minutes || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">任务耗时对比</h3>
          {taskBarData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="计划时间" fill="#6366f1" />
                <Bar dataKey="实际时间" fill="#10b981" />
                <Bar dataKey="节约时间" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">分类节约时间</h3>
          {categoryPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">每日节约趋势</h3>
        {dailyLineData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="节约时间"
                stroke="#6366f1"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">任务统计详情</h3>
        </div>
        {Object.keys(taskStats).length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">任务</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">完成次数</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">计划总时长</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">实际总时长</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">节约总时长</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(taskStats).map(([name, stats]) => (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stats.count}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {formatMinutes(stats.totalPlanned)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {formatMinutes(stats.totalActual)}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">
                      {formatMinutes(stats.totalSaved)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
