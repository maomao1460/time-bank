import { useMemo } from 'react'
import { useTimerStore } from '../stores/timerStore'

export function useTimer() {
  const {
    isRunning,
    isPaused,
    totalSeconds,
    remainingSeconds,
    taskId,
    taskName,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimerStore()

  const formattedTime = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    const seconds = remainingSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [remainingSeconds])

  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100
  }, [totalSeconds, remainingSeconds])

  const savedMinutes = useMemo(() => {
    return Math.max(0, Math.floor((totalSeconds - remainingSeconds) / 60))
  }, [totalSeconds, remainingSeconds])

  return {
    isRunning,
    isPaused,
    totalSeconds,
    remainingSeconds,
    taskId,
    taskName,
    formattedTime,
    progress,
    savedMinutes,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  }
}
