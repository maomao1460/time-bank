export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('浏览器不支持通知')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  }
}

export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function playAlarmSound(): void {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+JkI+Gd2BfdICNkI+HeWJed4GQkY6He2NfeIKRko2IfGRheYSTk42Jf2VieYaWlIyKgGdieoeZlouLg2dke4iakoqKgmhmfImbk4iJgWlnf4qckoeIgGlpgoqckYaHf2pqhIubkISHfWtrhYyckIOGe2xthoyckIKFem1uh4yckIGEe25viIybkICDe3BxiYybj36CfHFzioubjn2BfXN0i4qbjHx/fnV1i4qbjHx/fnV1ioqbjHt+fnZ2iYmairp+fnd3iIiZibl+fnd3iIeYiLh+fnd3iIaXh7d+fnd3iIaWhrZ+fnd3iIaVhbR+fnd3iIaUhLN+fnd3iIaTg7J+fnd3iIaSg7F+fnd3iIaRgq9+fnd3iIaQgq5+fnd3iIaOga1+fnd3iIaNgKt+fnd3iIaLgKp+fnd3iIaKf6l+fnd3iIaJf6d+fnd3iIaIf6Z+fnd3iIaHf6V+fnd3iIaGf6R+fnd3iIaFf6N+fnd3iIaEf6J+fnd3iIaDf6F+fnd3iIaCf59+fnd3iIaBf55+fnd3iIaAf51+fnd3iIY/f5t+fnd3iIY+f5p+fnd3iIY9f5l+fnd3iIY8f5h+fnd3iIY7f5d+fnd3iIY6f5Z+fnd3iIY5f5V+fnd3iIY4f5R+fnd3iIY3f5N+fnd3iIY2f5J+fnd3iIY1f5F+fnd3iIY0f5A=')
  audio.play().catch(() => {})
}
