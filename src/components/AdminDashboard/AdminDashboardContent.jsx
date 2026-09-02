import { useState, useMemo, useRef, useCallback, memo } from 'react'
import { FiX, FiUpload, FiFile, FiTrash2, FiCheck, FiLoader, FiAlertCircle, FiYoutube } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { addCourse, updateCourse, addLecture, updateLecture, addSource, updateSource } from '../../services'
import { useFileUpload } from '../../hooks/useFileUpload'
import { formatBytes } from '../../services/sourceStorage'
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
import CourseProfileModal from './CourseProfileModal'
import OverviewPanel from './OverviewPanel'
import { INPUT_CLASS } from '../../utils/adminShared'
import { computeActiveStudents, computeNewStudents } from '../../utils/adminStatsLogic'
import { useLanguage } from '../../context/LanguageContext'

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
} ) {
 const { t } = useLanguage()
  const [showCourseForm, setShowCourseForm] = useState(false)
 const [editingCourseId, setEditingCourseId] = useState(null)
 const [courseForm, setCourseForm] = useState({ nameAr: '', nameEn: '', doctorAr: '', doctorEn: '' })
 const courseFormRef = useRef(null)

 const [showLectureForm, setShowLectureForm] = useState(false)
 const [editingLectureId, setEditingLectureId] = useState(null)
 const [lectureForm, setLectureForm] = useState({ titleAr: '', titleEn: '', url: '', date: new Date().toISOString().slice(0, 10), subjectAr: '', subjectEn: '', videoId: '', sortOrder: 0, doctorAr: '', doctorEn: '' })
  const [lectureCourseId, setLectureCourseId] = useState('')
  const [lectureCustomSubject, setLectureCustomSubject] = useState(false)
  const [lectureCourseSearch, setLectureCourseSearch] = useState('')
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
   toast.error(t('inline.admin-dashboard-content.enter-course-name'))
   return
  }
  try {
   if (editingCourseId) {
    await updateCourse(editingCourseId, courseForm)
    toast.success(t('inline.admin-dashboard-content.course-updated'))
   } else {
    await addCourse({ ...courseForm, lectures: [], sources: [] })
    toast.success(t('inline.admin-dashboard-content.course-created'))
   }
   setCourseForm({ nameAr: '', nameEn: '', doctorAr: '', doctorEn: '' })
   setEditingCourseId(null)
   setShowCourseForm(false)
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('inline.admin-dashboard-content.failed-to-save-course'))
  }
 }

 const saveLecture = async () => {
  if (!lectureForm.titleAr && !lectureForm.titleEn) {
   toast.error(t('inline.admin-dashboard-content.enter-lecture-title'))
   return
  }
  try {
   const data = { ...lectureForm }
   const videoId = extractYouTubeId(lectureForm.url)
   if (videoId) data.videoId = videoId
   if (lectureCourseId && lectureCourseId !== '__custom__') data.courseId = lectureCourseId
   if (editingLectureId) {
    await updateLecture(editingLectureId, data)
    toast.success(t('inline.admin-dashboard-content.lecture-updated'))
   } else {
    await addLecture(data)
    toast.success(t('inline.admin-dashboard-content.lecture-created'))
   }
    setLectureForm({ titleAr: '', titleEn: '', url: '', date: new Date().toISOString().slice(0, 10), subjectAr: '', subjectEn: '', videoId: '', sortOrder: 0, doctorAr: '', doctorEn: '' })
    setLectureCourseId('')
    setLectureCourseSearch('')
    setLectureCustomSubject(false)
    setEditingLectureId(null)
    setShowLectureForm(false)
    if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('inline.admin-dashboard-content.failed-to-save-lecture'))
  }
 }

 const saveSource = async () => {
  if (!sourceForm.titleAr && !sourceForm.titleEn) {
   toast.error(t('inline.admin-dashboard-content.enter-source-title'))
   return
  }
  if (!sourceForm.url && sourceUpload.files.length === 0 && !sourceForm.fileData) {
   toast.error(t('inline.admin-dashboard-content.enter-a-url-or'))
   return
  }
  if (sourceUpload.uploading) {
   toast.error(t('inline.admin-dashboard-content.please-wait-for-uploads'))
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
    toast.success(t('inline.admin-dashboard-content.source-updated'))
   } else {
    await addSource(data)
    toast.success(t('inline.admin-dashboard-content.source-created'))
   }
   setSourceForm({ titleAr: '', titleEn: '', url: '', subjectAr: '', subjectEn: '', fileData: null, fileName: '', files: [] })
   sourceUpload.reset()
   setEditingSourceId(null)
   setShowSourceForm(false)
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('inline.admin-dashboard-content.failed-to-save-source'))
  }
 }

  const handleSourceFiles = async (e) => {
   const fileList = e.target.files
   if (!fileList?.length) return
   await sourceUpload.uploadFiles(fileList, isArabic)
   e.target.value = ''
  }

  const [profileCourse, setProfileCourse] = useState(null)

  const activeStudents = useMemo(() => computeActiveStudents(users, studentLogs), [users, studentLogs])

  const newStudents = useMemo(() => computeNewStudents(users), [users])

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
       ? (t('inline.admin-dashboard-content.edit-course'))
       : (t('inline.admin-dashboard-content.add-new-course'))}
      onClose={() => { setShowCourseForm(false); setEditingCourseId(null) }}
      isArabic={isArabic}
     >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <FormField
        label={t('inline.admin-dashboard-content.name-ar')}
        value={courseForm.nameAr}
        onChange={e => setCourseForm({ ...courseForm, nameAr: e.target.value })}
        placeholder={t('inline.admin-dashboard-content.course-name-in-arabic')}
       />
       <FormField
        label={t('inline.admin-dashboard-content.name-en')}
        value={courseForm.nameEn}
        onChange={e => setCourseForm({ ...courseForm, nameEn: e.target.value })}
        placeholder="Course name in English"
       />
       <FormField
        label={t('inline.admin-dashboard-content.doctor-ar')}
        value={courseForm.doctorAr}
        onChange={e => setCourseForm({ ...courseForm, doctorAr: e.target.value })}
        placeholder={t('inline.admin-dashboard-content.doctor-name-in-arabic')}
       />
       <FormField
        label={t('inline.admin-dashboard-content.doctor-en')}
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
       ? (t('inline.admin-dashboard-content.edit-lecture'))
       : (t('inline.admin-dashboard-content.add-new-lecture'))}
      onClose={() => { setShowLectureForm(false); setEditingLectureId(null); setLectureCourseSearch('') }}
      isArabic={isArabic}
     >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
         <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.admin-dashboard-content.course-subject')}</label>
         {!lectureCustomSubject ? (
          <div className="flex gap-2 flex-col sm:flex-row">
           <div className="relative flex-1">
            <input
             value={lectureCourseSearch}
             onChange={e => setLectureCourseSearch(e.target.value)}
             placeholder={t('inline.admin-dashboard-content.search-courses')}
             aria-label={t('inline.admin-dashboard-content.search-courses-2')}
             className={`${INPUT_CLASS} mb-1.5 sm:mb-0`}
            />
           </div>
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
            <option value="">{t('inline.admin-dashboard-content.select-course')}</option>
            {courses
             .filter(c => {
              const q = lectureCourseSearch.toLowerCase()
              return !q || c.nameAr?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q)
             })
             .map(c => (
              <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.nameEn}</option>
             ))}
            <option value="__custom__">{t('inline.admin-dashboard-content.other-custom')}</option>
           </select>
          </div>
         ) : (
         <div className="space-y-2">
          <div className="flex gap-2">
           <input
            value={lectureForm.subjectAr}
            onChange={e => setLectureForm({ ...lectureForm, subjectAr: e.target.value })}
            className={INPUT_CLASS}
            placeholder={t('inline.admin-dashboard-content.subject-name-ar')}
           />
           <input
            value={lectureForm.subjectEn}
            onChange={e => setLectureForm({ ...lectureForm, subjectEn: e.target.value })}
            className={INPUT_CLASS}
            placeholder={t('inline.admin-dashboard-content.subject-name-en')}
           />
           <button
            onClick={() => { setLectureCustomSubject(false); setLectureCourseId('') }}
            className="px-3 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm transition flex-shrink-0"
            title={t('inline.admin-dashboard-content.back-to-list')}
           >
            <FiX size={14} />
           </button>
          </div>
         </div>
        )}
        {lectureForm.subjectAr && (
         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('inline.admin-dashboard-content.subject')} {isArabic ? lectureForm.subjectAr : lectureForm.subjectEn}
         </p>
        )}
       </div>
       <FormField
        label={t('inline.admin-dashboard-content.title-ar')}
        value={lectureForm.titleAr}
        onChange={e => setLectureForm({ ...lectureForm, titleAr: e.target.value })}
        placeholder={t('inline.admin-dashboard-content.lecture-title-in-arabic')}
       />
