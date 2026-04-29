import type { ProjectStatus } from '@/types'

// Statuses where SLA tracking is meaningful (project is in motion)
const ACTIVE_STATUSES: ProjectStatus[] = ['activo', 'revision', 'ajuste']

interface SLABadgeProps {
  deadlineAt?: string
  status: ProjectStatus
}

/**
 * Computes remaining days to deadlineAt and renders:
 *  - red  "Vencido"    if the deadline has passed
 *  - amber "Por vencer" if 0 or 1 day remains
 *  - null  otherwise (no badge)
 *
 * Only renders for active-phase statuses; no badge on completed/cancelled/quoted projects.
 */
export function SLABadge({ deadlineAt, status }: SLABadgeProps) {
  if (!deadlineAt || !ACTIVE_STATUSES.includes(status)) return null

  const now = Date.now()
  const deadline = new Date(deadlineAt).getTime()
  const daysLeft = Math.floor((deadline - now) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-500/25 bg-rose-500/12 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
        Vencido
      </span>
    )
  }

  if (daysLeft <= 1) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
        Por vencer
      </span>
    )
  }

  return null
}
