interface Props {
  label: string
  value: string | number
  suffix?: string
}

export function ReportStatCard({ label, value, suffix }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-neutral-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="ml-1 text-lg font-medium text-neutral-500">{suffix}</span>}
      </p>
    </div>
  )
}
