interface Props {
  label: string
  value: number
  href: string
}

// H1: aria-label gives screen readers full context ("Admitted: 4. Go to admissions.")
export function StatCard({ label, value, href }: Props) {
  return (
    <a
      href={href}
      aria-label={`${label}: ${value.toLocaleString()}. Go to ${label.toLowerCase()} page.`}
      className="block rounded-lg border border-neutral-200 bg-white p-5 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500" aria-hidden="true">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-neutral-900" aria-hidden="true">
        {value.toLocaleString()}
      </p>
    </a>
  )
}
