// ============================================================
// Constantes & helpers du Planner (clone Microsoft Planner)
// ============================================================

import { Flag, AlertTriangle, Minus, ChevronDown, Circle, Clock, CheckCircle2 } from 'lucide-react'

// ─── Priorités (ordre Planner : Urgent → Important → Moyenne → Faible) ───
export const PRIORITIES = ['urgent', 'important', 'medium', 'low']

export const PRIORITY_META = {
  urgent:    { label: 'URGENTE',   short: 'URG', color: '#e8003d', Icon: AlertTriangle, order: 0 },
  important: { label: 'IMPORTANTE',short: 'IMP', color: '#ff9800', Icon: Flag,          order: 1 },
  medium:    { label: 'MOYENNE',   short: 'MOY', color: '#2196f3', Icon: Minus,         order: 2 },
  low:       { label: 'FAIBLE',    short: 'FBL', color: '#6b6870', Icon: ChevronDown,   order: 3 },
}

// ─── Progression ───
export const PROGRESSES = ['notstarted', 'inprogress', 'completed']

export const PROGRESS_META = {
  notstarted: { label: 'NON DÉMARRÉE', short: 'À FAIRE', color: '#6b6870', Icon: Circle,      order: 0 },
  inprogress: { label: 'EN COURS',     short: 'EN COURS',color: '#2196f3', Icon: Clock,       order: 1 },
  completed:  { label: 'TERMINÉE',     short: 'TERMINÉ', color: '#00e676', Icon: CheckCircle2, order: 2 },
}

// ─── Regroupements possibles (vue Tableau) ───
export const GROUP_BY = [
  { id: 'bucket',   label: 'COMPARTIMENT' },
  { id: 'progress', label: 'PROGRESSION' },
  { id: 'priority', label: 'PRIORITÉ' },
  { id: 'assignee', label: 'ASSIGNÉ À' },
  { id: 'label',    label: 'ÉTIQUETTE' },
]

export function checklistProgress(checklist = []) {
  if (!checklist.length) return null
  const done = checklist.filter(c => c.done).length
  return { done, total: checklist.length }
}

export function dueStatus(dueDate, progress, now = new Date()) {
  if (!dueDate || progress === 'completed') return 'none'
  const d = new Date(dueDate)
  const diff = d.getTime() - now.getTime()
  if (diff < 0) return 'late'
  if (diff < 48 * 60 * 60 * 1000) return 'near'
  return 'ok'
}

export function formatDue(dueDate) {
  if (!dueDate) return ''
  return new Date(dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

// Couleur déterministe pour un avatar à partir du nom
export function avatarColor(name = '') {
  const palette = ['#e8003d', '#ff9800', '#00e676', '#00bcd4', '#2196f3', '#9c27b0', '#ff4081']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}
