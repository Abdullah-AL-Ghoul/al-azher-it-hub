import { useState, useMemo, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiBook, FiUsers, FiActivity, FiGrid, FiX, FiSave, FiUpload, FiFile, FiFileText, FiLogIn, FiTrash2, FiCheck, FiLoader, FiAlertCircle, FiYoutube, FiDownload, FiVideo } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { addCourse, updateCourse, addLecture, updateLecture, addSource, updateSource } from '../../services'
import { useFileUpload } from '../../hooks/useFileUpload'
import { formatBytes, ACCEPTED_MIME_TYPES } from '../../services/sourceStorage'
import { extractYouTubeId, lectureThumb } from '../../utils/helpers'
import CoursesTable from './CoursesTable'
import LecturesTable from './LecturesTable'
import SourcesTable from './SourcesTable'
import UsersTable from './UsersTable'
import ActivityLogs from './ActivityLogs'
import StudentLogs from './StudentLogs'
import SettingsPanel from './SettingsPanel'
import CrudForm from './CrudForm'
import FormField from './FormField'
import FormActions from './FormActions'
import { INPUT_CLASS, exportToJson } from '../../utils/adminShared'

export default memo(function AdminDashboardContent({
 courses,
 lectures,
 sources,
 users = [],
 activityLogs = [],
 studentLogs = [],
 additions = [],
 studyPlan = {},
 roadmap = [],
 loading,
 isArabic,
 selectedTab = 'overview',
 onRefresh,
 onNavigate
}) {
 const prefersReduced = useReducedMotion()
 const [showCourseForm, setShowCourseForm] = useState(false)
 const [editingCourseId, setEditingCourseId] = useState(null)
 const [courseForm, setCourseForm] = useState({ nameAr: '', nameEn: '', doctorAr: '', doctorEn: '' })
 const courseFormRef = useRef(null)

 const [showLectureForm, setShowLectureForm] = useState(false)
 const [editingLectureId, setEditingLectureId] = useState(null)
 const [lectureForm, setLectureForm] = useState({ titleAr: '', titleEn: '', url: '', date: new Date().toISOString().slice(0, 10), subjectAr: '', subjectEn: '', videoId: '', sortOrder: 0, doctorAr: '', doctorEn: '' })
 const [lectureCourseId, setLectureCourseId] = useState('')
 const [lectureCustomSubject, setLectureCustomSubject] = useState(false)
 const lectureFormRef = useRef(null)

 const [showSourceForm, setShowSourceForm] = useState(false)
 const [editingSourceId, setEditingSourceId] = useState(null)
 const [sourceForm, setSourceForm] = useState({ titleAr: '', titleEn: '', url: '', subjectAr: '', subjectEn: '', fileData: null, fileName: '', files: [] })
 const sourceFormRef = useRef(null)
 const sourceFileRef = useRef(null)
 const sourceUpload = useFileUpload()

 const scrollToForm = useCallback((ref) => {
  setTimeout(() => {
   ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 100)
 }, [])

 const handleEditCourse = (course) => {
  setCourseForm({ nameAr: course.nameAr || '', nameEn: course.nameEn || '', doctorAr: course.doctorAr || '', doctorEn: course.doctorEn || '' })
  setEditingCourseId(course.id)
  setShowCourseForm(true)
  scrollToForm(courseFormRef)
 }

 const handleEditLecture = (lecture) => {
  setLectureForm({ titleAr: lecture.titleAr || '', titleEn: lecture.titleEn || '', url: lecture.url || '', date: lecture.date || new Date().toISOString().slice(0, 10), subjectAr: lecture.subjectAr || '', subjectEn: lecture.subjectEn || '', videoId: lecture.videoId || extractYouTubeId(lecture.url) || '', sortOrder: lecture.sortOrder || 0, doctorAr: lecture.doctorAr || '', doctorEn: lecture.doctorEn || '' })
  const matchedCourse = courses.find(c =>
   (c.nameAr && c.nameAr === lecture.subjectAr) ||
   (c.nameEn && c.nameEn === lecture.subjectEn)
  )
  if (matchedCourse) {
   setLectureCourseId(matchedCourse.id)
   setLectureCustomSubject(false)
  } else if (lecture.subjectAr || lecture.subjectEn) {
   setLectureCourseId('__custom__')
   setLectureCustomSubject(true)
  } else {
   setLectureCourseId('')
   setLectureCustomSubject(false)
  }
  setEditingLectureId(lecture.id)
  setShowLectureForm(true)
  scrollToForm(lectureFormRef)
 }

 const handleEditSource = (source) => {
  const existingFiles = source.files || (source.fileData ? [{ name: source.fileName, url: source.fileData, path: source.filePath, size: 0, mimeType: '' }] : [])
  setSourceForm({
   titleAr: source.titleAr || '', titleEn: source.titleEn || '',
   url: source.url || '', subjectAr: source.subjectAr || '', subjectEn: source.subjectEn || '',
   fileData: source.fileData || null, fileName: source.fileName || '',
   files: existingFiles
  })
  sourceUpload.setFiles(existingFiles)
  setEditingSourceId(source.id)
  setShowSourceForm(true)
  scrollToForm(sourceFormRef)
 }

 const saveCourse = async () => {
  if (!courseForm.nameAr && !courseForm.nameEn) {
   toast.error(isArabic ? 'أدخل اسم المادة' : 'Enter course name')
   return
  }
  try {
   if (editingCourseId) {
    await updateCourse(editingCourseId, courseForm)
    toast.success(isArabic ? 'تم تحديث المادة' : 'Course updated')
   } else {
    await addCourse({ ...courseForm, lectures: [], sources: [] })
    toast.success(isArabic ? 'تم إنشاء المادة' : 'Course created')
   }
   setCourseForm({ nameAr: '', nameEn: '', doctorAr: '', doctorEn: '' })
   setEditingCourseId(null)
   setShowCourseForm(false)
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل حفظ المادة' : 'Failed to save course')
  }
 }

 const saveLecture = async () => {
  if (!lectureForm.titleAr && !lectureForm.titleEn) {
   toast.error(isArabic ? 'أدخل عنوان المحاضرة' : 'Enter lecture title')
   return
  }
  try {
   const data = { ...lectureForm }
   const videoId = extractYouTubeId(lectureForm.url)
   if (videoId) data.videoId = videoId
   if (lectureCourseId && lectureCourseId !== '__custom__') data.courseId = lectureCourseId
   if (editingLectureId) {
    await updateLecture(editingLectureId, data)
    toast.success(isArabic ? 'تم تحديث المحاضرة' : 'Lecture updated')
   } else {
    await addLecture(data)
    toast.success(isArabic ? 'تم إنشاء المحاضرة' : 'Lecture created')
   }
   setLectureForm({ titleAr: '', titleEn: '', url: '', date: new Date().toISOString().slice(0, 10), subjectAr: '', subjectEn: '', videoId: '', sortOrder: 0, doctorAr: '', doctorEn: '' })
   setLectureCourseId('')
   setLectureCustomSubject(false)
   setEditingLectureId(null)
   setShowLectureForm(false)
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل حفظ المحاضرة' : 'Failed to save lecture')
  }
 }

 const saveSource = async () => {
  if (!sourceForm.titleAr && !sourceForm.titleEn) {
   toast.error(isArabic ? 'أدخل عنوان المصدر' : 'Enter source title')
   return
  }
  if (!sourceForm.url && sourceUpload.files.length === 0 && !sourceForm.fileData) {
   toast.error(isArabic ? 'أدخل رابط أو ارفع ملف' : 'Enter a URL or upload at least one file')
   return
  }
  if (sourceUpload.uploading) {
   toast.error(isArabic ? 'انتظر حتى ينتهي الرفع' : 'Please wait for uploads to finish')
   return
  }
  try {
   const uploadedFiles = sourceUpload.files || []
   const hasFiles = uploadedFiles.length > 0
   const data = {
    ...sourceForm,
    files: uploadedFiles,
    fileData: hasFiles ? uploadedFiles[0].url : (editingSourceId ? null : (sourceForm.fileData || null)),
    fileName: hasFiles ? uploadedFiles[0].name : (editingSourceId ? null : (sourceForm.fileName || null)),
    filePath: hasFiles ? uploadedFiles[0].path : (editingSourceId ? null : (sourceForm.filePath || null)),
   }
   if (editingSourceId) {
    await updateSource(editingSourceId, data)
    toast.success(isArabic ? 'تم تحديث المصدر' : 'Source updated')
   } else {
    await addSource(data)
    toast.success(isArabic ? 'تم إنشاء المصدر' : 'Source created')
   }
   setSourceForm({ titleAr: '', titleEn: '', url: '', subjectAr: '', subjectEn: '', fileData: null, fileName: '', files: [] })
   sourceUpload.reset()
   setEditingSourceId(null)
   setShowSourceForm(false)
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل حفظ المصدر' : 'Failed to save source')
  }
 }

 const handleSourceFiles = async (e) => {
  const fileList = e.target.files
  if (!fileList?.length) return
  await sourceUpload.uploadFiles(fileList, isArabic)
  e.target.value = ''
 }

 const overviewStats = useMemo(() => ({
  totalCourses: courses.length,
  totalLectures: lectures.length,
  totalSources: sources.length,
  activeUsers: users.filter(u => u.role === 'student').length,
  totalLogins: studentLogs.filter(l => l.type === 'LOGIN').length
 }), [courses, lectures, sources, users, studentLogs])

 return (
  <div className="space-y-6">
   {/* ========== COURSES TAB ========== */}
   {selectedTab === 'courses' && (
    <div className="space-y-4">
     <CrudForm
      show={showCourseForm}
      formRef={courseFormRef}
      title={editingCourseId
       ? (isArabic ? 'تعديل المادة' : 'Edit Course')
       : (isArabic ? 'إضافة مادة جديدة' : 'Add New Course')}
      onClose={() => { setShowCourseForm(false); setEditingCourseId(null) }}
      isArabic={isArabic}
     >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <FormField
        label={isArabic ? 'الاسم (عربي)' : 'Name (AR)'}
        value={courseForm.nameAr}
        onChange={e => setCourseForm({ ...courseForm, nameAr: e.target.value })}
        placeholder={isArabic ? 'اسم المادة بالعربي' : 'Course name in Arabic'}
       />
       <FormField
        label={isArabic ? 'الاسم (إنجليزي)' : 'Name (EN)'}
        value={courseForm.nameEn}
        onChange={e => setCourseForm({ ...courseForm, nameEn: e.target.value })}
        placeholder="Course name in English"
       />
       <FormField
        label={isArabic ? 'الدكتور (عربي)' : 'Doctor (AR)'}
        value={courseForm.doctorAr}
        onChange={e => setCourseForm({ ...courseForm, doctorAr: e.target.value })}
        placeholder={isArabic ? 'اسم الدكتور' : 'Doctor name in Arabic'}
       />
       <FormField
        label={isArabic ? 'الدكتور (إنجليزي)' : 'Doctor (EN)'}
        value={courseForm.doctorEn}
        onChange={e => setCourseForm({ ...courseForm, doctorEn: e.target.value })}
        placeholder="Doctor name in English"
       />
      </div>
      <FormActions
       onSave={saveCourse}
       onCancel={() => { setShowCourseForm(false); setEditingCourseId(null) }}
       isEditing={!!editingCourseId}
       isArabic={isArabic}
      />
     </CrudForm>

     <CoursesTable
      courses={courses}
      loading={loading}
      isArabic={isArabic}
      onEdit={handleEditCourse}
      onAdd={() => {
       setCourseForm({ nameAr: '', nameEn: '', doctorAr: '', doctorEn: '' })
       setEditingCourseId(null)
       setShowCourseForm(true)
       scrollToForm(courseFormRef)
      }}
      onRefresh={onRefresh}
     />
    </div>
   )}

   {/* ========== LECTURES TAB ========== */}
   {selectedTab === 'lectures' && (
    <div className="space-y-4">
     <CrudForm
      show={showLectureForm}
      formRef={lectureFormRef}
      title={editingLectureId
       ? (isArabic ? 'تعديل المحاضرة' : 'Edit Lecture')
       : (isArabic ? 'إضافة محاضرة جديدة' : 'Add New Lecture')}
      onClose={() => { setShowLectureForm(false); setEditingLectureId(null) }}
      isArabic={isArabic}
     >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="md:col-span-2">
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'المادة' : 'Course / Subject'}</label>
        {!lectureCustomSubject ? (
         <div className="flex gap-2">
          <select
           value={lectureCourseId}
           onChange={e => {
            const cid = e.target.value
            setLectureCourseId(cid)
            if (cid === '__custom__') {
             setLectureCustomSubject(true)
             setLectureForm({ ...lectureForm, subjectAr: '', subjectEn: '' })
            } else {
             const course = courses.find(c => c.id === cid)
             if (course) {
              setLectureForm({ ...lectureForm, subjectAr: course.nameAr || '', subjectEn: course.nameEn || '' })
             }
            }
           }}
           className={INPUT_CLASS}
          >
           <option value="">{isArabic ? 'اختر المادة...' : 'Select course...'}</option>
           {courses.map(c => (
            <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.nameEn}</option>
           ))}
           <option value="__custom__">{isArabic ? '...أخرى (كتابة يدوية)' : '...Other (custom)'}</option>
          </select>
         </div>
        ) : (
         <div className="space-y-2">
          <div className="flex gap-2">
           <input
            value={lectureForm.subjectAr}
            onChange={e => setLectureForm({ ...lectureForm, subjectAr: e.target.value })}
            className={INPUT_CLASS}
            placeholder={isArabic ? 'اسم المادة (عربي)' : 'Subject name (AR)'}
           />
           <input
            value={lectureForm.subjectEn}
            onChange={e => setLectureForm({ ...lectureForm, subjectEn: e.target.value })}
            className={INPUT_CLASS}
            placeholder={isArabic ? 'اسم المادة (إنجليزي)' : 'Subject name (EN)'}
           />
           <button
            onClick={() => { setLectureCustomSubject(false); setLectureCourseId('') }}
            className="px-3 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm transition flex-shrink-0"
            title={isArabic ? 'رجوع للقائمة' : 'Back to list'}
           >
            <FiX size={14} />
           </button>
          </div>
         </div>
        )}
        {lectureForm.subjectAr && (
         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isArabic ? 'المادة:' : 'Subject:'} {isArabic ? lectureForm.subjectAr : lectureForm.subjectEn}
         </p>
        )}
       </div>
       <FormField
        label={isArabic ? 'العنوان (عربي)' : 'Title (AR)'}
        value={lectureForm.titleAr}
        onChange={e => setLectureForm({ ...lectureForm, titleAr: e.target.value })}
        placeholder={isArabic ? 'عنوان المحاضرة' : 'Lecture title in Arabic'}
       />
<FormField
         label={isArabic ? 'العنوان (إنجليزي)' : 'Title (EN)'}
         value={lectureForm.titleEn}
         onChange={e => setLectureForm({ ...lectureForm, titleEn: e.target.value })}
         placeholder="Lecture title in English"
        />
        <div className="md:col-span-2 space-y-2">
         <FormField
          label={isArabic ? 'رابط الفيديو' : 'Video URL'}
          value={lectureForm.url}
          onChange={e => {
           const url = e.target.value
           const vid = url ? extractYouTubeId(url) : null
           setLectureForm({ ...lectureForm, url, videoId: vid || (url ? lectureForm.videoId : '') })
          }}
          placeholder="https://..."
         />
         {lectureForm.videoId && (
          <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
           <img src={lectureThumb(lectureForm.videoId, 'mq')} alt="" width="120" height="68" className="rounded-lg object-cover flex-shrink-0" />
           <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
             <FiYoutube size={14} /> {isArabic ? 'تم التعرف على الفيديو' : 'Video detected'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">ID: {lectureForm.videoId}</p>
           </div>
          </div>
         )}
         {lectureForm.url && !lectureForm.videoId && (
          <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
           <FiAlertCircle size={12} /> {isArabic ? 'رابط يوتيوب غير صالح، لن تظهر صورة مصغّرة' : 'Invalid YouTube URL, thumbnail will not appear'}
          </p>
         )}
        </div>
        <FormField
         label={isArabic ? 'التاريخ' : 'Date'}
         type="date"
         value={lectureForm.date}
         onChange={e => setLectureForm({ ...lectureForm, date: e.target.value })}
        />
        <FormField
         label={isArabic ? 'الترتيب (الأصغر أولاً)' : 'Order (smaller first)'}
         type="number"
         value={lectureForm.sortOrder}
         onChange={e => setLectureForm({ ...lectureForm, sortOrder: parseInt(e.target.value) || 0 })}
         placeholder="0"
        />
        <FormField
         label={isArabic ? 'الدكتور (عربي)' : 'Doctor (AR)'}
         value={lectureForm.doctorAr}
         onChange={e => setLectureForm({ ...lectureForm, doctorAr: e.target.value })}
         placeholder={isArabic ? 'اسم الدكتور' : 'Doctor name'}
        />
        <FormField
         label={isArabic ? 'الدكتور (إنجليزي)' : 'Doctor (EN)'}
         value={lectureForm.doctorEn}
         onChange={e => setLectureForm({ ...lectureForm, doctorEn: e.target.value })}
         placeholder="Doctor name in English"
        />
      </div>
      <FormActions
       onSave={saveLecture}
       onCancel={() => { setShowLectureForm(false); setEditingLectureId(null) }}
       isEditing={!!editingLectureId}
       isArabic={isArabic}
      />
     </CrudForm>

     <LecturesTable
      lectures={lectures}
      courses={courses}
      loading={loading}
      isArabic={isArabic}
      onEdit={handleEditLecture}
      onAdd={() => {
   setLectureForm({ titleAr: '', titleEn: '', url: '', date: new Date().toISOString().slice(0, 10), subjectAr: '', subjectEn: '', videoId: '', sortOrder: 0, doctorAr: '', doctorEn: '' })
       setLectureCourseId('')
       setLectureCustomSubject(false)
       setEditingLectureId(null)
       setShowLectureForm(true)
       scrollToForm(lectureFormRef)
      }}
      onRefresh={onRefresh}
     />
    </div>
   )}

   {/* ========== SOURCES TAB ========== */}
   {selectedTab === 'sources' && (
    <div className="space-y-4">
     <CrudForm
      show={showSourceForm}
      formRef={sourceFormRef}
      title={editingSourceId
       ? (isArabic ? 'تعديل المصدر' : 'Edit Source')
       : (isArabic ? 'إضافة مصدر جديد' : 'Add New Source')}
      onClose={() => { setShowSourceForm(false); setEditingSourceId(null) }}
      isArabic={isArabic}
     >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <FormField
        label={isArabic ? 'المادة (عربي)' : 'Subject (AR)'}
        value={sourceForm.subjectAr}
        onChange={e => setSourceForm({ ...sourceForm, subjectAr: e.target.value })}
        placeholder={isArabic ? 'اسم المادة' : 'Subject name'}
       />
       <FormField
        label={isArabic ? 'المادة (إنجليزي)' : 'Subject (EN)'}
        value={sourceForm.subjectEn}
        onChange={e => setSourceForm({ ...sourceForm, subjectEn: e.target.value })}
        placeholder="Subject name"
       />
       <FormField
        label={isArabic ? 'العنوان (عربي)' : 'Title (AR)'}
        value={sourceForm.titleAr}
        onChange={e => setSourceForm({ ...sourceForm, titleAr: e.target.value })}
        placeholder={isArabic ? 'عنوان المصدر' : 'Source title'}
       />
       <FormField
        label={isArabic ? 'العنوان (إنجليزي)' : 'Title (EN)'}
        value={sourceForm.titleEn}
        onChange={e => setSourceForm({ ...sourceForm, titleEn: e.target.value })}
        placeholder="Source title"
       />
       <FormField
        label={isArabic ? 'الرابط' : 'URL'}
        value={sourceForm.url}
        onChange={e => setSourceForm({ ...sourceForm, url: e.target.value })}
        placeholder="https://..."
        className="md:col-span-2"
        disabled={sourceUpload.files.length > 0}
       />
       <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
         {isArabic ? 'ارفع ملف أو عدة ملفات (PDF, صور, ZIP - حد أقصى 100MB لكل ملف)' : 'Upload one or more files (PDF, images, ZIP - max 100MB each)'}
        </label>
        <input
         ref={sourceFileRef}
         type="file"
         multiple
         accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
         onChange={handleSourceFiles}
         className="hidden"
        />

        {sourceUpload.uploading && (
         <div className="flex items-center gap-2 mb-2 text-royal-500 text-sm">
          <FiLoader size={14} className="animate-spin" />
          {isArabic ? 'جاري الرفع...' : 'Uploading...'}
         </div>
        )}

        {sourceUpload.files.length > 0 ? (
         <div className="space-y-2 mt-2">
          {sourceUpload.files.map((f, idx) => {
           const p = sourceUpload.progress[f.name]
           const status = p?.status || 'success'
           const pct = p?.progress || 100
           return (
            <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
             <FiFile size={16} className="text-emerald-500 flex-shrink-0" />
             <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
               <span className="text-sm text-emerald-700 dark:text-emerald-400 truncate">{f.name}</span>
               <span className="text-xs text-slate-500 flex-shrink-0">{formatBytes(f.size || 0)}</span>
              </div>
              {status === 'uploading' && (
               <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-royal-500 transition" style={{ width: `${pct}%` }} />
               </div>
              )}
             </div>
             {status === 'success' && <FiCheck size={14} className="text-emerald-500 flex-shrink-0" />}
             {status === 'failed' && <FiAlertCircle size={14} className="text-rose-500 flex-shrink-0" />}
             <button
              type="button"
              onClick={() => sourceUpload.removeFile(idx)}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded text-rose-500 flex-shrink-0"
              aria-label={isArabic ? 'حذف' : 'Remove'}
             >
              <FiTrash2 size={14} />
             </button>
            </div>
           )
          })}
          <button
           type="button"
           onClick={() => sourceFileRef.current?.click()}
           disabled={sourceUpload.uploading}
           className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-royal-400 hover:text-royal-500 transition-colors text-sm disabled:opacity-50"
          >
           <FiUpload size={14} /> {isArabic ? 'إضافة ملف آخر' : 'Add another file'}
          </button>
         </div>
        ) : (
         <button
          type="button"
          onClick={() => sourceFileRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-royal-400 hover:text-royal-500 transition-colors text-sm"
         >
          <FiUpload size={20} />
          <span>{isArabic ? 'اسحب الملفات أو اضغط للاختيار' : 'Drop files or click to select'}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">PDF, JPG, PNG, ZIP, DOC (max 100MB)</span>
         </button>
        )}
       </div>
      </div>
      <FormActions
       onSave={saveSource}
       onCancel={() => { setShowSourceForm(false); setEditingSourceId(null) }}
       isEditing={!!editingSourceId}
       isArabic={isArabic}
      />
     </CrudForm>

     <SourcesTable
      sources={sources}
      loading={loading}
      isArabic={isArabic}
      onEdit={handleEditSource}
      onAdd={() => {
       setSourceForm({ titleAr: '', titleEn: '', url: '', subjectAr: '', subjectEn: '', fileData: null, fileName: '', files: [] })
       sourceUpload.reset()
       setEditingSourceId(null)
       setShowSourceForm(true)
       scrollToForm(sourceFormRef)
      }}
      onRefresh={onRefresh}
     />
    </div>
   )}

   {/* ========== USERS TAB ========== */}
   {selectedTab === 'users' && (
    <div className="glass rounded-xl p-6 border border-white/10">
     <UsersTable
      users={users}
      loading={loading}
      isArabic={isArabic}
      onRefresh={onRefresh}
     />
    </div>
   )}

   {/* ========== ACTIVITY TAB ========== */}
   {selectedTab === 'activity' && (
    <div className="glass rounded-xl p-6 border border-white/10">
     <ActivityLogs
      logs={activityLogs}
      loading={loading}
      isArabic={isArabic}
      onRefresh={onRefresh}
     />
    </div>
   )}

   {/* ========== STUDENT LOGS TAB ========== */}
   {selectedTab === 'studentLogs' && (
    <div className="glass rounded-xl p-6 border border-white/10">
     <StudentLogs
      logs={studentLogs}
      users={users}
      loading={loading}
      isArabic={isArabic}
     />
    </div>
   )}

   {/* ========== SETTINGS TAB ========== */}
   {selectedTab === 'settings' && (
    <div className="glass rounded-xl p-6 border border-white/10">
     <SettingsPanel
      additions={additions}
      studyPlan={studyPlan}
      roadmap={roadmap}
      loading={loading}
      isArabic={isArabic}
      onRefresh={onRefresh}
     />
    </div>
   )}

   {/* ========== OVERVIEW TAB ========== */}
   {selectedTab === 'overview' && (
    <>
     {/* Quick Actions */}
     <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} className="flex flex-wrap gap-3 mb-6 items-center">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{isArabic ? 'إجراءات سريعة:' : 'Quick actions:'}</span>
      <button onClick={() => onNavigate('lectures')} className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition">
       <FiVideo size={14} /> {isArabic ? 'إدارة المحاضرات' : 'Manage lectures'}
      </button>
      <button onClick={() => onNavigate('courses')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
       <FiBook size={14} /> {isArabic ? 'إدارة المواد' : 'Manage courses'}
      </button>
      <button onClick={() => onNavigate('sources')} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition">
       <FiGrid size={14} /> {isArabic ? 'إدارة المصادر' : 'Manage sources'}
      </button>
      <button onClick={() => onNavigate('users')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition">
       <FiUsers size={14} /> {isArabic ? 'الطلاب' : 'Students'}
      </button>
      <button onClick={() => exportToJson('al-azher-backup', t)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition">
       <FiDownload size={14} /> {isArabic ? 'نسخة احتياطية' : 'Backup'}
      </button>
     </motion.div>

     {/* Stats */}
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[
       { value: overviewStats.totalCourses, label: isArabic ? 'المواد' : 'Courses', icon: FiBook, gradient: 'from-emerald-500 to-emerald-600', delay: 0 },
       { value: overviewStats.totalLectures, label: isArabic ? 'المحاضرات' : 'Lectures', icon: FiActivity, gradient: 'from-violet-500 to-violet-600', delay: 0.08 },
       { value: overviewStats.totalSources, label: isArabic ? 'المصادر' : 'Sources', icon: FiGrid, gradient: 'from-cyan-500 to-cyan-600', delay: 0.16 },
       { value: overviewStats.activeUsers, label: isArabic ? 'العدد الحقيقي للطلاب' : 'Real Students', icon: FiUsers, gradient: 'from-amber-500 to-amber-600', delay: 0.24 },
       { value: overviewStats.totalLogins, label: isArabic ? 'تسجيلات الدخول' : 'Total Logins', icon: FiLogIn, gradient: 'from-rose-500 to-rose-600', delay: 0.32 },
      ].map((stat, i) => {
       const Icon = stat.icon
       return (
        <motion.div
         key={i}
         initial={prefersReduced ? {} : { opacity: 0, x: i % 2 === 0 ? 50 : -50, scale: 0.85 }}
         animate={prefersReduced ? {} : { opacity: 1, x: 0, scale: 1 }}
         transition={prefersReduced ? {} : { duration: 0.7, delay: stat.delay, type: 'spring', stiffness: 150, damping: 15 }}
         whileHover={prefersReduced ? {} : { scale: 1.04, y: -6 }}
         className="glass rounded-2xl p-5 border border-white/10 hover:border-royal-500/30 transition group cursor-default"
        >
         <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
           <Icon size={24} />
          </div>
          <div>
           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{stat.label}</p>
           <motion.p
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.3 }}
            animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
            transition={prefersReduced ? {} : { duration: 0.8, delay: stat.delay + 0.2, type: 'spring', stiffness: 120 }}
            className="text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight"
           >
            {stat.value}
           </motion.p>
          </div>
         </div>
        </motion.div>
       )
})}
      </div>

      {/* Lectures per course mini bar chart */}
      {courses.length > 0 && (
       <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5 border border-white/10 mt-6">
        <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-4">{isArabic ? 'المحاضرات حسب المادة' : 'Lectures per course'}</h3>
        <div className="space-y-2.5">
         {courses.slice(0, 8).map(c => {
          const count = lectures.filter(l => l.courseId === c.id || l.subjectAr === c.nameAr || l.subjectEn === c.nameEn).length
          const max = Math.max(1, ...courses.slice(0, 8).map(cc => lectures.filter(l => l.courseId === cc.id || l.subjectAr === cc.nameAr || l.subjectEn === cc.nameEn).length))
          const pct = Math.round((count / max) * 100)
          return (
           <div key={c.id} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-28 truncate flex-shrink-0">{isArabic ? c.nameAr : c.nameEn}</span>
            <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5, ease: [0.16,1,0.3,1] }} className="h-full rounded-full bg-gradient-to-r from-royal-500 to-cyan-500" />
            </div>
            <span className="text-xs font-medium text-navy-900 dark:text-white w-8 text-right tabular-nums">{count}</span>
           </div>
          )
         })}
        </div>
       </motion.div>
      )}

      {/* Recent activity + recent additions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
       <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
         <h3 className="text-sm font-bold text-navy-900 dark:text-white">{isArabic ? 'آخر النشاطات' : 'Recent activity'}</h3>
         <FiActivity size={14} className="text-slate-400" />
        </div>
        {activityLogs.length === 0 ? (
         <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{isArabic ? 'لا توجد نشاطات بعد' : 'No activity yet'}</p>
        ) : (
         <ul className="space-y-2.5">
          {activityLogs.slice(0, 6).map(log => (
           <li key={log.id} className="flex items-start gap-3">
            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.action === 'ADD' ? 'bg-emerald-400' : log.action === 'DELETE' ? 'bg-rose-400' : 'bg-cyan-400'}`} />
            <div className="min-w-0 flex-1">
             <p className="text-xs text-navy-900 dark:text-white truncate">
              <span className="font-semibold">{log.action === 'ADD' ? (isArabic ? 'إضافة' : 'Add') : log.action === 'DELETE' ? (isArabic ? 'حذف' : 'Delete') : (isArabic ? 'تحديث' : 'Update')}</span>
              {' '}<span className="text-slate-500 dark:text-slate-400">{log.detail}</span>
             </p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {log.timestamp ? new Date(log.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
             </p>
            </div>
           </li>
          ))}
         </ul>
        )}
       </motion.div>

       <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
         <h3 className="text-sm font-bold text-navy-900 dark:text-white">{isArabic ? 'آخر الإضافات' : 'Recent additions'}</h3>
         <FiFileText size={14} className="text-slate-400" />
        </div>
        {additions.length === 0 ? (
         <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{isArabic ? 'لا توجد إضافات بعد' : 'No additions yet'}</p>
        ) : (
         <ul className="space-y-2.5">
          {additions.slice(0, 6).map(a => (
           <li key={a.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
             <FiFileText size={14} className="text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
             <p className="text-xs text-navy-900 dark:text-white truncate">{isArabic ? a.titleAr : a.titleEn}</p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {isArabic ? a.subjectAr : a.subjectEn}
              {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}` : ''}
             </p>
            </div>
           </li>
          ))}
         </ul>
        )}
       </motion.div>
      </div>
     </>
    )}
   </div>
  )
 })
