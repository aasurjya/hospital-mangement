import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, btn, alert } from '@/lib/styles'
import { canManageInventory, canViewInventory } from '@/lib/inventory/permissions'
import type { InventoryAlertType } from '@/types/database'

export const metadata = { title: 'Inventory' }

const ALERT_BADGE: Record<InventoryAlertType, string> = {
  LOW_STOCK: 'bg-warning-100 text-warning-700 border border-warning-300',
  EXPIRED: 'bg-error-100 text-error-700 border border-error-300',
  EXPIRING_SOON: 'bg-caution-100 text-caution-800 border border-caution-300',
}

const PAGE_SIZE = 20

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string; low_stock?: string }>
}) {
  const { profile } = await requireAuth()

  if (!canViewInventory(profile.role)) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-600">You do not have access to view inventory.</p>
      </div>
    )
  }

  const { page: pageStr, category, search, low_stock } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const canManage = canManageInventory(profile.role)
  const hospitalId = profile.hospital_id!

  const supabase = await createSupabaseServerClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Fetch active (unresolved) alerts
  const { data: activeAlerts } = await supabase
    .from('inventory_alerts')
    .select(`
      id,
      alert_type,
      created_at,
      item_id,
      inventory_items!item_id (name, quantity_on_hand, reorder_level)
    `)
    .eq('hospital_id', hospitalId)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })

  // Build items query
  let itemsQuery = supabase
    .from('inventory_items')
    .select('*', { count: 'exact' })
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .order('name')
    .range(from, to)

  if (category) itemsQuery = itemsQuery.eq('category', category)
  if (search) itemsQuery = itemsQuery.ilike('name', `%${search}%`)
  if (low_stock === 'true') {
    // Filter items where quantity_on_hand <= reorder_level
    itemsQuery = itemsQuery.filter('quantity_on_hand', 'lte', supabase.rpc)
  }

  const { data: items, count: totalCount } = await itemsQuery
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)

  // Fetch distinct categories for filter
  const { data: categoryRows } = await supabase
    .from('inventory_items')
    .select('category')
    .eq('hospital_id', hospitalId)
    .not('category', 'is', null)
    .order('category')

  const categories = [...new Set((categoryRows ?? []).map((r) => r.category).filter(Boolean) as string[])]

  // Fetch recent transactions for items on this page (up to 3 per item)
  const itemIds = (items ?? []).map((i) => i.id)
  let recentTransactions: Record<string, { transaction_type: string; quantity: number; created_at: string }[]> = {}
  if (itemIds.length > 0) {
    const { data: txRows } = await supabase
      .from('inventory_transactions')
      .select('item_id, transaction_type, quantity, created_at')
      .in('item_id', itemIds)
      .order('created_at', { ascending: false })
      .limit(itemIds.length * 3)

    recentTransactions = (txRows ?? []).reduce<typeof recentTransactions>((acc, tx) => {
      const existing = acc[tx.item_id] ?? []
      if (existing.length >= 3) return acc
      return { ...acc, [tx.item_id]: [...existing, tx] }
    }, {})
  }

  // Create an alert item_id set for quick lookup
  const alertedItemIds = new Set((activeAlerts ?? []).map((a) => a.item_id))

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const values = { category, search, low_stock, page: String(page), ...overrides }
    for (const [k, v] of Object.entries(values)) {
      if (v && k !== 'page') params.set(k, v)
      if (k === 'page' && v && v !== '1') params.set(k, v)
    }
    return params.size > 0 ? `?${params.toString()}` : '/hospital/inventory'
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Inventory{' '}
          <span className="text-sm font-normal text-neutral-500">({totalCount ?? 0} items)</span>
        </h1>
        {canManage && (
          <a href="/hospital/inventory/new" className={btn.primary}>
            Add Item
          </a>
        )}
      </div>

      {/* Active alerts section */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-neutral-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-error-600 text-white text-xs font-bold w-5 h-5">
              {activeAlerts.length}
            </span>
            Active Alerts
          </h2>
          <div className="space-y-2">
            {activeAlerts.map((alertEntry) => {
              const item = alertEntry.inventory_items as {
                name: string
                quantity_on_hand: number
                reorder_level: number
              } | null
              const alertType = alertEntry.alert_type as InventoryAlertType

              return (
                <div
                  key={alertEntry.id}
                  className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ALERT_BADGE[alertType]}`}
                    >
                      {formatLabel(alertType)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{item?.name ?? '—'}</p>
                      {alertType === 'LOW_STOCK' && item && (
                        <p className="text-xs text-neutral-600">
                          {item.quantity_on_hand} units remaining (reorder at {item.reorder_level})
                        </p>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <form action={`/hospital/inventory/alerts/${alertEntry.id}/resolve`} method="POST">
                      <button
                        type="submit"
                        className="text-xs text-neutral-500 hover:text-neutral-700 underline min-h-[44px] px-2"
                      >
                        Resolve
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <form method="GET" className="flex gap-2">
          <input
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Search items by name…"
            className="mt-0 block w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {low_stock && <input type="hidden" name="low_stock" value={low_stock} />}
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="navigation" aria-label="Filter by category">
            <a
              href={buildHref({ category: undefined, page: '1' })}
              aria-current={!category ? 'true' : undefined}
              className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
                !category ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Categories
            </a>
            {categories.map((cat) => (
              <a
                key={cat}
                href={buildHref({ category: cat, page: '1' })}
                aria-current={category === cat ? 'true' : undefined}
                className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Items table */}
      {(!items || items.length === 0) ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500">No inventory items found.</p>
          {canManage && (
            <a href="/hospital/inventory/new" className={`mt-4 inline-block ${btn.primary}`}>
              Add First Item
            </a>
          )}
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full" aria-label="Inventory items">
            <thead className={table.header}>
              <tr>
                {['Item', 'SKU', 'Category', 'Stock', 'Reorder At', 'Cost/Unit', 'Expiry', 'Recent Transactions'].map(
                  (h) => (
                    <th key={h} scope="col" className={table.headerCell}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody className={table.body}>
              {items.map((item) => {
                const isLowStock = item.quantity_on_hand <= item.reorder_level
                const hasAlert = alertedItemIds.has(item.id)
                const transactions = recentTransactions[item.id] ?? []

                return (
                  <tr key={item.id} className={`${table.row} ${isLowStock ? 'bg-warning-50' : ''}`}>
                    <td className={table.cell}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-neutral-900">{item.name}</p>
                          {item.location && (
                            <p className="text-xs text-neutral-500">{item.location}</p>
                          )}
                        </div>
                        {hasAlert && (
                          <span className="inline-flex items-center rounded-full bg-warning-100 px-1.5 py-0.5 text-xs font-medium text-warning-700 border border-warning-300">
                            Alert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={table.cell}>
                      <span className="font-mono text-xs text-neutral-600">{item.sku ?? '—'}</span>
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-600">{item.category ?? '—'}</span>
                    </td>
                    <td className={table.cell}>
                      <span
                        className={`text-base font-bold ${
                          isLowStock ? 'text-warning-700' : 'text-neutral-900'
                        }`}
                      >
                        {item.quantity_on_hand}
                      </span>
                      {isLowStock && (
                        <span className="ml-1 text-xs text-warning-600">Low</span>
                      )}
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-600">{item.reorder_level}</span>
                    </td>
                    <td className={table.cell}>
                      {item.cost_per_unit != null ? (
                        <span className="text-neutral-700">${item.cost_per_unit.toFixed(2)}</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className={table.cell}>
                      {item.expiry_date ? (
                        <span
                          className={`text-sm ${
                            new Date(item.expiry_date) < new Date()
                              ? 'text-error-600 font-medium'
                              : 'text-neutral-600'
                          }`}
                        >
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className={table.cell}>
                      {transactions.length > 0 ? (
                        <ul className="space-y-0.5">
                          {transactions.map((tx, idx) => (
                            <li key={idx} className="text-xs text-neutral-500 flex items-center gap-1">
                              <span
                                className={`font-medium ${
                                  ['PURCHASE', 'RETURNED'].includes(tx.transaction_type)
                                    ? 'text-success-700'
                                    : 'text-error-600'
                                }`}
                              >
                                {['PURCHASE', 'RETURNED'].includes(tx.transaction_type) ? '+' : '-'}
                                {tx.quantity}
                              </span>
                              <span>{formatLabel(tx.transaction_type)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-neutral-400 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildHref({ page: String(page - 1) })}
                aria-label={`Previous page, page ${page - 1}`}
                className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildHref({ page: String(page + 1) })}
                aria-label={`Next page, page ${page + 1}`}
                className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}

      {/* Note for managers */}
      {canManage && (
        <div className={`mt-6 ${alert.info}`}>
          <p className="text-sm">
            To record a stock transaction (purchase, dispense, adjustment), navigate to an item&apos;s
            detail page and use the transaction form.
          </p>
        </div>
      )}
    </div>
  )
}
