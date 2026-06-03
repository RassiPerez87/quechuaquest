'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@/hooks/useGameSystem'

interface ToastItem {
  id: string
  notification: Notification
  visible: boolean
}

interface SingleToastProps {
  item: ToastItem
  onDismiss: (id: string) => void
}

const toastStyles: Record<Notification['type'], { bg: string; border: string }> = {
  streak_danger:    { bg: 'bg-orange-50', border: 'border-orange-300' },
  streak_lost:      { bg: 'bg-red-50',    border: 'border-red-300'    },
  streak_milestone: { bg: 'bg-amber-50',  border: 'border-amber-300'  },
  badge_earned:     { bg: 'bg-purple-50', border: 'border-purple-300' },
  hearts_low:       { bg: 'bg-red-50',    border: 'border-red-300'    },
  hearts_refilled:  { bg: 'bg-green-50',  border: 'border-green-300'  },
  level_up:         { bg: 'bg-blue-50',   border: 'border-blue-300'   },
  welcome_back:     { bg: 'bg-teal-50',   border: 'border-teal-300'   },
}

function SingleToast({ item, onDismiss }: SingleToastProps) {
  const style = toastStyles[item.notification.type]

  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 4500)
    return () => clearTimeout(t)
  }, [item.id, onDismiss])

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border-2 shadow-lg
        max-w-xs w-full cursor-pointer select-none
        ${style.bg} ${style.border}
        transition-all duration-300
        ${item.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      onClick={() => onDismiss(item.id)}
    >
      <span className="text-2xl flex-shrink-0">{item.notification.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-stone-800 leading-tight">
          {item.notification.title}
        </p>
        <p className="text-xs text-stone-600 mt-0.5 leading-snug">
          {item.notification.message}
        </p>
      </div>
    </div>
  )
}

interface GameToastContainerProps {
  notifications: Notification[]
}

export function GameToastContainer({ notifications }: GameToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [shownIds, setShownIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    notifications.forEach(notif => {
      if (!shownIds.has(notif.id)) {
        setShownIds(prev => new Set(prev).add(notif.id))
        const item: ToastItem = { id: notif.id, notification: notif, visible: false }
        setToasts(prev => [...prev, item])
        setTimeout(() => {
          setToasts(prev => prev.map(t => t.id === item.id ? { ...t, visible: true } : t))
        }, 50)
      }
    })
  }, [notifications, shownIds])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  return (
    <div className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(item => (
        <div key={item.id} className="pointer-events-auto">
          <SingleToast item={item} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}