import { create } from 'zustand'
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

  startTimer: (totalMinutes: number, recordId: string, taskId: string, childId: string, taskName: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  tick: () => void
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

  startTimer: (totalMinutes, recordId, taskId, childId, taskName) => {
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
    })
  },

  tick: () => {
    const state = get()
    const newRemaining = state.remainingSeconds - 1

    if (newRemaining <= 0) {
      if (tickInterval) {
        clearInterval(tickInterval)
        tickInterval = null
      }
      set({
        isRunning: false,
        remainingSeconds: 0,
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
