import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useResponsive } from '../../hooks/useResponsive'
import { useAuthStore } from '../../stores/authStore'
import { useTimer } from '../../hooks/useTimer'
import {
  LayoutDashboard,
  ListTodo,
  Clock,
  CheckCircle,
  Landmark,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Play,
  Pause,
} from 'lucide-react'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/review', label: '审核中心', icon: CheckCircle },
  { path: '/bank', label: '时间银行', icon: Landmark },
  { path: '/store', label: '时间超市', icon: ShoppingBag },
  { path: '/statistics', label: '统计分析', icon: BarChart3 },
  { path: '/settings', label: '设置', icon: Settings },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const breakpoint = useResponsive()
  const { signOut } = useAuthStore()
  const { isRunning, isPaused, taskName, taskId, formattedTime, pauseTimer, resumeTimer } = useTimer()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isMobile = breakpoint === 'mobile'
  const isTablet = breakpoint === 'tablet'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : ''}
          ${isTablet ? 'w-16' : 'w-64'}
          bg-white border-r border-gray-200 flex flex-col
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          transition-transform duration-200
        `}
      >
        <div className={`p-4 border-b border-gray-200 ${isTablet ? 'px-2' : ''}`}>
          {isTablet ? (
            <Clock className="w-8 h-8 text-indigo-600 mx-auto" />
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">时间银行</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  ${isTablet ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {!isTablet && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={`p-2 border-t border-gray-200 ${isTablet ? 'px-2' : ''}`}>
          <button
            onClick={signOut}
            className={`
              flex items-center gap-3 w-full px-3 py-2 rounded-lg
              text-gray-600 hover:bg-gray-100
              ${isTablet ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5" />
            {!isTablet && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {isMobile && (
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              <span className="font-bold text-gray-900">时间银行</span>
            </div>
          </header>
        )}

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex justify-around">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center py-2 px-1
                    ${isActive ? 'text-indigo-600' : 'text-gray-500'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {isRunning && taskId && location.pathname !== `/tasks/${taskId}/timer` && (
        <div className={`fixed z-40 bg-indigo-600 text-white shadow-lg flex items-center gap-3 px-4 py-3 ${
          isMobile ? 'bottom-16 left-0 right-0' : 'bottom-4 right-4 rounded-xl'
        }`}>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{taskName || '倒计时'}</p>
            <p className="text-sm text-indigo-200">{formattedTime}</p>
          </div>
          <button
            onClick={() => isPaused ? resumeTimer() : pauseTimer()}
            className="p-2 hover:bg-indigo-500 rounded-lg"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate(`/tasks/${taskId}/timer`)}
            className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50"
          >
            返回
          </button>
        </div>
      )}
    </div>
  )
}
