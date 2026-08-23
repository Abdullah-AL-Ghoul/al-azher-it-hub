import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCrudService } from '../createCrudService'
import { mockGetSupabase, __resetSupabaseMock, __getSupabaseMock } from '../../test-utils/mockSupabase'

beforeEach(() => {
  __resetSupabaseMock()
})

// The CRUD factory keeps a module-level cache keyed by collection name, so each
// test uses a distinct table name for full isolation.
let seq = 0
function nextTable() {
  return `tbl_${++seq}`
}

function mockWithRpc(table, rows) {
  let mock
  mock = mockGetSupabase({
    data: { [table]: rows },
    rpc: (fn, params) => {
      if (fn === 'admin_save_rows' && params?.p_table === table) {
        const store = mock._tables[table] || (mock._tables[table] = [])
        const saved = (params.p_rows || []).map(r => {
          const row = { ...r, id: r.id || `mock-${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }
          store.push(row)
          return row
        })
        return { data: saved, error: null }
      }
      return { data: null, error: null }
    },
  })
  return mock
}

describe('createCrudService', () => {
  it('fetches all rows and caches', async () => {
    const table = nextTable()
    mockWithRpc(table, [{ id: '1', titleAr: 'أ' }])
    const service = createCrudService(table, 'titleAr', 200)

    const r1 = await service.getAll()
    expect(r1).toHaveLength(1)
    expect(r1[0].titleAr).toBe('أ')

    const mock = __getSupabaseMock()
    const spy = vi.spyOn(mock, 'from')
    const r2 = await service.getAll()
    expect(r2).toHaveLength(1)
    expect(spy).not.toHaveBeenCalled()
  })

  it('passes selectCols to the query', async () => {
    const table = nextTable()
    mockWithRpc(table, [{ id: '1', titleAr: 'أ', descriptionAr: 'desc' }])
    const service = createCrudService(table, 'titleAr', 200)

    const r = await service.getAll(true, 'titleAr,id')
    expect(r).toHaveLength(1)
    expect(r[0].titleAr).toBe('أ')
    expect(r[0].descriptionAr).toBeUndefined()
  })

  it('deduplicates inflight requests', async () => {
    const table = nextTable()
    const mock = mockWithRpc(table, [{ id: '1' }])
    const service = createCrudService(table, 'titleAr', 200)

    const spy = vi.spyOn(mock, 'from')
    const [a, b] = await Promise.all([service.getAll(), service.getAll()])
    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('invalidates cache after a write', async () => {
    const table = nextTable()
    mockWithRpc(table, [{ id: '1', titleAr: 'old' }])
    const service = createCrudService(table, 'titleAr', 200)

    await service.getAll()
    await service.add({ titleAr: 'new', titleEn: 'new' })
    const r = await service.getAll()
    expect(r.find(x => x.titleAr === 'new')).toBeTruthy()
  })
})
