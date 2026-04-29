import { useEffect, useRef } from 'react'

/**
 * Vérifie chaque minute si une tâche a un reminder dépassé non-notifié.
 * TODO: remplacer par backend cron + push pour fiabilité.
 */
export function useReminders(todos) {
  const fired = useRef(new Set())

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    function check() {
      if (Notification?.permission !== 'granted') return
      const now = Date.now()
      todos.forEach(t => {
        if (!t.reminder || t.status !== 'todo') return
        const ts = new Date(t.reminder).getTime()
        if (Number.isNaN(ts)) return
        if (ts <= now && !fired.current.has(t.id)) {
          try {
            new Notification('CTRL_HUB // REMINDER', {
              body: t.text || '(tâche sans titre)',
              tag: t.id
            })
          } catch (_) {}
          fired.current.add(t.id)
        }
      })
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [todos])
}
