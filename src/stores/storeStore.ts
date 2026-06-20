import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface StoreItemLimit {
  id: string
  item_id: string
  period: 'day' | 'week' | 'month'
  max_count: number
}

interface StoreItem {
  id: string
  parent_id: string
  name: string
  description: string | null
  price_minutes: number
  is_active: boolean
  created_at: string
  limits?: StoreItemLimit[]
}

interface StorePurchase {
  id: string
  item_id: string
  child_id: string
  price_minutes: number
  created_at: string
}

interface StoreState {
  items: StoreItem[]
  purchases: StorePurchase[]
  loading: boolean

  fetchItems: (parentId: string) => Promise<void>
  addItem: (item: Omit<StoreItem, 'id' | 'created_at' | 'limits'>, limits: Omit<StoreItemLimit, 'id' | 'item_id'>[]) => Promise<StoreItem | null>
  updateItem: (id: string, updates: Partial<StoreItem>, limits: Omit<StoreItemLimit, 'id' | 'item_id'>[]) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  fetchPurchases: (childId: string) => Promise<void>
  purchaseItem: (itemId: string, childId: string, priceMinutes: number) => Promise<boolean>
}

export const useStoreStore = create<StoreState>((set, get) => ({
  items: [],
  purchases: [],
  loading: false,

  fetchItems: async (parentId) => {
    set({ loading: true })
    const { data: items, error: itemsError } = await supabase
      .from('store_items')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (itemsError || !items) {
      set({ loading: false })
      return
    }

    const itemIds = items.map((i) => i.id)
    const { data: limits } = await supabase
      .from('store_item_limits')
      .select('*')
      .in('item_id', itemIds)

    const itemsWithLimits = items.map((item) => ({
      ...item,
      limits: limits?.filter((l) => l.item_id === item.id) || [],
    }))

    set({ items: itemsWithLimits, loading: false })
  },

  addItem: async (item, limits) => {
    const { data, error } = await supabase
      .from('store_items')
      .insert(item)
      .select()
      .single()

    if (error || !data) return null

    if (limits.length > 0) {
      const limitsWithItemId = limits.map((l) => ({ ...l, item_id: data.id }))
      await supabase.from('store_item_limits').insert(limitsWithItemId)
    }

    const { data: savedLimits } = await supabase
      .from('store_item_limits')
      .select('*')
      .eq('item_id', data.id)

    const newItem = { ...data, limits: savedLimits || [] }
    set((state) => ({ items: [newItem, ...state.items] }))
    return newItem
  },

  updateItem: async (id, updates, limits) => {
    const { error } = await supabase
      .from('store_items')
      .update(updates)
      .eq('id', id)

    if (error) return

    await supabase.from('store_item_limits').delete().eq('item_id', id)
    if (limits.length > 0) {
      const limitsWithItemId = limits.map((l) => ({ ...l, item_id: id }))
      await supabase.from('store_item_limits').insert(limitsWithItemId)
    }

    const { data: savedLimits } = await supabase
      .from('store_item_limits')
      .select('*')
      .eq('item_id', id)

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates, limits: savedLimits || [] } : item
      ),
    }))
  },

  deleteItem: async (id) => {
    const { error } = await supabase
      .from('store_items')
      .update({ is_active: false })
      .eq('id', id)

    if (!error) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }))
    }
  },

  fetchPurchases: async (childId) => {
    const { data, error } = await supabase
      .from('store_purchases')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ purchases: data })
    }
  },

  purchaseItem: async (itemId, childId, priceMinutes) => {
    const { data: bank, error: bankError } = await supabase
      .from('time_bank')
      .select('id, balance_minutes, total_used_minutes')
      .eq('child_id', childId)
      .single()

    if (bankError || !bank || (bank.balance_minutes || 0) < priceMinutes) {
      return false
    }

    const { error: purchaseError } = await supabase
      .from('store_purchases')
      .insert({
        item_id: itemId,
        child_id: childId,
        price_minutes: priceMinutes,
      })

    if (purchaseError) return false

    const newTotalUsed = bank.total_used_minutes + priceMinutes
    await supabase
      .from('time_bank')
      .update({ total_used_minutes: newTotalUsed })
      .eq('id', bank.id)

    const item = get().items.find((i) => i.id === itemId)
    await supabase.from('time_transactions').insert({
      child_id: childId,
      type: 'withdraw',
      minutes: priceMinutes,
      source: `超市购买: ${item?.name || '商品'}`,
    })

    await get().fetchPurchases(childId)
    return true
  },
}))
