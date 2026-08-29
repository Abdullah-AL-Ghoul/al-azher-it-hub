import { exportAllData } from '../services'
import { toast } from 'react-hot-toast'

export const INPUT_CLASS = 'w-full glass border border-white/10 rounded-lg px-3 py-2 text-sm text-ink placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-royal-400/50'

export async function exportToJson(filename, t, items) {
  try {
    const data = items ?? await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    if (t) toast.success(t('usersTable.exported') || 'Exported!')
  } catch (error) {
    if (t) toast.error(t('usersTable.exportFailed') || 'Export failed')
  }
}

export function exportToCsv(items, columns, filename, t) {
  if (!items.length) {
    toast.error(t ? (t('admin.noData') || 'No data to export') : 'No data')
    return
  }
  const header = columns.map(c => c.label).join(',')
  const rows = items.map(item =>
    columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(item) : item[c.accessor]
      const str = String(val ?? '').replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  const csv = '\uFEFF' + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  if (t) toast.success(t('usersTable.exported') || 'Exported!')
}
