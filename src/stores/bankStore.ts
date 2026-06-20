import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface TimeRecord {
  id: string
  task_id: string
  child_id: string
  parent_id: string
  planned_minutes: number
  actual_minutes: number | null
  saved_minutes: number | null
  status: string
  started_at: string | null
  completed_at: string | null
  approved_at: string | null
  created_at: string
  task?: { name: string; category: string | null }
  child?: { name: string }
}

interface TimeBank {
  id: string
  child_id: string
  total_saved_minutes: number
  total_used_minutes: number
  balance_minutes: number | null
  updated_at: string
}

interface TimeTransaction {
  id: string
  child_id: string
  type: string
  minutes: number
  source: string | null
  record_id: string | null
  created_at: string
}

interface BankState {
  records: TimeRecord[]
  banks: TimeBank[]
  transactions: TimeTransaction[]
  loading: boolean

  fetchRecords: (parentId: string, childId?: string) => Promise<void>
  startRecord: (record: Omit<TimeRecord, 'id' | 'created_at' | 'saved_minutes'>) => Promise<TimeRecord | null>
  completeRecord: (id: string, actualMinutes: number) => Promise<void>
  approveRecord: (id: string) => Promise<void>
  rejectRecord: (id: string) => Promise<void>

  fetchBanks: (parentId: string) => Promise<void>
  withdrawTime: (childId: string, minutes: number, source: string) => Promise<void>

  fetchTransactions: (childId: string) => Promise<void>
}

export const useBankStore = create<BankState>((set) => ({
  records: [],
  banks: [],
  transactions: [],
  loading: false,

  fetchRecords: async (parentId, childId) => {
    set({ loading: true })
    let query = supabase
      .from('time_records')
      .select('*, task:tasks(name, category), child:children(name)')
      .eq('parent_id', parentId)
      .neq('status', 'cancelled')

    if (childId) {
      query = query.eq('child_id', childId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (!error && data) {
      set({ records: data, loading: false })
    } else {
      set({ loading: false })
    }
  },

  startRecord: async (record) => {
    const { data, error } = await supabase
      .from('time_records')
      .insert({
        ...record,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({ records: [data, ...state.records] }))
      return data
    }
    return null
  },

  completeRecord: async (id, actualMinutes) => {
    const { error } = await supabase
      .from('time_records')
      .update({
        actual_minutes: actualMinutes,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      set((state) => ({
        records: state.records.map((r) =>
          r.id === id
            ? {
                ...r,
                actual_minutes: actualMinutes,
                status: 'completed',
                completed_at: new Date().toISOString(),
              }
            : r
        ),
      }))
    }
  },

  approveRecord: async (id) => {
    const record = useBankStore.getState().records.find((r) => r.id === id)
    if (!record || !record.actual_minutes) return

    const savedMinutes = record.planned_minutes - record.actual_minutes

    const { error: recordError } = await supabase
      .from('time_records')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (recordError) return

    if (savedMinutes > 0) {
      const { data: banks } = await supabase
        .from('time_bank')
        .select('id, total_saved_minutes')
        .eq('child_id', record.child_id)

      let bank = banks && banks.length > 0 ? banks[0] : null

      if (!bank) {
        const { data: newBank } = await supabase
          .from('time_bank')
          .upsert({ child_id: record.child_id, total_saved_minutes: 0, total_used_minutes: 0 }, { onConflict: 'child_id' })
          .select('id, total_saved_minutes')
          .single()
        bank = newBank
      }

      if (bank) {
        const newTotal = bank.total_saved_minutes + savedMinutes
        await supabase
          .from('time_bank')
          .update({ total_saved_minutes: newTotal })
          .eq('id', bank.id)

        set((state) => ({
          banks: state.banks.map((b) =>
            b.child_id === record.child_id
              ? { ...b, total_saved_minutes: newTotal }
              : b
          ),
        }))
      }

      await supabase.from('time_transactions').insert({
        child_id: record.child_id,
        type: 'deposit',
        minutes: savedMinutes,
        source: record.task?.name || '任务完成',
        record_id: id,
      })
    }

    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', approved_at: new Date().toISOString() }
          : r
      ),
    }))
  },

  rejectRecord: async (id) => {
    const { error } = await supabase
      .from('time_records')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (!error) {
      set((state) => ({
        records: state.records.map((r) =>
          r.id === id ? { ...r, status: 'rejected' } : r
        ),
      }))
    }
  },

  fetchBanks: async (parentId) => {
    set({ loading: true })
    const { data: children, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', parentId)

    if (childError || !children) {
      set({ loading: false })
      return
    }

    for (const child of children) {
      const { data: existing } = await supabase
        .from('time_bank')
        .select('id')
        .eq('child_id', child.id)

      if (!existing || existing.length === 0) {
        await supabase
          .from('time_bank')
          .upsert({ child_id: child.id, total_saved_minutes: 0, total_used_minutes: 0 }, { onConflict: 'child_id' })
      }
    }

    const childIds = children.map((c) => c.id)
    const { data, error } = await supabase
      .from('time_bank')
      .select('*')
      .in('child_id', childIds)

    if (!error && data) {
      set({ banks: data, loading: false })
    } else {
      set({ loading: false })
    }
  },

  withdrawTime: async (childId, minutes, source) => {
    const bank = useBankStore.getState().banks.find((b) => b.child_id === childId)
    if (!bank || (bank.balance_minutes || 0) < minutes) return

    const { error: bankError } = await supabase
      .from('time_bank')
      .update({
        total_used_minutes: bank.total_used_minutes + minutes,
      })
      .eq('child_id', childId)

    if (bankError) return

    await supabase.from('time_transactions').insert({
      child_id: childId,
      type: 'withdraw',
      minutes,
      source,
    })

    set((state) => ({
      banks: state.banks.map((b) =>
        b.child_id === childId
          ? { ...b, total_used_minutes: b.total_used_minutes + minutes }
          : b
      ),
    }))
  },

  fetchTransactions: async (childId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('time_transactions')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ transactions: data, loading: false })
    } else {
      set({ loading: false })
    }
  },
}))
