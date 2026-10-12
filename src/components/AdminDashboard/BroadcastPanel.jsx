import { useState, useEffect, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiRadio, FiCheck, FiX, FiAlertTriangle, FiBell, FiAward, FiInfo, FiExternalLink, FiEye, FiZap, FiTrash2, FiSave } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { getBroadcast, saveBroadcastRemote, fetchBroadcastRemote, clearBroadcast, BROADCAST_TYPES } from '../../services/broadcast'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'

const PRESET_TEMPLATES = [
  {
    type: 'urgent',
    titleAr: 'تنبيه أكاديمي هام',
    titleEn: 'Important Academic Notice',
    messageAr: 'يرجى مراجعة جدول المحاضرات المعدل للأسبوع الحالي عبر بوابة المواد.',
    messageEn: 'Please review the updated lecture schedule for the current week via courses portal.',
    link: '/courses',
    linkTextAr: 'عرض المواد',
    linkTextEn: 'View Courses',
  },
  {
    type: 'academic',
    titleAr: 'إضافة تسجيلات ومصادر جديدة',
    titleEn: 'New Lectures & Materials Added',
    messageAr: 'تم تحديث كافة مراجع ومحاضرات الفصل الدراسي وإتاحتها لجميع الطلاب.',
    messageEn: 'All semester references and lecture recordings have been published.',
    link: '/lectures',
    linkTextAr: 'مشاهدة المحاضرات',
    linkTextEn: 'Watch Lectures',
  },
  {
    type: 'celebration',
    titleAr: 'أهلاً بكم في الفصل الدراسي الجديد',
    titleEn: 'Welcome to the New Academic Semester',
    messageAr: 'نتمنى لجميع طلاب وطالبات كلية تكنولوجيا المعلومات فصلاً حافلاً بالتميز والنجاح!',
    messageEn: 'Wishing all IT faculty students an inspiring and successful semester!',
    link: '/tools',
    linkTextAr: 'استكشف أدوات الطالب',
    linkTextEn: 'Explore Student Tools',
  },
  {
    type: 'info',
    titleAr: 'تحديث منصة الأزهر IT Hub',
    titleEn: 'Platform Update Notice',
    messageAr: 'تم إطلاق مركز أدوات الطالب المتكامل والمساعد الذكي لدعم دراستكم.',
    messageEn: 'Unified Student Tools Hub & AI Assistant are now live to support your learning.',
    link: '/tools',
    linkTextAr: 'فتح مركز الأدوات',
    linkTextEn: 'Open Tools Hub',
  },
]

