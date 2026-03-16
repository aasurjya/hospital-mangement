'use client'

import { useTransition } from 'react'
import { toggleDepartmentAction } from './actions'
import { table } from '@/lib/styles'
import type { Department } from '@/types/database'

export function DepartmentList({ departments }: { departments: Department[] }) {
  if (departments.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-600">No departments yet.</p>
        <a href="/hospital/departments/new" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
          Add the first department
        </a>
      </div>
    )
  }
  return (
    <div className={table.wrapper}>
      <table className="min-w-full divide-y divide-neutral-200" aria-label="Departments">
        <thead className={table.header}>
          <tr>
            <th className={table.headerCell}>Name</th>
            <th className={`${table.headerCell} hidden sm:table-cell`}>Description</th>
            <th className={table.headerCell}>Status</th>
            <th className={table.headerCell}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {departments.map((d) => (
            <DeptRow key={d.id} dept={d} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeptRow({ dept }: { dept: Department }) {
  const [isPending, startTransition] = useTransition()
  return (
    <tr className={table.row}>
      <td className={`${table.cell} font-medium text-neutral-900`}>
        {dept.name}
        {/* Mobile: show description inline */}
        <div className="mt-0.5 text-xs text-neutral-500 sm:hidden">{dept.description}</div>
      </td>
      <td className={`${table.cell} hidden text-neutral-500 sm:table-cell`}>{dept.description ?? '—'}</td>
      <td className={table.cell}>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          dept.is_active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'
        }`}>
          {dept.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className={`${table.cell} text-right`}>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => toggleDepartmentAction(dept.id, !dept.is_active))}
          className="min-h-[44px] px-1 text-sm font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50"
        >
          {dept.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  )
}
