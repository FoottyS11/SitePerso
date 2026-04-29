// ============================================================
// Système de deadlines auto par priorité
// P1 = 14j, P2 = 30j, P3 = 60j, P4 = 90j depuis createdAt
// ============================================================

export const PRIORITIES = ['P1', 'P2', 'P3', 'P4']

export const PRIORITY_META = {
  P1: { label: 'CRITICAL', color: '#e8003d', autoDays: 14 },
  P2: { label: 'HIGH',     color: '#ff9800', autoDays: 30 },
  P3: { label: 'MEDIUM',   color: '#2196f3', autoDays: 60 },
  P4: { label: 'LOW',      color: '#444450', autoDays: 90 }
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Retourne la deadline effective d'une tâche.
 * - dueDate manuelle prime
 * - sinon createdAt + autoDays(priority)
 * @returns {{ date: Date, isAuto: boolean }}
 */
export function effectiveDeadline(task) {
  if (task.dueDate) {
    return { date: new Date(task.dueDate), isAuto: false }
  }
  const created = new Date(task.createdAt || Date.now())
  const days = PRIORITY_META[task.priority]?.autoDays ?? 30
  return {
    date: new Date(created.getTime() + days * DAY_MS),
    isAuto: true
  }
}

/**
 * Statut visuel d'une deadline.
 * @returns 'late' | 'near' | 'ok'
 */
export function deadlineStatus(date, now = new Date()) {
  const diff = date.getTime() - now.getTime()
  if (diff < 0) return 'late'
  if (diff < 48 * 60 * 60 * 1000) return 'near'
  return 'ok'
}

/**
 * Format relatif court : "dans 12j", "dans 4h", "il y a 2j".
 */
export function relativeFromNow(date, now = new Date()) {
  const diff = date.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const days = Math.floor(abs / DAY_MS)
  const hours = Math.floor((abs % DAY_MS) / (60 * 60 * 1000))

  if (diff < 0) {
    if (days >= 1) return `il y a ${days}j`
    return `il y a ${hours}h`
  }
  if (days >= 1) return `dans ${days}j`
  return `dans ${hours}h`
}

/**
 * Format date FR sans heure : "12 mai 2025".
 */
export function formatDateFR(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}
