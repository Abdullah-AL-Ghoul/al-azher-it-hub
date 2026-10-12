import { useLanguage } from '../../context/LanguageContext'
import { 
  FiDownloadCloud, 
  FiHardDrive, 
  FiShield, 
  FiX, 
  FiWifi, 
  FiWifiOff,
  FiCheckCircle
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

export default function OfflineStudyPackModal({ isOpen, onClose }) {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Export student study data to local JSON file (Read-Only safe export)
  const handleExport = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        platform: 'Al-Azhar IT Hub',
        exportType: 'ReadOnly-Study-Summary',
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
      a.download = `al-azher-study-summary-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(
        isArabic
          ? 'تم تنزيل ملخص الدراسة بنجاح! الملف مخصص للمراجعة والقراءة بدون إنترنت.'
          : 'Study summary exported successfully!'
      )
    } catch {
      toast.error(isArabic ? 'حدث خطأ أثناء تنزيل الملخص' : 'Failed to export study summary')
    }
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
                {isArabic ? 'ملخص المذاكرة والعمل بدون إنترنت (PWA)' : 'Offline Study Summary & PWA'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                {isArabic ? 'تصدير آمن للقراءة فقط لمراجعة ملاحظاتك وجدولك بدون إنترنت' : 'Secure read-only export of your study notes and schedule'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-ink transition cursor-pointer"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
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

        {/* Action Button: Safe Read-Only Export */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExport}
            className="w-full p-4 rounded-2xl border border-royal-500/20 bg-royal-500/10 hover:bg-royal-500/15 text-accent dark:text-cyan-400 flex items-center justify-center gap-3 transition text-center group cursor-pointer"
          >
            <FiDownloadCloud size={24} className="group-hover:scale-110 transition-transform shrink-0" />
            <div className="text-right">
              <span className="text-xs font-bold block">{isArabic ? 'تنزيل ملخص المذاكرة (تصدير آمن)' : 'Download Study Summary'}</span>
              <span className="text-[10px] text-slate-500 dark:text-white/60 block">
                {isArabic ? 'جدولك، ملاحظاتك، وسجل معدلك للقراءة دون اتصال' : 'Schedule, notes, & GPA records for offline reading'}
              </span>
            </div>
          </button>
        </div>

        {/* Security Reassurance / Zero Uploads Policy */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <FiShield size={15} />
            <span>{isArabic ? 'حماية فائقة لقاعدة البيانات' : 'Strict Database Protection'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {isArabic
              ? 'التصدير للقراءة فقط محلياً على جهازك. تم إيقاف رفع أو استيراد أي ملفات خارجية منعاً لأي ثغرات أو محاولات حقن لقاعدة البيانات، وضماناً لسلامة حسابات الطلبة.'
              : 'Export is strictly read-only on your local device. External file uploads and imports are completely disabled to guarantee database integrity and student account safety.'}
          </p>
        </div>

      </div>
    </div>
  )
}
