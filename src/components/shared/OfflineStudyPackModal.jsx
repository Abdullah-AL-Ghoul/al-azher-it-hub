import { useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { 
  FiDownloadCloud, 
  FiUploadCloud, 
  FiHardDrive, 
  FiShield, 
  FiX, 
  FiWifi, 
  FiWifiOff
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

export default function OfflineStudyPackModal({ isOpen, onClose }) {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'
  const fileInputRef = useRef(null)
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Export all student local data to JSON
  const handleExport = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        platform: 'Al-Azhar IT Hub',
        activeMajor: localStorage.getItem('al_azher_active_major_plan') || 'cse-2025',
        weeklySchedule: localStorage.getItem('al_azher_weekly_schedule'),
        gpaCalculator: localStorage.getItem('al_azher_saved_gpa_calc'),
        flashcardsMastery: localStorage.getItem('al_azher_flashcards_mastery'),
        customFlashcards: localStorage.getItem('al_azher_custom_flashcards'),
        focusTasks: localStorage.getItem('al_azher_focus_tasks'),
        curriculumProgress: {},
        lectureNotes: {},
      }

      // Collect curriculum progress keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('al_azher_curriculum_progress')) {
          exportData.curriculumProgress[key] = localStorage.getItem(key)
        }
        if (key && (key.startsWith('lecture_note_') || key.startsWith('lecture_ts_notes_'))) {
          exportData.lectureNotes[key] = localStorage.getItem(key)
        }
      }

      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `al-azher-it-hub-study-pack-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(
        isArabic
          ? 'تم تصدير حزمة الدراسة المحلية بنجاح! يمكنك الاحتفاظ بها واسترجاعها في أي وقت.'
          : 'Study pack exported successfully!'
      )
    } catch (e) {
      toast.error(isArabic ? 'حدث خطأ أثناء التصدير' : 'Failed to export study pack')
    }
  }

  // Import and restore from JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (!parsed.platform || !parsed.version) {
          throw new Error('Invalid format')
        }

        if (parsed.activeMajor) localStorage.setItem('al_azher_active_major_plan', parsed.activeMajor)
        if (parsed.weeklySchedule) localStorage.setItem('al_azher_weekly_schedule', parsed.weeklySchedule)
        if (parsed.gpaCalculator) localStorage.setItem('al_azher_saved_gpa_calc', parsed.gpaCalculator)
        if (parsed.flashcardsMastery) localStorage.setItem('al_azher_flashcards_mastery', parsed.flashcardsMastery)
        if (parsed.customFlashcards) localStorage.setItem('al_azher_custom_flashcards', parsed.customFlashcards)
        if (parsed.focusTasks) localStorage.setItem('al_azher_focus_tasks', parsed.focusTasks)

        if (parsed.curriculumProgress) {
          Object.entries(parsed.curriculumProgress).forEach(([k, v]) => {
            if (v) localStorage.setItem(k, v)
          })
        }

        if (parsed.lectureNotes) {
          Object.entries(parsed.lectureNotes).forEach(([k, v]) => {
            if (v) localStorage.setItem(k, v)
          })
        }

        toast.success(
          isArabic
            ? 'تم استرجاع بياناتك وملاحظاتك بنجاح! سيتم تحديث الصفحة لتطبيقها.'
            : 'Study pack restored successfully! Reloading...'
        )

        setTimeout(() => {
          window.location.reload()
        }, 1200)
      } catch (err) {
        toast.error(
          isArabic
            ? 'الملف غير صالح أو تالف. يرجى اختيار ملف حزمة صحيح (.json)'
            : 'Invalid or corrupt study pack file'
        )
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/10 space-y-6 bg-white dark:bg-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <FiHardDrive size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">
                {isArabic ? 'حزمة الدراسة أوفلاين والنسخ الاحتياطي' : 'Offline Study Pack & Backup'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                {isArabic ? 'احفظ بياناتك وملاحظاتك محلياً واسترجعها بدون إنترنت' : 'Export and restore your data locally'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-ink transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Offline Status Pill */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isOnline ? (
              <>
                <FiWifi className="text-emerald-500" size={16} />
                <span className="text-emerald-600 dark:text-emerald-400">{isArabic ? 'متصل بالإنترنت حالياً' : 'Online'}</span>
              </>
            ) : (
              <>
                <FiWifiOff className="text-amber-500" size={16} />
                <span className="text-amber-600 dark:text-amber-400">{isArabic ? 'تعمل في وضع الأوفلاين (Offline)' : 'Offline Mode'}</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">PWA Cache Ready</span>
        </div>

        {/* Action Buttons: Export & Import */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={handleExport}
            className="p-4 rounded-2xl border border-royal-500/20 bg-royal-500/10 hover:bg-royal-500/15 text-accent dark:text-cyan-400 flex flex-col items-center justify-center gap-2 transition text-center group"
          >
            <FiDownloadCloud size={24} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">{isArabic ? 'تحميل الحزمة (تصدير)' : 'Download Study Pack'}</span>
            <span className="text-[10px] text-slate-500 dark:text-white/60">
              {isArabic ? 'جدولك، ملاحظاتك، وسجل معدلك' : 'Schedule, notes, & GPA records'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl border border-white/10 glass hover:bg-black/5 dark:hover:bg-white/5 text-ink flex flex-col items-center justify-center gap-2 transition text-center group"
          >
            <FiUploadCloud size={24} className="group-hover:scale-110 transition-transform text-slate-400" />
            <span className="text-xs font-bold">{isArabic ? 'استرجاع حزمة سابقة' : 'Restore from Backup'}</span>
            <span className="text-[10px] text-slate-500 dark:text-white/60">
              {isArabic ? 'رفع ملف .json محفوظ مسبقاً' : 'Upload previous .json file'}
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Security / Privacy reassurance */}
        <div className="flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-white/60 pt-2">
          <FiShield className="text-emerald-500 shrink-0 mt-0.5" size={14} />
          <span>
            {isArabic
              ? 'الخصوصية التامة: يتم تخزين كافة الملاحظات وجداول المواد محلياً على جهازك ولا تتم مشاركتها مع أي جهة خارجية.'
              : '100% Local & Private: All study data is safely saved on your device.'}
          </span>
        </div>

      </div>
    </div>
  )
}