<FormField
         label={t('inline.admin-dashboard-content.title-en')}
         value={lectureForm.titleEn}
         onChange={e => setLectureForm({ ...lectureForm, titleEn: e.target.value })}
         placeholder="Lecture title in English"
        />
        <div className="md:col-span-2 space-y-2">
         <FormField
          label={t('inline.admin-dashboard-content.video-url')}
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
             <FiYoutube size={14} /> {t('inline.admin-dashboard-content.video-detected')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">ID: {lectureForm.videoId}</p>
           </div>
          </div>
         )}
         {lectureForm.url && !lectureForm.videoId && (
          <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
           <FiAlertCircle size={12} /> {t('inline.admin-dashboard-content.invalid-youtube-url-thumbnail')}
          </p>
         )}
        </div>
        <FormField
         label={t('inline.admin-dashboard-content.date')}
         type="date"
         value={lectureForm.date}
         onChange={e => setLectureForm({ ...lectureForm, date: e.target.value })}
        />
        <FormField
         label={t('inline.admin-dashboard-content.order-smaller-first')}
         type="number"
         value={lectureForm.sortOrder}
         onChange={e => setLectureForm({ ...lectureForm, sortOrder: parseInt(e.target.value) || 0 })}
         placeholder="0"
        />
        <FormField
         label={t('inline.admin-dashboard-content.doctor-ar')}
         value={lectureForm.doctorAr}
         onChange={e => setLectureForm({ ...lectureForm, doctorAr: e.target.value })}
         placeholder={t('inline.admin-dashboard-content.doctor-name')}
        />
        <FormField
         label={t('inline.admin-dashboard-content.doctor-en')}
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
    setLectureCourseSearch('')
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
       ? (t('inline.admin-dashboard-content.edit-source'))
       : (t('inline.admin-dashboard-content.add-new-source'))}
      onClose={() => { setShowSourceForm(false); setEditingSourceId(null) }}
      isArabic={isArabic}
     >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <FormField
        label={t('inline.admin-dashboard-content.subject-ar')}
        value={sourceForm.subjectAr}
        onChange={e => setSourceForm({ ...sourceForm, subjectAr: e.target.value })}
        placeholder={t('inline.admin-dashboard-content.subject-name')}
       />
       <FormField
        label={t('inline.admin-dashboard-content.subject-en')}
        value={sourceForm.subjectEn}
        onChange={e => setSourceForm({ ...sourceForm, subjectEn: e.target.value })}
        placeholder="Subject name"
       />
       <FormField
        label={t('inline.admin-dashboard-content.title-ar')}
        value={sourceForm.titleAr}
        onChange={e => setSourceForm({ ...sourceForm, titleAr: e.target.value })}
        placeholder={t('inline.admin-dashboard-content.source-title')}
       />
       <FormField
        label={t('inline.admin-dashboard-content.title-en')}
        value={sourceForm.titleEn}
        onChange={e => setSourceForm({ ...sourceForm, titleEn: e.target.value })}
        placeholder="Source title"
       />
       <FormField
        label={t('inline.admin-dashboard-content.url')}
        value={sourceForm.url}
        onChange={e => setSourceForm({ ...sourceForm, url: e.target.value })}
        placeholder="https://..."
        className="md:col-span-2"
        disabled={sourceUpload.files.length > 0}
       />
       <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
         {t('inline.admin-dashboard-content.upload-one-or-more')}
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
          {t('inline.admin-dashboard-content.uploading')}
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
              aria-label={t('inline.admin-dashboard-content.remove')}
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
           <FiUpload size={14} /> {t('inline.admin-dashboard-content.add-another-file')}
          </button>
         </div>
        ) : (
         <button
          type="button"
          onClick={() => sourceFileRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-royal-400 hover:text-royal-500 transition-colors text-sm"
         >
          <FiUpload size={20} />
          <span>{t('inline.admin-dashboard-content.drop-files-or-click')}</span>
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
    <OverviewPanel
     courses={courses}
     lectures={lectures}
     activityLogs={activityLogs}
     additions={additions}
     activeStudents={activeStudents}
     newStudents={newStudents}
     overviewStats={overviewStats}
     isArabic={isArabic}
     onNavigate={onNavigate}
     onCourseClick={setProfileCourse}
     onRefresh={onRefresh}
    />
   )}

     <CourseProfileModal
      course={profileCourse}
      lectures={lectures}
      sources={sources}
      isOpen={!!profileCourse}
      onClose={() => setProfileCourse(null)}
     />
    </div>
   )
  })
