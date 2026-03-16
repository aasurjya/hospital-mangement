'use client'

import { useActionState, useState } from 'react'
import { createConversationAction } from '@/app/hospital/chat/actions'
import type { ConversationState } from '@/app/hospital/chat/actions'

interface StaffMember {
  id: string
  full_name: string
  role: string
}

interface Props {
  staff: StaffMember[]
  isAdmin: boolean
}

const inputCls =
  'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function NewConversationForm({ staff, isAdmin }: Props) {
  const [state, formAction, isPending] = useActionState<ConversationState, FormData>(
    createConversationAction,
    null
  )
  const [type, setType] = useState<'DIRECT' | 'GROUP' | 'BROADCAST'>('DIRECT')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isDirect = type === 'DIRECT'

  const toggleMember = (id: string) => {
    if (isDirect) {
      // Single select for DIRECT
      setSelectedIds(new Set([id]))
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }
  }

  const handleTypeChange = (newType: 'DIRECT' | 'GROUP' | 'BROADCAST') => {
    setType(newType)
    // Reset selection when type changes
    setSelectedIds(new Set())
  }

  // Build hidden input value: comma-separated UUIDs
  const memberIdsValue = Array.from(selectedIds).join(',')

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200"
        >
          {state.error}
        </div>
      )}

      {/* Conversation type */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Type <span className="text-error-500">*</span>
        </label>
        <div className="flex gap-3">
          {(['DIRECT', 'GROUP'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => handleTypeChange(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                type === t
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {t === 'DIRECT' ? 'Direct Message' : 'Group'}
            </button>
          ))}
          {isAdmin && (
            <button
              type="button"
              aria-pressed={type === 'BROADCAST'}
              onClick={() => handleTypeChange('BROADCAST')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                type === 'BROADCAST'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              Broadcast
            </button>
          )}
        </div>
        {state?.fieldErrors?.type?.[0] && (
          <p className="mt-1 text-xs text-error-600">{state.fieldErrors.type[0]}</p>
        )}
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Name (GROUP / BROADCAST only) */}
      {!isDirect && (
        <div>
          <label htmlFor="conv-name" className="block text-sm font-medium text-neutral-700">
            Name <span className="text-error-500">*</span>
          </label>
          <input
            id="conv-name"
            name="name"
            type="text"
            required
            disabled={isPending}
            maxLength={120}
            placeholder={type === 'BROADCAST' ? 'e.g. Hospital Announcements' : 'e.g. ICU Team'}
            className={inputCls}
          />
          {state?.fieldErrors?.name?.[0] && (
            <p className="mt-1 text-xs text-error-600">{state.fieldErrors.name[0]}</p>
          )}
        </div>
      )}

      {/* Staff selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {isDirect ? 'Recipient' : 'Members'}{' '}
          <span className="text-error-500">*</span>
          {!isDirect && (
            <span className="ml-1 font-normal text-neutral-500">
              ({selectedIds.size} selected)
            </span>
          )}
        </label>

        {state?.fieldErrors?.member_ids?.[0] && (
          <p className="mb-2 text-xs text-error-600">{state.fieldErrors.member_ids[0]}</p>
        )}

        <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-200 divide-y divide-neutral-100">
          {staff.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500 text-center">
              No staff members found.
            </p>
          ) : (
            staff.map((member) => {
              const isSelected = selectedIds.has(member.id)
              return (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleMember(member.id)}
                  disabled={isPending}
                  className={`w-full flex min-h-[44px] items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                    isSelected ? 'bg-primary-50' : ''
                  }`}
                >
                  <div
                    className={`flex-none h-4 w-4 rounded ${
                      isDirect ? 'rounded-full' : 'rounded-sm'
                    } border-2 transition-colors ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-neutral-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-neutral-900 block truncate">
                      {member.full_name}
                    </span>
                    <span className="text-xs text-neutral-500">{formatRole(member.role)}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Hidden input for member_ids */}
        <input type="hidden" name="member_ids" value={memberIdsValue} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || selectedIds.size === 0}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Creating…' : 'Create conversation'}
        </button>
        <a href="/hospital/chat" className="inline-flex min-h-[44px] items-center py-2 text-sm text-neutral-500 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded">
          Cancel
        </a>
      </div>
    </form>
  )
}
