import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePagination from '../usePagination'

const items = (n) => Array.from({ length: n }, (_, i) => i + 1)

describe('usePagination', () => {
  it('returns the first page slice and page metadata', () => {
    const { result } = renderHook(() => usePagination(items(55), 10))
    expect(result.current.paginatedItems).toHaveLength(10)
    expect(result.current.paginatedItems[0]).toBe(1)
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(6)
    expect(result.current.totalItems).toBe(55)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrev).toBe(false)
  })

  it('advances pages and reports the final partial slice', () => {
    const { result } = renderHook(() => usePagination(items(25), 10))
    act(() => result.current.setPage(3))
    expect(result.current.paginatedItems).toEqual([21, 22, 23, 24, 25])
    expect(result.current.hasNext).toBe(false)
    expect(result.current.hasPrev).toBe(true)
  })

  it('clamps the page when the item list shrinks', () => {
    const { result, rerender } = renderHook(({ list }) => usePagination(list, 10), {
      initialProps: { list: items(50) },
    })
    act(() => result.current.setPage(5))
    expect(result.current.page).toBe(5)

    rerender({ list: items(12) })
    expect(result.current.page).toBe(2)
    expect(result.current.paginatedItems).toEqual([11, 12])
  })

  it('never reports zero pages for an empty list', () => {
    const { result } = renderHook(() => usePagination([], 10))
    expect(result.current.totalPages).toBe(1)
    expect(result.current.page).toBe(1)
    expect(result.current.hasNext).toBe(false)
    expect(result.current.hasPrev).toBe(false)
    expect(result.current.paginatedItems).toEqual([])
  })
})
