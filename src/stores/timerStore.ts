import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { vibrate, sendNotification } from '../lib/notifications'

interface TimerState {
  isRunning: boolean
  isPaused: boolean
  totalSeconds: number
  remainingSeconds: number
  recordId: string | null
  taskId: string | null
  childId: string | null
  taskName: string | null
  startedAt: string | null

  startTimer: (totalMinutes: number, recordId: string, taskId: string, childId: string, taskName: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  tick: () => void
  restoreTimer: () => Promise<void>
}

let tickInterval: ReturnType<typeof setInterval> | null = null

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  recordId: null,
  taskId: null,
  childId: null,
  taskName: null,
  startedAt: null,

  startTimer: (totalMinutes, recordId, taskId, childId, taskName) => {
    const startedAt = new Date().toISOString()
    if (tickInterval) {
      clearInterval(tickInterval)
    }

    const totalSeconds = totalMinutes * 60
    set({
      isRunning: true,
      isPaused: false,
      totalSeconds,
      remainingSeconds: totalSeconds,
      recordId,
      taskId,
      childId,
      taskName,
      startedAt,
    })

    tickInterval = setInterval(() => {
      const state = get()
      if (state.isRunning && !state.isPaused) {
        state.tick()
      }
    }, 1000)
  },

  pauseTimer: () => {
    set({ isPaused: true })
  },

  resumeTimer: () => {
    set({ isPaused: false })
  },

  stopTimer: () => {
    if (tickInterval) {
      clearInterval(tickInterval)
      tickInterval = null
    }
    set({
      isRunning: false,
      isPaused: false,
      remainingSeconds: 0,
      recordId: null,
      taskId: null,
      childId: null,
      taskName: null,
      startedAt: null,
    })
  },

  restoreTimer: async () => {
    const currentState = get()
    if (currentState.isRunning && currentState.recordId) return

    const { data, error } = await supabase
      .from('time_records')
      .select('id, task_id, child_id, planned_minutes, started_at, task:tasks(name)')
      .eq('status', 'in_progress')
      .limit(1)
      .single() as { data: { id: string; task_id: string; child_id: string; planned_minutes: number; started_at: string; task: { name: string }[] } | null; error: any }

    if (error || !data || !data.started_at) return

    const startedAtMs = new Date(data.started_at).getTime()
    const nowMs = Date.now()
    const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000)
    const totalSeconds = data.planned_minutes * 60
    const remainingSeconds = totalSeconds - elapsedSeconds

    if (remainingSeconds <= 0) {
      await supabase
        .from('time_records')
        .update({
          actual_minutes: data.planned_minutes,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      vibrate([200, 100, 200])
      sendNotification('时间到！', { body: '任务倒计时已结束' })
      return
    }

    if (tickInterval) {
      clearInterval(tickInterval)
    }

    const taskName = data.task[0]?.name || '未知任务'

    set({
      isRunning: true,
      isPaused: false,
      totalSeconds,
      remainingSeconds,
      recordId: data.id,
      taskId: data.task_id,
      childId: data.child_id,
      taskName,
      startedAt: data.started_at,
    })

    tickInterval = setInterval(() => {
      const state = get()
      if (state.isRunning && !state.isPaused) {
        state.tick()
      }
    }, 1000)
  },

  tick: () => {
    const state = get()
    const newRemaining = state.remainingSeconds - 1

    if (newRemaining <= 0) {
      if (tickInterval) {
        clearInterval(tickInterval)
        tickInterval = null
      }

      if (state.recordId) {
        supabase
          .from('time_records')
          .update({
            actual_minutes: Math.ceil(state.totalSeconds / 60),
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', state.recordId)
      }

      set({
        isRunning: false,
        remainingSeconds: 0,
        recordId: null,
        taskId: null,
        childId: null,
        taskName: null,
        startedAt: null,
      })
      vibrate([200, 100, 200])
      sendNotification('时间到！', { body: '任务倒计时已结束' })
      return
    }

    if (newRemaining === 300) {
      vibrate(200)
      sendNotification('还剩5分钟', { body: '倒计时还有5分钟' })
    }

    if (newRemaining === 60) {
      vibrate(200)
      sendNotification('还剩1分钟', { body: '倒计时还有1分钟' })
    }

    set({ remainingSeconds: newRemaining })
  },
}))
