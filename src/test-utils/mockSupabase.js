// ---------------------------------------------------------------------------
// Fluent Supabase mock.
//
// Real services call getSupabase().from(table).select(...).eq(...).maybeSingle(),
// getSupabase().rpc(name, params), getSupabase().auth.*, etc. This module
// reproduces that surface without any network. The fluent query builder is
// thenable so `await getSupabase().from(t).select('*')` works exactly like the
// real client.
//
// To patch services globally (see ./setup.js), tests import this module and
// call __setSupabaseMock(createMockSupabase({ ... })). getSupabase() returns
// whatever mock was installed, so @/services/supabase needs to be mocked to
// route through here — see renderWithProviders for the recommended wiring.
// ---------------------------------------------------------------------------

export const DEFAULT_USER = {
  studentId: 'student-1',
  name: 'Test Student',
  role: 'student',
  email: 'student@test.com',
  major: 'CS',
  google: '',
  linkedin: '',
  whatsapp: '',
  lastVisit: null,
  lastIP: null,
}

export const DEFAULT_SESSION = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'auth-uid-1',
    email: DEFAULT_USER.email,
    user_metadata: { studentId: DEFAULT_USER.studentId, name: DEFAULT_USER.name },
  },
}

function selectColumns(columns, row) {
  if (!columns || columns === '*') return row
  return columns
    .split(',')
    .map((c) => c.trim().replace(/"/g, ''))
    .reduce((out, key) => {
      if (key in row) out[key] = row[key]
      else out[key] = null
      return out
    }, {})
}

function sortRows(rows, orderBy) {
  const { col, ascending, nullsFirst } = orderBy
  const dir = ascending ? 1 : -1
  return rows.slice().sort((a, b) => {
    const av = a[col]
    const bv = b[col]
    if (av == null && bv == null) return 0
    if (av == null) return nullsFirst ? -dir : dir
    if (bv == null) return nullsFirst ? dir : -dir
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
}

class QueryBuilder {
  constructor(store, table) {
    this._store = store
    this._table = table
    this._columns = '*'
    this._filters = []
    this._orderBy = null
    this._limit = null
    this._mode = 'select'
    this._payload = null
    this._single = false
    this._maybeSingle = false
  }

  select(cols) {
    this._columns = cols
    this._mode = 'select'
    return this
  }

  insert(row) {
    this._mode = 'insert'
    this._payload = row
    return this
  }

  upsert(row) {
    this._mode = 'upsert'
    this._payload = row
    return this
  }

  update(row) {
    this._mode = 'update'
    this._payload = row
    return this
  }

  delete() {
    this._mode = 'delete'
    return this
  }

  eq(col, val) {
    this._filters.push((r) => r[col] === val)
    return this
  }

  neq(col, val) {
    this._filters.push((r) => r[col] !== val)
    return this
  }

  in(col, vals) {
    this._filters.push((r) => vals.includes(r[col]))
    return this
  }

  like(col, val) {
    const pattern = String(val).replace(/%/g, '')
    this._filters.push((r) => String(r[col]).toLowerCase().includes(pattern))
    return this
  }

  ilike(col, val) {
    const pattern = String(val).toLowerCase()
    this._filters.push((r) => String(r[col]).toLowerCase().includes(pattern))
    return this
  }

  gt(col, val) {
    this._filters.push((r) => r[col] > val)
    return this
  }

  gte(col, val) {
    this._filters.push((r) => r[col] >= val)
    return this
  }

  lt(col, val) {
    this._filters.push((r) => r[col] < val)
    return this
  }

  lte(col, val) {
    this._filters.push((r) => r[col] <= val)
    return this
  }

  order(col, opts = {}) {
    this._orderBy = { col, ascending: opts.ascending !== false, nullsFirst: !!opts.nullsFirst }
    return this
  }

  limit(n) {
    this._limit = n
    return this
  }

  single() {
    this._single = true
    return this._run()
  }

  maybeSingle() {
    this._maybeSingle = true
    return this._run()
  }

  then(resolve, reject) {
    return this._run().then(resolve, reject)
  }

  _matches(row) {
    return this._filters.every((fn) => fn(row))
  }

  _run() {
    if (this._store._onQuery) this._store._onQuery(this._table, this)
    return Promise.resolve(this._exec())
  }

  _exec() {
    if (!this._store._tables[this._table]) this._store._tables[this._table] = []

    // Mutating operations operate on the store directly.
    if (this._mode === 'insert') {
      const inputs = Array.isArray(this._payload) ? this._payload : [this._payload]
      const rows = this._store._tables[this._table]
      const inserted = inputs.map((p, i) => {
        const row = { id: `mock-${rows.length + i + 1}`, createdAt: new Date().toISOString(), ...p }
        rows.push(row)
        return { ...row }
      })
      return { data: inserted, error: null }
    }

    if (this._mode === 'upsert') {
      const inputs = Array.isArray(this._payload) ? this._payload : [this._payload]
      const rows = this._store._tables[this._table]
      const inserted = inputs.map((p) => {
        const existingIndex = p.id ? rows.findIndex((r) => r.id === p.id) : -1
        if (existingIndex >= 0) {
          rows[existingIndex] = { ...rows[existingIndex], ...p }
          return { ...rows[existingIndex] }
        }
        const row = { id: `mock-${rows.length + 1}`, createdAt: new Date().toISOString(), ...p }
        rows.push(row)
        return { ...row }
      })
      return { data: inserted, error: null }
    }

    const all = this._store._tables[this._table]

    if (this._mode === 'update') {
      const updated = []
      for (const row of all) {
        if (this._matches(row)) {
          Object.assign(row, this._payload)
          updated.push({ ...row })
        }
      }
      return { data: updated, error: null }
    }

    if (this._mode === 'delete') {
      const removed = all.filter((r) => this._matches(r)).map((r) => ({ ...r }))
      this._store._tables[this._table] = all.filter((r) => !this._matches(r))
      return { data: removed, error: null }
    }

    // select mode (default)
    let result = all.filter((r) => this._matches(r))
    if (this._orderBy) result = sortRows(result, this._orderBy)
    if (this._limit != null) result = result.slice(0, this._limit)
    result = result.map((row) => selectColumns(this._columns, row))

    if (this._single) {
      return { data: result[0] ?? null, error: null }
    }
    if (this._maybeSingle) {
      return { data: result[0] ?? null, error: null }
    }
    return { data: result, error: null }
  }
}

export function createMockSupabase(options = {}) {
  const tables = {}
  for (const [name, rows] of Object.entries(options.data || {})) {
    tables[name] = rows.map((r) => ({ ...r }))
  }

  const user = options.user || DEFAULT_USER
  const session = options.session === null ? null : options.session || DEFAULT_SESSION

  const authApi = {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user }, error: null }),
    signUp: async () => ({ data: { user: { id: 'mock-auth-id' }, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user, session }, error: null }),
    signInWithOAuth: async () => ({ data: { user, session }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getToken: async () => ({ data: session?.access_token ?? null, error: null }),
    updateUser: async () => ({ data: { user }, error: null }),
  }

  const client = {
    _tables: tables,
    _onQuery: options.onQuery || null,
    from: (table) => new QueryBuilder(client, table),
    rpc: async (fn, params) => {
      if (options.rpc && typeof options.rpc === 'function') {
        const res = await options.rpc(fn, params)
        if (res && (res.data !== undefined || res.error !== undefined)) return res
        return { data: res ?? null, error: null }
      }
      if (options.rpcResults && fn in options.rpcResults) {
        return options.rpcResults[fn]
      }
      return { data: null, error: null }
    },
    // Per-method overrides: createMockSupabase({ auth: { signInWithPassword: async () => ... } })
    auth: { ...authApi, ...(options.auth || {}) },
    storage: {
      from: (bucket) => ({
        bucket,
        upload: async () => ({ data: { path: `mocked/${bucket}` }, error: null }),
        download: async () => ({ data: new Blob(['mocked']), error: null }),
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ data: [], error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: 'mock://signed' }, error: null }),
        update: async () => ({ data: null, error: null }),
        move: async () => ({ data: null, error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
  }

  client.__setData = (table, rows) => {
    tables[table] = rows.map((r) => ({ ...r }))
  }
  client.__getData = (table) => (tables[table] ? tables[table].map((r) => ({ ...r })) : [])
  client.__reset = () => {
    for (const k of Object.keys(tables)) delete tables[k]
  }

  return client
}

// ---------------------------------------------------------------------------
// Module-level single install point. The mocked @/services/supabase routes
// getSupabase/authRpc through here so tested services share one instance.
// ---------------------------------------------------------------------------

let installedMock = null

export function __setSupabaseMock(mock) {
  installedMock = mock
}

export function __getSupabaseMock() {
  return installedMock
}

export function __resetSupabaseMock() {
  installedMock = null
}

export function getSupabase() {
  if (!installedMock) installedMock = createMockSupabase()
  return installedMock
}

export async function authRpc(fn, params = {}) {
  const { data, error } = await getSupabase().rpc(fn, params)
  if (error) throw error
  return data
}

export function mockGetSupabase(options) {
  const mock = createMockSupabase(options)
  __setSupabaseMock(mock)
  return mock
}

// Hook to spy on getSupabase via vi.mock in a test file.
export function __hookGetSupabase(mock) {
  __setSupabaseMock(mock)
  return getSupabase
}

// ---------------------------------------------------------------------------
// Tiny result helpers for hand-writing test assertions.
// ---------------------------------------------------------------------------

export function asyncError(message = 'Mock error', code = 'MOCK_ERROR') {
  return { data: null, error: { message, code } }
}

export function ok(data) {
  return { data, error: null }
}

export function reject(message) {
  return Promise.reject(new Error(message || 'Mock failure'))
}

export default {
  createMockSupabase,
  getSupabase,
  authRpc,
  mockGetSupabase,
  __setSupabaseMock,
  __getSupabaseMock,
  __resetSupabaseMock,
  __hookGetSupabase,
  asyncError,
  ok,
  reject,
  DEFAULT_USER,
  DEFAULT_SESSION,
}
