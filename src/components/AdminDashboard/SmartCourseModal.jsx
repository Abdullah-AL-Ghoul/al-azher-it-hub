import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiCpu, FiPlus, FiCheck, FiX, FiLoader, FiList, FiTrash2, FiPlay, FiBookOpen } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { parseLecturesFromInput } from '../../utils/aiLectureParser'
import { addCourse, addLecture } from '../../services'
import LectureThumbnail from '../shared/LectureThumbnail'
import Modal from '../ui/Modal'

export default function SmartCourseModal({ isOpen, onClose, courses = [], isArabic = true, onRefresh }) {
  const [courseName, setCourseName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [isNewCourse, setIsNewCourse] = useState(true)
  const [rawLinks, setRawLinks] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsedLectures, setParsedLectures] = useState([])

  const handleAnalyze = async () => {
    if (!rawLinks.trim()) {
      toast.error(isArabic ? 'يرجى لصق روابط المحاضرات أولاً' : 'Please paste lecture links first')
      return
    }

    const effectiveSubject = isNewCourse 
      ? courseName.trim() 
      : courses.find(c => c.id === selectedCourseId)?.nameAr || courses.find(c => c.id === selectedCourseId)?.nameEn || ''

    if (!effectiveSubject && isNewCourse) {
      toast.error(isArabic ? 'يرجى إدخال اسم المادة' : 'Please enter course name')
      return
    }

    setAnalyzing(true)
    try {
      const items = await parseLecturesFromInput(rawLinks, effectiveSubject)
      if (items.length === 0) {
        toast.error(isArabic ? 'لم يتم العثور على روابط يوتيوب صالحة' : 'No valid YouTube links found')
      } else {
        // Automatically inject doctor name if provided by user
        const withDoctor = items.map(it => ({
          ...it,
          doctorAr: doctorName.trim() || it.doctorAr,
          doctorEn: doctorName.trim() || it.doctorEn,
        }))
        setParsedLectures(withDoctor)
        toast.success(isArabic ? `تم استخراج ${items.length} محاضرة بنجاح عبر AI` : `AI extracted ${items.length} lectures successfully`)
      }
    } catch (e) {
      toast.error(isArabic ? 'حدث خطأ أثناء معالجة الروابط' : 'Failed to analyze links')
    }
    setAnalyzing(false)
  }

  const handleSaveAll = async () => {
    if (parsedLectures.length === 0) return

    setSaving(true)
    try {
      let courseId = selectedCourseId
      const finalSubject = isNewCourse 
        ? courseName.trim() 
        : courses.find(c => c.id === selectedCourseId)?.nameAr || courses.find(c => c.id === selectedCourseId)?.nameEn || ''

      // If creating a new course, add it to DB first
      if (isNewCourse) {
        const newCourse = await addCourse({
          nameAr: courseName.trim(),
          nameEn: courseName.trim(),
          doctorAr: doctorName.trim(),
          doctorEn: doctorName.trim(),
          lectures: [],
          sources: [],
        })
        courseId = newCourse?.id || ''
      }

      // Add all parsed lectures
      let successCount = 0
      for (const lec of parsedLectures) {
        await addLecture({
          titleAr: lec.titleAr,
          titleEn: lec.titleEn,
          url: lec.url,
          videoId: lec.videoId,
          subjectAr: finalSubject,
          subjectEn: finalSubject,
          doctorAr: lec.doctorAr || doctorName.trim(),
          doctorEn: lec.doctorEn || doctorName.trim(),
          date: lec.date,
          sortOrder: lec.sortOrder,
          courseId: courseId || null,
        })
        successCount++
      }

      toast.success(isArabic 
        ? `تم إنشاء المادة وحفظ ${successCount} محاضرة بنجاح!` 
        : `Course created and ${successCount} lectures saved!`)

      setParsedLectures([])
      setRawLinks('')
      setCourseName('')
      setDoctorName('')
      onClose()
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(isArabic ? 'فشل حفظ بعض البيانات، يرجى المحاولة ثانية' : 'Failed to save lectures')
    }
    setSaving(false)
  }

  const removeLecture = (index) => {
    setParsedLectures(prev => prev.filter((_, i) => i !== index))
  }

  const updateTitle = (index, newTitle) => {
    setParsedLectures(prev => prev.map((item, i) => i === index ? { ...item, titleAr: newTitle, titleEn: newTitle } : item))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-line mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-academic-primary to-royal-600 flex items-center justify-center text-amber-300 shadow-md">
          <FiCpu size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">
            {isArabic ? 'المساعد الذكي: توليد مادة ومحاضرات تلقائياً' : 'AI Course & Lectures Auto-Generator'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-white/50">
            {isArabic 
              ? 'الصق روابط الفيديوهات وسيتولى الذكاء الاصطناعي استخراج العناوين والصور المصغرة وحفظها دفعة واحدة' 
              : 'Paste lecture video links and AI will automatically resolve titles, doctor, and thumbnails'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Course Selection Mode */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsNewCourse(true)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              isNewCourse 
                ? 'bg-royal-600 text-white border-royal-600 shadow-sm' 
                : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 border-transparent hover:border-line'
            }`}
          >
            {isArabic ? '✨ إنشاء مادة جديدة' : '✨ Create New Course'}
          </button>
          <button
            type="button"
            onClick={() => setIsNewCourse(false)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              !isNewCourse 
                ? 'bg-royal-600 text-white border-royal-600 shadow-sm' 
                : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 border-transparent hover:border-line'
            }`}
          >
            {isArabic ? '📚 إضافة لمادة موجودة' : '📚 Add to Existing Course'}
          </button>
        </div>

        {/* Inputs */}
        {isNewCourse ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-white/60 mb-1">
                {isArabic ? 'اسم المادة' : 'Course Name'} *
              </label>
              <input
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder={isArabic ? 'مثال: هياكل البيانات والخوارزميات' : 'e.g. Data Structures & Algorithms'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-white/60 mb-1">
                {isArabic ? 'اسم المحاضر / الدكتور' : 'Doctor / Instructor'}
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder={isArabic ? 'مثال: د. أحمد' : 'e.g. Dr. Ahmed'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/50"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-white/60 mb-1">
              {isArabic ? 'اختر المادة' : 'Select Course'} *
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/50"
            >
              <option value="">{isArabic ? '— اختر المادة —' : '— Select Course —'}</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.nameEn}</option>
              ))}
            </select>
          </div>
        )}

        {/* Bulk Links Area */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-white/60 mb-1">
            {isArabic 
              ? 'روابط المحاضرات (رابط في كل سطر أو عنوان متبوع برابط)' 
              : 'Lecture links (one per line or title followed by link)'} *
          </label>
          <textarea
            rows={5}
            value={rawLinks}
            onChange={e => setRawLinks(e.target.value)}
            placeholder={`https://www.youtube.com/watch?v=...\nالمحاضرة 2: القوائم المترابطة https://youtu.be/...\nhttps://www.youtube.com/live/...`}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/50 leading-relaxed"
          />
        </div>

        {/* Action Button: AI Analyze */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-academic-primary to-royal-600 hover:from-royal-700 hover:to-royal-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-royal-600/20"
          >
            {analyzing ? (
              <>
                <FiLoader className="animate-spin" size={14} />
                <span>{isArabic ? 'جاري التحليل واستخراج البيانات...' : 'Analyzing & Extracting...'}</span>
              </>
            ) : (
              <>
                <FiCpu size={14} className="text-amber-300" />
                <span>{isArabic ? 'تحليل الروابط وتوليد المحاضرات (AI)' : 'Analyze & Generate Lectures (AI)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Parsed Results Preview */}
        {parsedLectures.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FiList size={16} className="text-royal-600" />
                {isArabic ? `المحاضرات المستخرجة (${parsedLectures.length}):` : `Extracted Lectures (${parsedLectures.length}):`}
              </h3>
              <span className="text-xs text-slate-500 dark:text-white/50">
                {isArabic ? 'يمكنك تعديل العنوان أو حذف أي محاضرة قبل الحفظ' : 'You can edit titles or remove before saving'}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pe-1">
              {parsedLectures.map((lec, idx) => (
                <div key={lec.id || idx} className="flex items-center gap-3 p-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-line">
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                    <LectureThumbnail videoId={lec.videoId} thumbnail={lec.thumbnail} width={80} height={48} sizes="80px" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-5 h-5 bg-rose-500/80 rounded-full flex items-center justify-center text-white">
                        <FiPlay size={10} className="ms-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={lec.titleAr}
                      onChange={e => updateTitle(idx, e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-navy-800 border border-line rounded-lg text-xs font-semibold text-ink"
                    />
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-white/50">
                      <span>ID: {lec.videoId}</span>
                      {lec.doctorAr && <span>• {lec.doctorAr}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLecture(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                    title={isArabic ? 'حذف' : 'Remove'}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Final Save Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-navy-700 text-ink rounded-xl text-xs font-medium"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <FiLoader className="animate-spin" size={14} />
                    <span>{isArabic ? 'جاري الحفظ في قاعدة البيانات...' : 'Saving to Database...'}</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={14} />
                    <span>{isArabic ? `اعتماد وحفظ (${parsedLectures.length}) محاضرة` : `Approve & Save (${parsedLectures.length}) Lectures`}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
