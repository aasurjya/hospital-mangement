import type { SupabaseClient } from '@supabase/supabase-js'
import type { FinancialReport } from '@/lib/reports/types'

export async function fetchFinancialReport(
  supabase: SupabaseClient,
  hospitalId: string,
  dateRange: { start: string; end: string }
): Promise<FinancialReport> {
  const [invoicesResult, paymentsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, status, total, amount_paid')
      .eq('hospital_id', hospitalId)
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end),
    supabase
      .from('payments')
      .select('id, amount, method')
      .eq('hospital_id', hospitalId)
      .gte('paid_at', dateRange.start)
      .lt('paid_at', dateRange.end),
  ])

  const invoices = invoicesResult.data ?? []
  const payments = paymentsResult.data ?? []

  // Revenue = sum of actual payments in period
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  // Outstanding = sum of (total - amount_paid) for ISSUED and PARTIAL invoices
  const outstandingAmount = invoices
    .filter((inv) => inv.status === 'ISSUED' || inv.status === 'PARTIAL')
    .reduce((sum, inv) => sum + ((inv.total ?? 0) - (inv.amount_paid ?? 0)), 0)

  const invoiceCount = invoices.length
  const paidCount = invoices.filter((inv) => inv.status === 'PAID').length

  // By status
  const statusMap = new Map<string, { count: number; total: number }>()
  for (const inv of invoices) {
    const entry = statusMap.get(inv.status) ?? { count: 0, total: 0 }
    entry.count += 1
    entry.total += inv.total ?? 0
    statusMap.set(inv.status, entry)
  }
  const byStatus = [...statusMap.entries()]
    .map(([status, data]) => ({ status, ...data }))
    .sort((a, b) => b.total - a.total)

  // By payment method
  const methodMap = new Map<string, { count: number; amount: number }>()
  for (const p of payments) {
    const entry = methodMap.get(p.method) ?? { count: 0, amount: 0 }
    entry.count += 1
    entry.amount += p.amount ?? 0
    methodMap.set(p.method, entry)
  }
  const byPaymentMethod = [...methodMap.entries()]
    .map(([method, data]) => ({ method, ...data }))
    .sort((a, b) => b.amount - a.amount)

  return { totalRevenue, outstandingAmount, invoiceCount, paidCount, byStatus, byPaymentMethod }
}
