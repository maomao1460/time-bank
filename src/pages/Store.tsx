import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { useStoreStore } from '../stores/storeStore'
import { formatMinutes } from '../lib/utils'
import { ShoppingBag, Plus, Pencil, Trash2, X, Check, Clock } from 'lucide-react'

interface LimitForm {
  day: { enabled: boolean; max_count: number }
  week: { enabled: boolean; max_count: number }
  month: { enabled: boolean; max_count: number }
}

interface ItemFormData {
  name: string
  description: string
  price_minutes: number
  limits: LimitForm
}

const defaultLimits: LimitForm = {
  day: { enabled: false, max_count: 1 },
  week: { enabled: false, max_count: 3 },
  month: { enabled: false, max_count: 10 },
}

export function Store() {
  const { user } = useAuthStore()
  const { children, fetchChildren } = useTaskStore()
  const { banks, fetchBanks } = useBankStore()
  const { items, purchases, fetchItems, addItem, updateItem, deleteItem, fetchPurchases, purchaseItem } = useStoreStore()
  const [loading, setLoading] = useState(true)
  const [selectedChildIdx, setSelectedChildIdx] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    price_minutes: 10,
    limits: { ...defaultLimits },
  })
  const [confirmPurchase, setConfirmPurchase] = useState<{ id: string; name: string; price: number } | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  const selectedChild = children[selectedChildIdx]?.id || ''
  const currentBank = banks.find((b) => b.child_id === selectedChild)

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchChildren(user.id),
        fetchBanks(user.id),
        fetchItems(user.id),
      ]).then(() => setLoading(false))
    }
  }, [user, fetchChildren, fetchBanks, fetchItems])

  useEffect(() => {
    if (selectedChild) {
      fetchPurchases(selectedChild)
    }
  }, [selectedChild, fetchPurchases])

  const getPurchaseCount = (itemId: string, period: 'day' | 'week' | 'month'): number => {
    const periodStart = getPeriodStart(period)
    return purchases.filter(
      (p) => p.item_id === itemId && new Date(p.created_at) >= new Date(periodStart)
    ).length
  }

  const canPurchase = (itemId: string, priceMinutes: number, limits: { period: string; max_count: number }[]): boolean => {
    if ((currentBank?.balance_minutes || 0) < priceMinutes) return false
    for (const limit of limits) {
      const count = getPurchaseCount(itemId, limit.period as 'day' | 'week' | 'month')
      if (count >= limit.max_count) return false
    }
    return true
  }

  const handlePurchase = async () => {
    if (!confirmPurchase || !selectedChild || purchasing) return
    setPurchasing(true)
    const success = await purchaseItem(confirmPurchase.id, selectedChild, confirmPurchase.price)
    if (success) {
      await fetchBanks(user!.id)
    }
    setPurchasing(false)
    setConfirmPurchase(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const limits = Object.entries(formData.limits)
      .filter(([, v]) => v.enabled)
      .map(([period, v]) => ({ period: period as 'day' | 'week' | 'month', max_count: v.max_count }))

    if (editingItem) {
      await updateItem(editingItem, {
        name: formData.name,
        description: formData.description || null,
        price_minutes: formData.price_minutes,
      }, limits)
    } else {
      await addItem(
        {
          parent_id: user.id,
          name: formData.name,
          description: formData.description || null,
          price_minutes: formData.price_minutes,
          is_active: true,
        },
        limits
      )
    }

    await fetchItems(user.id)
    setShowForm(false)
    setEditingItem(null)
    setFormData({ name: '', description: '', price_minutes: 10, limits: { ...defaultLimits } })
  }

  const handleEdit = (item: typeof items[0]) => {
    setEditingItem(item.id)
    const limits: LimitForm = { ...defaultLimits }
    for (const l of item.limits || []) {
      limits[l.period as keyof LimitForm] = { enabled: true, max_count: l.max_count }
    }
    setFormData({
      name: item.name,
      description: item.description || '',
      price_minutes: item.price_minutes,
      limits,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个商品吗？')) {
      await deleteItem(id)
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
        <h1 className="text-2xl font-bold text-gray-900">时间超市</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => {
              setEditingItem(null)
              setFormData({ name: '', description: '', price_minutes: 10, limits: { ...defaultLimits } })
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            添加商品
          </button>
        </div>
      </div>

      {selectedChild && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8" />
            <span className="text-lg font-medium">
              {children.find((c) => c.id === selectedChild)?.name}的时间余额
            </span>
          </div>
          <div className="text-3xl font-bold">
            {formatMinutes(currentBank?.balance_minutes || 0)}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无商品</h3>
          <p className="text-gray-500">点击上方按钮添加时间超市商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const purchased = item.limits?.map((l) => ({
              ...l,
              count: getPurchaseCount(item.id, l.period as 'day' | 'week' | 'month'),
            })) || []
            const allowed = canPurchase(item.id, item.price_minutes, item.limits || [])

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-600">
                      {formatMinutes(item.price_minutes)}
                    </span>
                    <span className="text-sm text-gray-500">/次</span>
                  </div>

                  <div className="mb-4">
                    {purchased.length > 0 ? (
                      <div className="space-y-1">
                        {purchased.map((p) => (
                          <div key={p.period} className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {p.period === 'day' ? '每天' : p.period === 'week' ? '每周' : '每月'}限制
                            </span>
                            <span className={p.count >= p.max_count ? 'text-red-500 font-medium' : 'text-gray-600'}>
                              {p.count}/{p.max_count}次
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">无购买限制</p>
                    )}
                  </div>

                  <button
                    onClick={() => setConfirmPurchase({ id: item.id, name: item.name, price: item.price_minutes })}
                    disabled={!selectedChild || !allowed}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    购买
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">确认购买</h3>
            <p className="text-gray-600 mb-2">
              确定要购买 <span className="font-medium text-gray-900">{confirmPurchase.name}</span> 吗？
            </p>
            <p className="text-gray-600 mb-6">
              将扣除 <span className="font-bold text-red-600">{formatMinutes(confirmPurchase.price)}</span> 时间余额
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPurchase(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchasing ? '处理中...' : <><Check className="w-4 h-4" /> 确认购买</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? '编辑商品' : '添加商品'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：看电视、买零食"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品描述（可选）</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="商品说明"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">时间价格（分钟）</label>
                <input
                  type="number"
                  value={formData.price_minutes}
                  onChange={(e) => setFormData({ ...formData, price_minutes: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">购买限制</label>
                <div className="space-y-3">
                  {(['day', 'week', 'month'] as const).map((period) => {
                    const label = period === 'day' ? '每天' : period === 'week' ? '每周' : '每月'
                    return (
                      <div key={period} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.limits[period].enabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: {
                                ...formData.limits,
                                [period]: { ...formData.limits[period], enabled: e.target.checked },
                              },
                            })
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700 w-12">{label}</span>
                        <input
                          type="number"
                          value={formData.limits[period].max_count}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: {
                                ...formData.limits,
                                [period]: { ...formData.limits[period], max_count: parseInt(e.target.value) || 1 },
                              },
                            })
                          }
                          min="1"
                          disabled={!formData.limits[period].enabled}
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-500">次</span>
                      </div>
                    )
                  })}
                </div>
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
                  {editingItem ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function getPeriodStart(period: 'day' | 'week' | 'month'): string {
  const now = new Date()
  if (period === 'day') {
    now.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    now.setDate(diff)
    now.setHours(0, 0, 0, 0)
  } else {
    now.setDate(1)
    now.setHours(0, 0, 0, 0)
  }
  return now.toISOString()
}
