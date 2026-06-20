import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useBankStore } from '../stores/bankStore'
import { useTimer } from '../hooks/useTimer'
import { requestNotificationPermission } from '../lib/notifications'
import { formatMinutes } from '../lib/utils'
import { Play, Pause, Square, ArrowLeft } from 'lucide-react'

export function Timer() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tasks, children, fetchTasks, fetchChildren } = useTaskStore()
  const { startRecord, completeRecord } = useBankStore()
  const {
    isRunning,
    isPaused,
    recordId,
    startedAt,
    formattedTime,
    progress,
    savedMinutes,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    restoreTimer,
  } = useTimer()

  const task = tasks.find((t) => t.id === taskId)
  const child = task ? children.find((c) => c.id === task.child_id) : null

  useEffect(() => {
    if (user) {
      Promise.all([fetchTasks(user.id), fetchChildren(user.id)])
    }
  }, [user, fetchTasks, fetchChildren])

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (user) {
      restoreTimer()
    }
  }, [user, restoreTimer])

  const handleStart = async () => {
    if (!task || !user) return

    const record = await startRecord({
      task_id: task.id,
      child_id: task.child_id,
      parent_id: user.id,
      planned_minutes: task.planned_minutes,
      actual_minutes: null,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      completed_at: null,
      approved_at: null,
    })

    if (record) {
      startTimer(task.planned_minutes, record.id, task.id, task.child_id, task.name)
    }
  }

  const handlePause = () => {
    if (isPaused) {
      resumeTimer()
    } else {
      pauseTimer()
    }
  }

  const handleStop = async () => {
    if (!recordId || !startedAt) return

    const actualMinutes = Math.ceil((Date.now() - new Date(startedAt).getTime()) / 60000)
    await completeRecord(recordId, actualMinutes)
    stopTimer()
    navigate('/review')
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">任务不存在</p>
        <button
          onClick={() => navigate('/tasks')}
          className="text-indigo-600 hover:text-indigo-700"
        >
          返回任务列表
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{task.name}</h1>
          {child && (
            <p className="text-gray-500 mt-1">{child.name}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            计划时间：{formatMinutes(task.planned_minutes)}
          </p>
        </div>

        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#6366f1"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">{formattedTime}</span>
            {isRunning && savedMinutes > 0 && (
              <span className="text-sm text-green-600 mt-1">
                已节约 {savedMinutes} 分钟
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              <Play className="w-5 h-5" />
              开始
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    继续
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    暂停
                  </>
                )}
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                <Square className="w-5 h-5" />
                完成
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-3">使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>1. 点击"开始"启动倒计时</li>
          <li>2. 孩子完成任务后，点击"完成"停止计时</li>
          <li>3. 提前完成的时间将自动存入时间银行</li>
          <li>4. 在"审核中心"可以查看和审批记录</li>
        </ul>
      </div>
    </div>
  )
}
