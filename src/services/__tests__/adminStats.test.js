import { describe, it, expect, beforeEach } from 'vitest'
import { getAllUserStats, getAllRatings } from '../adminStats'
import { getUsers } from '../users'
import { createMockSupabase, __setSupabaseMock, __resetSupabaseMock } from '../../test-utils/mockSupabase'

beforeEach(() => {
  __resetSupabaseMock()
})

describe('adminStats', () => {
  it('getAllUserStats fetches studentId + viewed from user_stats', async () => {
    const mock = createMockSupabase({
      data: {
        user_stats: [
          { studentId: '20241644', viewed: ['l1', 'l2'], lastVisit: '2026-08-23T11:58:45Z' },
          { studentId: '20231537', viewed: ['l1'], lastVisit: '2026-08-22T10:00:00Z' },
        ],
      },
    })
    __setSupabaseMock(mock)

    const stats = await getAllUserStats()
    expect(stats).toHaveLength(2)
    expect(stats[0].viewed).toContain('l1')
    expect(stats.find(s => s.studentId === '20241644').viewed).toHaveLength(2)
  })

  it('getAllRatings aggregates the ratings map per student', async () => {
    const mock = createMockSupabase({
      data: {
        ratings: [
          { studentId: '20241644', ratings: { l1: 5, l2: 4 } },
          { studentId: '20231537', ratings: { l1: 3 } },
        ],
      },
    })
    __setSupabaseMock(mock)

    const ratings = await getAllRatings()
    expect(ratings).toHaveLength(2)
    const malk = ratings.find(r => r.studentId === '20241644')
    expect(malk.ratings.l1).toBe(5)
  })

  it('getAllUserStats returns [] when table is empty', async () => {
    const mock = createMockSupabase({ data: { user_stats: [] } })
    __setSupabaseMock(mock)
    const stats = await getAllUserStats()
    expect(stats).toEqual([])
  })

  it('getAllUserStats propagates query errors', async () => {
    const mock = createMockSupabase({
      rpcResults: {},
      data: { user_stats: [] },
      onQuery: () => {},
    })
    // Force an error by making from() return an errored builder via a broken rpc.
    const errMock = {
      ...mock,
      from: () => ({
        select: () => ({ limit: () => Promise.resolve({ data: null, error: { message: 'RLS denied' } }) }),
      }),
    }
    __setSupabaseMock(errMock)
    await expect(getAllUserStats()).rejects.toThrow('RLS denied')
  })
})

describe('getUsers ordering', () => {
  it('orders by createdAt descending so newest users come first', async () => {
    const mock = createMockSupabase({
      data: {
        users: [
          { studentId: 'old', name: 'Old', role: 'student', createdAt: '2026-01-01T00:00:00Z', lastVisit: null },
          { studentId: '20241644', name: 'malk', role: 'student', createdAt: '2026-08-23T11:56:04Z', lastVisit: null },
          { studentId: 'mid', name: 'Mid', role: 'student', createdAt: '2026-06-01T00:00:00Z', lastVisit: null },
        ],
      },
    })
    __setSupabaseMock(mock)

    const users = await getUsers()
    expect(users).toHaveLength(3)
    expect(users[0].studentId).toBe('20241644')
    expect(users[0].name).toBe('malk')
    expect(users[1].studentId).toBe('mid')
    expect(users[2].studentId).toBe('old')
  })
})
