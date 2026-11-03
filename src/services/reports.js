import { safeActivity } from './activity'

const STORAGE_KEY = 'al_azher_content_reports_v1'

export const REPORT_TYPES = [
  { id: 'video_issue', labelAr: 'مشكلة في تشغيل الفيديو أو الصوت', labelEn: 'Video or audio playback issue' },
  { id: 'broken_link', labelAr: 'رابط معطل أو لا يعمل', labelEn: 'Broken or inaccessible link' },
  { id: 'subtitle_issue', labelAr: 'خطأ في الترجمة أو التفريغ النصي', labelEn: 'Subtitle or transcript error' },
  { id: 'wrong_file', labelAr: 'ملف غير مطابق أو ناقص', labelEn: 'Wrong or incomplete file' },
  { id: 'other', labelAr: 'ملاحظة أكاديمية أخرى', labelEn: 'Other academic feedback' },
]

function readStoredReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch {
    // ignore storage quota errors
  }
}

export async function getContentReports() {
  return readStoredReports().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function submitContentReport({
  itemType = 'lecture',
  itemId = '',
  itemTitle = '',
  subject = '',
  reportType = 'video_issue',
  description = '',
  timestampSeconds = null,
  reporterName = '',
  reporterId = '',
} = {}) {
  const cleanDesc = String(description || '').trim().slice(0, 1000)
  const cleanTitle = String(itemTitle || '').trim().slice(0, 200)
  if (!cleanTitle && !itemId) {
    throw new Error('Item reference is required')
  }

  const report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    itemType,
    itemId: String(itemId || ''),
    itemTitle: cleanTitle || String(itemId),
    subject: String(subject || '').trim().slice(0, 120),
    reportType: REPORT_TYPES.some(t => t.id === reportType) ? reportType : 'other',
    description: cleanDesc,
    timestampSeconds: Number.isFinite(Number(timestampSeconds)) && timestampSeconds !== null ? Number(timestampSeconds) : null,
    reporterName: String(reporterName || 'طالب').trim().slice(0, 100),
    reporterId: String(reporterId || ''),
    status: 'open',
    createdAt: new Date().toISOString(),
  }

  const existing = readStoredReports()
  const updated = [report, ...existing].slice(0, 200)
  writeStoredReports(updated)

  await safeActivity(
    'report',
    `بلاغ محتوى (${report.reportType})`,
    `${report.itemTitle}${report.description ? ` — ${report.description}` : ''}`
  )

  return report
}

export async function updateContentReportStatus(reportId, status = 'resolved') {
  const existing = readStoredReports()
  const updated = existing.map(r => (r.id === reportId ? { ...r, status, updatedAt: new Date().toISOString() } : r))
  writeStoredReports(updated)
  return updated.find(r => r.id === reportId) || null
}

export async function deleteContentReport(reportId) {
  const existing = readStoredReports()
  const updated = existing.filter(r => r.id !== reportId)
  writeStoredReports(updated)
  return true
}
