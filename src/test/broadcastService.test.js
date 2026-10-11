import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getBroadcast,
  saveBroadcast,
  clearBroadcast,
  dismissBroadcast,
  isBroadcastDismissed,
  toggleBroadcastActive,
  BROADCAST_EVENT,
  BROADCAST_TYPES,
} from '../services/broadcast'

describe('Broadcast Service Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('provides all 4 standard broadcast types with complete attributes', () => {
    expect(BROADCAST_TYPES.urgent).toBeDefined()
    expect(BROADCAST_TYPES.academic).toBeDefined()
    expect(BROADCAST_TYPES.celebration).toBeDefined()
    expect(BROADCAST_TYPES.info).toBeDefined()

    expect(BROADCAST_TYPES.urgent.badgeAr).toBe('عاجل')
    expect(BROADCAST_TYPES.academic.badgeEn).toBe('ACADEMIC')
  })

  it('returns null when no broadcast is saved', () => {
    expect(getBroadcast()).toBeNull()
  })

  it('saves and retrieves an active broadcast, dispatching window event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const payload = {
      titleAr: 'تنبيه هام',
      titleEn: 'Important Alert',
      messageAr: 'يرجى مراجعة الجدول',
      messageEn: 'Please check schedule',
      type: 'urgent',
      active: true,
    }

    const saved = saveBroadcast(payload)
    expect(saved).not.toBeNull()
    expect(saved.active).toBe(true)
    expect(saved.type).toBe('urgent')
    expect(saved.titleAr).toBe('تنبيه هام')

    const retrieved = getBroadcast()
    expect(retrieved).not.toBeNull()
    expect(retrieved.titleEn).toBe('Important Alert')

    expect(dispatchSpy).toHaveBeenCalled()
    const lastEvent = dispatchSpy.mock.calls[0][0]
    expect(lastEvent.type).toBe(BROADCAST_EVENT)
  })

  it('toggles broadcast active state', () => {
    saveBroadcast({
      titleAr: 'إعلان مؤقت',
      messageAr: 'نص تجريبي',
      active: true,
    })

    expect(getBroadcast().active).toBe(true)

    toggleBroadcastActive(false)
    expect(getBroadcast().active).toBe(false)

    toggleBroadcastActive(true)
    expect(getBroadcast().active).toBe(true)
  })

  it('clears broadcast completely', () => {
    saveBroadcast({
      titleAr: 'إعلان للتنظيف',
      messageAr: 'سيتم مسحه',
      active: true,
    })
    expect(getBroadcast()).not.toBeNull()

    clearBroadcast()
    expect(getBroadcast()).toBeNull()
  })

  it('tracks dismissed broadcasts per user session', () => {
    const broadcastId = 'bc_test_123'
    expect(isBroadcastDismissed(broadcastId)).toBe(false)

    dismissBroadcast(broadcastId)
    expect(isBroadcastDismissed(broadcastId)).toBe(true)

    // Different broadcast is not dismissed
    expect(isBroadcastDismissed('bc_other_456')).toBe(false)
  })
})
