interface CsvColumn<T> {
  key: keyof T
  header: string
}

/** Characters that could trigger formula injection in spreadsheet apps */
const FORMULA_PREFIXES = ['=', '+', '-', '@']

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escape formula injection
  if (FORMULA_PREFIXES.some((p) => str.startsWith(p))) {
    return `"'${str.replace(/"/g, '""')}"`
  }
  // Quote if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function generateCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[]
): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCell(row[c.key])).join(',')
  )
  return [header, ...dataLines].join('\n')
}