function BroadcastPanel({ isArabic, onRefresh }) {
  const prefersReduced = useReducedMotion()
  const [current, setCurrent] = useState(() => getBroadcast() || {
    active: false,
    type: 'academic',
    titleAr: '',
    titleEn: '',
    messageAr: '',
    messageEn: '',
    link: '',
    linkTextAr: '',
    linkTextEn: '',
    dismissible: true,
    pinned: false,
  })

  const [form, setForm] = useState(current)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loaded = getBroadcast()
    if (loaded) {
      setCurrent(loaded)
      setForm(loaded)
    }
    fetchBroadcastRemote().then((remote) => {
      if (remote) {
        setCurrent(remote)
        setForm(remote)
      }
    }).catch(() => {})
  }, [])

  const handleApplyPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      type: preset.type,
      titleAr: preset.titleAr,
      titleEn: preset.titleEn,
      messageAr: preset.messageAr,
      messageEn: preset.messageEn,
      link: preset.link,
      linkTextAr: preset.linkTextAr,
      linkTextEn: preset.linkTextEn,
      active: true,
    }))
    toast.success(isArabic ? 'تم تطبيق القالب الجاهز' : 'Preset template applied')
  }

  const handleSave = async (publishState = null) => {
    if (!form.messageAr.trim() && !form.messageEn.trim() && !form.titleAr.trim()) {
      toast.error(isArabic ? 'يرجى كتابة نص الإعلان أو العنوان أولاً' : 'Please provide announcement text or title')
      return
    }

    setIsSaving(true)
    const toSave = {
      ...form,
      active: publishState !== null ? publishState : form.active,
    }

    const saved = await saveBroadcastRemote(toSave)
    setIsSaving(false)

    if (saved) {
      setCurrent(saved)
      setForm(saved)
      if (toSave.active) {
        toast.success(isArabic ? 'تم نشر الإعلان بنجاح في المنصة' : 'Announcement published live')
      } else {
        toast.success(isArabic ? 'تم حفظ مسودة الإعلان (غير نشط)' : 'Draft saved (inactive)')
      }
      if (onRefresh) onRefresh()
    } else {
      toast.error(isArabic ? 'فشل حفظ الإعلان' : 'Failed to save announcement')
    }
  }

  const handleClear = () => {
    clearBroadcast()
    const empty = {
      active: false,
      type: 'academic',
      titleAr: '',
      titleEn: '',
      messageAr: '',
      messageEn: '',
      link: '',
      linkTextAr: '',
      linkTextEn: '',
      dismissible: true,
      pinned: false,
    }
    setCurrent(empty)
    setForm(empty)
    toast.success(isArabic ? 'تم إيقاف وحذف الإعلان المنشور' : 'Broadcast removed and cleared')
    if (onRefresh) onRefresh()
  }

  const activeTypeConfig = BROADCAST_TYPES[form.type] || BROADCAST_TYPES.academic

  return (
    <motion.div
      variants={prefersReduced ? pageContainerReduced : pageContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header and Status */}
      <motion.div
        variants={prefersReduced ? pageItemReduced : pageItem}
        className="glass rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${form.active ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : 'bg-slate-400 dark:bg-slate-700'}`}>
            <FiRadio size={24} className={form.active ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">
                {isArabic ? 'نظام البث والإعلانات الموحدة' : 'Global Announcements & Broadcast System'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${current.active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                {current.active ? (isArabic ? 'مباشر ونشط في المنصة' : 'Live & Active') : (isArabic ? 'متوقف حالياً' : 'Inactive')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isArabic
                ? 'إرسال تنبيهات عاجلة، توجيهات أكاديمية، أو أخبار مهمة تظهر فوراً لجميع الطلاب في شريط علوي بارز'
                : 'Broadcast urgent alerts, academic announcements, or highlights directly to all students'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {current.active ? (
            <button
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
            >
              <FiX size={16} /> {isArabic ? 'إيقاف البث' : 'Pause Broadcast'}
            </button>
          ) : (
            <button
              onClick={() => handleSave(true)}
              className="btn-spatial flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
            >
              <FiZap size={16} /> {isArabic ? 'تفعيل ونشر فوراً' : 'Publish Live Now'}
            </button>
          )}

          {current.id && (
            <button
              onClick={handleClear}
              className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition border border-red-500/20"
              title={isArabic ? 'حذف الإعلان' : 'Clear Announcement'}
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Live Preview Section */}
      <motion.div
        variants={prefersReduced ? pageItemReduced : pageItem}
        className="glass rounded-2xl p-6 border border-white/10 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <FiEye className="text-royal-500" />
            <span>{isArabic ? 'معاينة حية لشريط الإعلان كما يظهر للطلبة' : 'Live Student Banner Preview'}</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 ">
            {isArabic ? 'تحديث فوري أثناء الكتابة' : 'Real-time interactive preview'}
          </span>
        </div>

        {/* The Banner Preview Box */}
        <div className={`rounded-xl p-3.5 border transition-all shadow-sm ${activeTypeConfig.bgLight} ${activeTypeConfig.bgDark}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`p-1.5 rounded-lg text-white shadow-xs ${activeTypeConfig.accent}`}>
                {form.type === 'urgent' && <FiAlertTriangle size={16} />}
                {form.type === 'academic' && <FiBell size={16} />}
                {form.type === 'celebration' && <FiAward size={16} />}
                {form.type === 'info' && <FiInfo size={16} />}
              </span>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${activeTypeConfig.accent}`}>
                  {isArabic ? activeTypeConfig.badgeAr : activeTypeConfig.badgeEn}
                </span>

                <span className="font-bold text-sm truncate">
                  {isArabic
                    ? (form.titleAr || form.titleEn || 'عنوان الإعلان التجريبي')
                    : (form.titleEn || form.titleAr || 'Announcement Title Preview')}
                </span>

                <span className="text-xs sm:text-sm opacity-90">
                  {isArabic
                    ? (form.messageAr || form.messageEn || 'نص رسالة الإعلان والتفاصيل التي ستظهر للطلبة...')
                    : (form.messageEn || form.messageAr || 'Announcement details message text preview...')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ms-auto">
              {form.link && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-black/40 shadow-xs">
                  <span>
                    {isArabic
                      ? (form.linkTextAr || 'عرض التفاصيل')
                      : (form.linkTextEn || 'View Details')}
                  </span>
                  <FiExternalLink size={12} />
                </span>
              )}

              {form.dismissible && !form.pinned && (
                <span className="p-1 rounded-lg opacity-70">
                  <FiX size={16} />
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Preset Templates */}
      <motion.div
        variants={prefersReduced ? pageItemReduced : pageItem}
        className="glass rounded-2xl p-6 border border-white/10 space-y-3"
      >
        <h3 className="text-sm font-bold text-ink">
          {isArabic ? 'قوالب ونماذج جاهزة بنقرة واحدة' : 'Quick One-Click Templates'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(tmpl)}
              className="text-start p-3 rounded-xl border border-white/10 bg-white/40 dark:bg-white/5 hover:border-royal-500/40 hover:bg-royal-500/5 transition group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${tmpl.type === 'urgent' ? 'bg-rose-500' : tmpl.type === 'celebration' ? 'bg-emerald-500' : 'bg-royal-500'}`} />
                <span className="text-xs font-bold text-ink group-hover:text-royal-500 transition">
                  {isArabic ? tmpl.titleAr : tmpl.titleEn}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {isArabic ? tmpl.messageAr : tmpl.messageEn}
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Broadcast Editor Form */}
      <motion.div
        variants={prefersReduced ? pageItemReduced : pageItem}
        className="glass rounded-2xl p-6 border border-white/10 space-y-5"
      >
        <h3 className="text-base font-bold text-ink">
          {isArabic ? 'تخصيص وضبط تفاصيل الإعلان' : 'Customize Broadcast Settings'}
        </h3>

        {/* Type selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            {isArabic ? 'نوع الإعلان والتأثير اللوني' : 'Announcement Type & Severity'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(BROADCAST_TYPES).map(([typeKey, cfg]) => {
              const selected = form.type === typeKey
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setForm({ ...form, type: typeKey })}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition ${
                    selected
                      ? 'border-royal-500 bg-royal-500/10 text-royal-600 dark:text-royal-300 ring-2 ring-royal-400/20'
                      : 'border-white/10 bg-white/30 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:border-white/30'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${cfg.accent}`} />
                  <span>{isArabic ? cfg.labelAr : cfg.labelEn}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Titles (Ar & En) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'عنوان الإعلان (بالعربية)' : 'Title (Arabic)'}
            </label>
            <input
              type="text"
              value={form.titleAr}
              onChange={e => setForm({ ...form, titleAr: e.target.value })}
              placeholder={isArabic ? 'مثال: تنبيه أكاديمي هام' : 'e.g. Important Notice'}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'عنوان الإعلان (بالإنجليزية)' : 'Title (English)'}
            </label>
            <input
              type="text"
              value={form.titleEn}
              onChange={e => setForm({ ...form, titleEn: e.target.value })}
              placeholder="e.g. Important Academic Update"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            />
          </div>
        </div>

        {/* Messages (Ar & En) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'نص وتفاصيل الإعلان (بالعربية) *' : 'Message Body (Arabic) *'}
            </label>
            <textarea
              rows={3}
              value={form.messageAr}
              onChange={e => setForm({ ...form, messageAr: e.target.value })}
              placeholder={isArabic ? 'اكتب التفاصيل الكاملة هنا لتظهر لجميع الطلاب...' : 'Full announcement text for students...'}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'نص وتفاصيل الإعلان (بالإنجليزية)' : 'Message Body (English)'}
            </label>
            <textarea
              rows={3}
              value={form.messageEn}
              onChange={e => setForm({ ...form, messageEn: e.target.value })}
              placeholder="Full announcement text in English..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 resize-none"
            />
          </div>
        </div>

        {/* Action Link & Button Text */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'رابط توجيه الزر (اختياري)' : 'Action Link URL (Optional)'}
            </label>
            <input
              type="text"
              value={form.link}
              onChange={e => setForm({ ...form, link: e.target.value })}
              placeholder="/courses أو https://..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'نص الزر (عربي)' : 'Button Text (Arabic)'}
            </label>
            <input
              type="text"
              value={form.linkTextAr}
              onChange={e => setForm({ ...form, linkTextAr: e.target.value })}
              placeholder="عرض التفاصيل"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isArabic ? 'نص الزر (إنجليزي)' : 'Button Text (English)'}
            </label>
            <input
              type="text"
              value={form.linkTextEn}
              onChange={e => setForm({ ...form, linkTextEn: e.target.value })}
              placeholder="View Details"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            />
          </div>
        </div>

        {/* Options: Dismissible / Pinned / Active */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/10">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded text-royal-600 focus:ring-royal-400 border-slate-300"
            />
            <span>{isArabic ? 'تفعيل الإعلان فور الحفظ' : 'Active immediately upon save'}</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.dismissible}
              onChange={e => setForm({ ...form, dismissible: e.target.checked })}
              className="w-4 h-4 rounded text-royal-600 focus:ring-royal-400 border-slate-300"
            />
            <span>{isArabic ? 'إتاحة إغلاق الإعلان للطالب (Dismissible)' : 'Allow students to dismiss'}</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={e => setForm({ ...form, pinned: e.target.checked })}
              className="w-4 h-4 rounded text-royal-600 focus:ring-royal-400 border-slate-300"
            />
            <span>{isArabic ? 'تثبيت إجباري (Pinned - لا يمكن إخفاؤه)' : 'Pinned (Always visible)'}</span>
          </label>
        </div>

        {/* Save & Publish Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="btn-spatial flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg"
          >
            <FiCheck size={16} />
            <span>{isArabic ? 'حفظ ونشر مباشر في المنصة' : 'Save & Publish Live'}</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="flex items-center gap-2 px-4 py-2.5 glass text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-sm font-medium transition"
          >
            <FiSave size={16} />
            <span>{isArabic ? 'حفظ كمسودة فقط' : 'Save as Draft'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default memo(BroadcastPanel)
