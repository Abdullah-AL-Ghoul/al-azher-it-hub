import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getBroadcast,
  saveBroadcast,
  clearBroadcast,
  restoreDefaultBroadcast,
  dismissBroadcast,
  isBroadcastDismissed,
  toggleBroadcastActive,
  fetchBroadcastRemote,
  DEFAULT_BROADCAST,
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
    expect(BROADCAST_TYPES.celebration.badgeAr).toBe('مميز')
    expect(BROADCAST_TYPES.info.badgeAr).toBe('إرشاد')
  })

  it('returns accredited DEFAULT_BROADCAST when storage has no custom broadcast', () => {
    const broadcast = getBroadcast()
    expect(broadcast).not.toBeNull()
    expect(broadcast.active).toBe(true)
    expect(broadcast.id).toBe(DEFAULT_BROADCAST.id)
    expect(broadcast.type).toBe('academic')
    expect(broadcast.titleAr).toContain('إعلان أكاديمي')
    expect(broadcast.messageAr).toBeDefined()
    expect(broadcast.link).toBe('/lectures')
  })

  it('saves and retrieves a custom active broadcast, dispatching window event', () => {
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

  it('clears broadcast completely and marks it inactive', () => {
    saveBroadcast({
      titleAr: 'إعلان للتنظيف',
      messageAr: 'سيتم مسحه',
      active: true,
    })
    expect(getBroadcast().active).toBe(true)

    clearBroadcast()
    const afterClear = getBroadcast()
    expect(afterClear.active).toBe(false)
    expect(afterClear.cleared).toBe(true)
  })

  it('restores default broadcast after being cleared', () => {
    clearBroadcast()
    expect(getBroadcast().active).toBe(false)

    const restored = restoreDefaultBroadcast()
    expect(restored.active).toBe(true)
    expect(restored.id).toBe(DEFAULT_BROADCAST.id)
    expect(getBroadcast().active).toBe(true)
  })

  it('tracks dismissed broadcasts per user session and clears dismissal on update', () => {
    const broadcastId = 'bc_test_123'
    expect(isBroadcastDismissed(broadcastId)).toBe(false)

    dismissBroadcast(broadcastId)
    expect(isBroadcastDismissed(broadcastId)).toBe(true)

    // Different broadcast is not dismissed
    expect(isBroadcastDismissed('bc_other_456')).toBe(false)

    // When admin publishes an update for the same broadcast ID, dismissal is reset
    saveBroadcast({
      id: broadcastId,
      titleAr: 'نسخة محدثة',
      messageAr: 'محتوى جديد',
      active: true,
    })
    expect(isBroadcastDismissed(broadcastId)).toBe(false)
  })

  it('falls back to default broadcast when remote fetch returns empty', async () => {
    const remote = await fetchBroadcastRemote()
    expect(remote).not.toBeNull()
    expect(remote.active).toBe(true)
  })
})
