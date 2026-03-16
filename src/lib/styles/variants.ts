/**
 * Design system variant records — composite Tailwind class strings.
 *
 * Usage:
 *   import { btn, input, alert, statusBadge, table, card, nav } from '@/lib/styles'
 *
 * All records are frozen to prevent accidental mutation.
 */

/* ─── Buttons ─── */

export const btn = Object.freeze({
  primary:
    'inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors',
  secondary:
    'inline-flex min-h-[44px] items-center justify-center rounded-md border border-neutral-300 px-5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors',
  danger:
    'inline-flex min-h-[44px] items-center justify-center rounded-md border border-error-300 px-5 text-sm font-medium text-error-700 hover:bg-error-50 disabled:opacity-50 transition-colors',
  success:
    'inline-flex min-h-[44px] items-center justify-center rounded-md bg-success-600 px-5 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50 transition-colors',
  ghost:
    'text-sm text-neutral-600 hover:text-neutral-800 transition-colors',
} as const)

/* ─── Form inputs ─── */

export const input = Object.freeze({
  base: 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50',
  label: 'block text-sm font-medium text-neutral-700',
  error: 'mt-1 text-xs text-error-600',
  required: 'text-error-500',
} as const)

/* ─── Alerts ─── */

export const alert = Object.freeze({
  error:
    'rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200',
  success:
    'rounded-md bg-success-50 p-3 text-sm text-success-700 border border-success-200',
  warning:
    'rounded-md bg-warning-50 p-3 text-sm text-warning-700 border border-warning-200',
  info: 'rounded-md bg-primary-50 p-3 text-sm text-primary-700 border border-primary-200',
} as const)

/* ─── Status badges ─── */

export const statusBadge = Object.freeze({
  SCHEDULED: 'bg-primary-100 text-primary-700',
  CONFIRMED: 'bg-secondary-100 text-secondary-700',
  COMPLETED: 'bg-success-100 text-success-700',
  CANCELLED: 'bg-error-100 text-error-700',
  NO_SHOW: 'bg-neutral-100 text-neutral-500',
  ADMITTED: 'bg-primary-100 text-primary-700',
  DISCHARGED: 'bg-success-100 text-success-700',
  TRANSFERRED: 'bg-caution-100 text-caution-800',
  DRAFT: 'bg-caution-100 text-caution-800',
  FINALIZED: 'bg-success-100 text-success-700',
  PAID: 'bg-success-100 text-success-700',
  PARTIAL: 'bg-caution-100 text-caution-800',
  ISSUED: 'bg-primary-100 text-primary-700',
  VOID: 'bg-neutral-100 text-neutral-500',
  active: 'bg-success-100 text-success-700',
  inactive: 'bg-neutral-100 text-neutral-600',
} as const)

/* ─── Tables ─── */

export const table = Object.freeze({
  /** Rounded border + horizontal scroll for mobile */
  wrapper: 'overflow-x-auto rounded-lg border border-neutral-200 bg-white',
  header: 'bg-neutral-50',
  headerCell:
    'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 whitespace-nowrap',
  body: 'divide-y divide-neutral-200 bg-white',
  row: 'hover:bg-neutral-50',
  cell: 'px-4 py-3 text-sm',
} as const)

/* ─── Filter bar (horizontally scrollable on mobile) ─── */

export const filterBar = Object.freeze({
  /** Negative margin pulls the bar edge-to-edge on mobile so pills don't clip */
  outer: 'overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin',
  inner: 'flex gap-2 pb-1 min-w-max sm:min-w-0 sm:flex-wrap',
  pill: (active: boolean) =>
    `inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-primary-600 text-white'
        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
    }`,
} as const)

/* ─── Cards ─── */

export const card = Object.freeze({
  base: 'rounded-lg border border-neutral-200 bg-white p-6',
  danger: 'rounded-lg border border-error-200 bg-white p-6',
} as const)

/* ─── Navigation ─── */

export const nav = Object.freeze({
  activeLink: 'bg-primary-50 text-primary-700',
  inactiveLink: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  brand: 'text-base font-bold text-primary-700 hover:text-primary-800',
} as const)
