import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface Child {
  id: string
  parent_id: string
  name: string
  avatar_url: string | null
  created_at: string
}

interface Task {
  id: string
  parent_id: string
  child_id: string
  name: string
  category: string | null
  planned_minutes: number
  is_active: boolean
  is_template: boolean
  created_at: string
}

interface TaskState {
  children: Child[]
  tasks: Task[]
  quickTasks: Task[]
  loading: boolean
  
  fetchChildren: (parentId: string) => Promise<void>
  addChild: (parentId: string, name: string) => Promise<Child | null>
  updateChild: (id: string, name: string) => Promise<void>
  deleteChild: (id: string) => Promise<void>
  
  fetchTasks: (parentId: string, childId?: string) => Promise<void>
  fetchQuickTasks: (parentId: string) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<Task | null>
  createTaskFromTemplate: (template: Task, childId: string) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set) => ({
  children: [],
  tasks: [],
  quickTasks: [],
  loading: false,

  fetchChildren: async (parentId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (!error && data) {
      set({ children: data, loading: false })
    } else {
      set({ loading: false })
    }
  },

  addChild: async (parentId, name) => {
    const { data, error } = await supabase
      .from('children')
      .insert({ parent_id: parentId, name })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({ children: [...state.children, data] }))
      
      await supabase
        .from('time_bank')
        .upsert({ child_id: data.id, total_saved_minutes: 0, total_used_minutes: 0 }, { onConflict: 'child_id' })
      
      return data
    }
    return null
  },

  updateChild: async (id, name) => {
    const { error } = await supabase
      .from('children')
      .update({ name })
      .eq('id', id)

    if (!error) {
      set((state) => ({
        children: state.children.map((c) =>
          c.id === id ? { ...c, name } : c
        ),
      }))
    }
  },

  deleteChild: async (id) => {
    const { error } = await supabase
      .from('children')
      .update({ is_active: false })
      .eq('id', id)

    if (!error) {
      const { data: childTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('child_id', id)
        .eq('is_active', true)

      if (childTasks && childTasks.length > 0) {
        const taskIds = childTasks.map((t) => t.id)

        await supabase
          .from('tasks')
          .update({ is_active: false })
          .in('id', taskIds)

        await supabase
          .from('time_records')
          .update({ status: 'cancelled' })
          .in('task_id', taskIds)
          .in('status', ['pending', 'in_progress', 'completed'])
      }

      set((state) => ({
        children: state.children.filter((c) => c.id !== id),
        tasks: state.tasks.filter((t) => t.child_id !== id),
      }))
    }
  },

  fetchTasks: async (parentId, childId) => {
    set({ loading: true })
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .eq('is_template', false)

    if (childId) {
      query = query.eq('child_id', childId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (!error && data) {
      set({ tasks: data, loading: false })
    } else {
      set({ loading: false })
    }
  },

  fetchQuickTasks: async (parentId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .eq('is_template', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ quickTasks: data })
    }
  },

  addTask: async (task) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (!error && data) {
      if (!task.is_template) {
        set((state) => ({ tasks: [data, ...state.tasks] }))
      } else {
        set((state) => ({ quickTasks: [data, ...state.quickTasks] }))
      }
      return data
    }
    return null
  },

  createTaskFromTemplate: async (template, childId) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        parent_id: template.parent_id,
        child_id: childId,
        name: template.name,
        category: template.category,
        planned_minutes: template.planned_minutes,
        is_active: true,
        is_template: false,
      })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({ tasks: [data, ...state.tasks] }))
      return data
    }
    return null
  },

  updateTask: async (id, updates) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (!error) {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }))
    }
  },

  deleteTask: async (id) => {
    const { data: task } = await supabase
      .from('tasks')
      .select('child_id')
      .eq('id', id)
      .single()

    if (task) {
      const { data: records } = await supabase
        .from('time_records')
        .select('id, saved_minutes')
        .eq('task_id', id)
        .eq('status', 'approved')

      if (records && records.length > 0) {
        const totalSaved = records.reduce((sum, r) => sum + (r.saved_minutes || 0), 0)

        if (totalSaved > 0) {
          const { data: bank } = await supabase
            .from('time_bank')
            .select('total_saved_minutes')
            .eq('child_id', task.child_id)
            .single()

          if (bank) {
            await supabase
              .from('time_bank')
              .update({
                total_saved_minutes: Math.max(0, bank.total_saved_minutes - totalSaved),
              })
              .eq('child_id', task.child_id)
          }

          await supabase.from('time_transactions').insert({
            child_id: task.child_id,
            type: 'withdraw',
            minutes: totalSaved,
            source: '任务删除还原',
          })
        }
      }

      await supabase
        .from('time_records')
        .update({ status: 'cancelled' })
        .eq('task_id', id)
        .in('status', ['pending', 'in_progress', 'completed'])
    }

    const { error } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('id', id)

    if (!error) {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }))
    }
  },
}))
