import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { FiPlus, FiTrash2, FiSave, FiLink, FiBook, FiGrid } from 'react-icons/fi'
import { saveAdditions, saveStudyPlan, saveRoadmap, deleteAddition } from '../../services'
import ConfirmDialog from '../shared/ConfirmDialog'
import { INPUT_CLASS } from '../../utils/adminShared'

function SettingsPanel({ additions = [], studyPlan = {}, roadmap = [], loading, isArabic, onRefresh }) {
 const [showAdditionForm, setShowAdditionForm] = useState(false)
 const [additionEdit, setAdditionEdit] = useState([])

 const [showPlanForm, setShowPlanForm] = useState(false)
 const [planEdit, setPlanEdit] = useState([])

 const [showRoadmapForm, setShowRoadmapForm] = useState(false)
 const [roadmapEdit, setRoadmapEdit] = useState([])

 const [confirmDeleteId, setConfirmDeleteId] = useState(null)

 useEffect(() => {
  if (!showAdditionForm) {
   setAdditionEdit([])
  }
 }, [showAdditionForm])

 useEffect(() => {
  if (!showPlanForm) {
   setPlanEdit([])
  }
 }, [showPlanForm])

 useEffect(() => {
  if (!showRoadmapForm) {
   setRoadmapEdit([])
  }
 }, [showRoadmapForm])

 const addNewAddition = () => {
  const item = {
   id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
   type: 'post',
   subjectAr: '',
   subjectEn: '',
   titleAr: '',
   titleEn: '',
   descriptionAr: '',
   descriptionEn: '',
   url: '',
   createdAt: new Date().toISOString()
  }
  setAdditionEdit([item])
  setShowAdditionForm(true)
 }

 const updateAdditionField = (index, field, value) => {
  const updated = [...additionEdit]
  updated[index] = { ...updated[index], [field]: value }
  setAdditionEdit(updated)
 }

 const handleSaveAdditions = async () => {
  const valid = additionEdit.filter(x => x.subjectAr || x.subjectEn || x.titleAr || x.titleEn)
  if (valid.length === 0) {
   toast.error(isArabic ? 'أدخل بيانات الإضافة' : 'Enter addition data')
   return
  }
  try {
   await saveAdditions(valid)
   setShowAdditionForm(false)
   toast.success(isArabic ? 'تم حفظ الإضافات' : 'Additions saved')
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
  }
 }

 const handleDeleteAddition = async (id) => {
  setConfirmDeleteId(id)
 }

 const confirmDeleteAddition = async () => {
  if (!confirmDeleteId) return
  try {
   await deleteAddition(confirmDeleteId)
   toast.success(isArabic ? 'تم الحذف' : 'Deleted')
   setConfirmDeleteId(null)
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete')
  }
 }

 const addStudyPlanLink = () => {
  const existing = (studyPlan?.links || []).filter(x => (x.titleAr || '').trim() || (x.titleEn || '').trim())
  setPlanEdit([...existing, { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), titleAr: '', titleEn: '', url: '' }])
  setShowPlanForm(true)
 }

 const updatePlanField = (index, field, value) => {
  const updated = [...planEdit]
  updated[index] = { ...updated[index], [field]: value }
  setPlanEdit(updated)
 }

 const handleSaveStudyPlan = async () => {
  const valid = planEdit.filter(x => x.titleAr || x.titleEn)
  try {
   await saveStudyPlan({ links: valid })
   setShowPlanForm(false)
   toast.success(isArabic ? 'تم حفظ الخطة' : 'Plan saved')
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
  }
 }

 const addRoadmapItem = () => {
  setRoadmapEdit([...roadmap.map(r => ({ ...r })), { nameAr: '', nameEn: '', year: 1, semester: 1, order: 0, prerequisites: [], url: '' }])
  setShowRoadmapForm(true)
 }

 const updateRoadmapField = (index, field, value) => {
  const updated = [...roadmapEdit]
  updated[index] = { ...updated[index], [field]: value }
  setRoadmapEdit(updated)
 }

 const removeRoadmapItem = (index) => {
  setRoadmapEdit(roadmapEdit.filter((_, i) => i !== index))
 }

 const handleSaveRoadmap = async () => {
  const valid = roadmapEdit.filter(x => x.nameAr || x.nameEn)
  if (valid.length === 0) {
   toast.error(isArabic ? 'أدخل بيانات المادة' : 'Enter course data')
   return
  }
  try {
   await saveRoadmap(valid)
   setShowRoadmapForm(false)
   toast.success(isArabic ? 'تم حفظ المسار' : 'Roadmap saved')
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
  }
 }

 const existingPlanLinks = studyPlan?.links || []

 return (
  <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

   {/* ========== ADDITIONS ========== */}
   <div className="glass rounded-xl p-5 border border-white/10">
    <div className="flex justify-between items-center mb-4">
     <h3 className="font-bold text-sm text-navy-900 dark:text-white uppercase tracking-wider">{isArabic ? 'الإضافات' : 'Additions'}</h3>
     <button onClick={addNewAddition} className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition">
      <FiPlus size={14} /> {isArabic ? 'إضافة جديدة' : 'Add New'}
     </button>
    </div>

    <AnimatePresence>
     {showAdditionForm && additionEdit.length > 0 && (
      <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -10 }}
       transition={{ duration: 0.2 }}
       className="mb-4"
      >
        <div className="space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
         {additionEdit.map((item, idx) => (
          <div key={item.id} className="space-y-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'نوع الإضافة' : 'Type'}</label>
             <select value={item.type} onChange={e => updateAdditionField(idx, 'type', e.target.value)} className={INPUT_CLASS}>
              <option value="post">{isArabic ? 'منشور' : 'Post'}</option>
              <option value="whatsapp">{isArabic ? 'واتساب' : 'WhatsApp'}</option>
              <option value="video">{isArabic ? 'فيديو' : 'Video'}</option>
             </select>
            </div>
            <div>
             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'المادة (عربي)' : 'Subject (AR)'}</label>
             <input value={item.subjectAr} onChange={e => updateAdditionField(idx, 'subjectAr', e.target.value)} className={INPUT_CLASS} placeholder={isArabic ? 'المادة' : 'Subject'} />
            </div>
            <div>
             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'المادة (إنجليزي)' : 'Subject (EN)'}</label>
             <input value={item.subjectEn} onChange={e => updateAdditionField(idx, 'subjectEn', e.target.value)} className={INPUT_CLASS} placeholder="Subject" />
            </div>
            <div>
             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'العنوان (عربي)' : 'Title (AR)'}</label>
             <input value={item.titleAr} onChange={e => updateAdditionField(idx, 'titleAr', e.target.value)} className={INPUT_CLASS} placeholder={isArabic ? 'العنوان' : 'Title'} />
            </div>
            <div>
             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label>
             <input value={item.titleEn} onChange={e => updateAdditionField(idx, 'titleEn', e.target.value)} className={INPUT_CLASS} placeholder="Title" />
            </div>
           <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الوصف (عربي)' : 'Description (AR)'}</label>
            <textarea value={item.descriptionAr} onChange={e => updateAdditionField(idx, 'descriptionAr', e.target.value)} className={`${INPUT_CLASS} h-16 resize-none`} placeholder={isArabic ? 'الوصف' : 'Description'} />
           </div>
           <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
            <textarea value={item.descriptionEn} onChange={e => updateAdditionField(idx, 'descriptionEn', e.target.value)} className={`${INPUT_CLASS} h-16 resize-none`} placeholder="Description" />
           </div>
           <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الرابط' : 'URL'}</label>
            <input value={item.url} onChange={e => updateAdditionField(idx, 'url', e.target.value)} className={INPUT_CLASS} placeholder="https://..." />
           </div>
          </div>
         </div>
        ))}
        <div className="flex gap-3">
         <button onClick={handleSaveAdditions} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
          <FiSave size={14} /> {isArabic ? 'حفظ' : 'Save'}
         </button>
         <button onClick={() => setShowAdditionForm(false)} className="px-4 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm transition">
          {isArabic ? 'إلغاء' : 'Cancel'}
         </button>
        </div>
       </div>
      </motion.div>
     )}
    </AnimatePresence>

    {additions.length > 0 ? (
     <div className="space-y-2">
      {additions.map(a => (
       <div key={a.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-lg">
        <div className="min-w-0 flex-1">
         <p className="text-sm font-medium text-navy-900 dark:text-white truncate">{isArabic ? a.titleAr : a.titleEn}</p>
         <p className="text-xs text-slate-500 dark:text-slate-400 ">{isArabic ? a.subjectAr : a.subjectEn}</p>
        </div>
        <button onClick={() => handleDeleteAddition(a.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0" aria-label={isArabic ? 'حذف الإضافة' : 'Delete addition'}>
         <FiTrash2 size={14} />
        </button>
       </div>
      ))}
     </div>
    ) : !showAdditionForm && (
     <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{isArabic ? 'لا توجد إضافات' : 'No additions yet'}</p>
    )}
   </div>

   {/* ========== STUDY PLAN ========== */}
   <div className="glass rounded-xl p-5 border border-white/10">
    <div className="flex justify-between items-center mb-4">
     <h3 className="font-bold text-sm text-navy-900 dark:text-white uppercase tracking-wider">{isArabic ? 'الخطة الدراسية' : 'Study Plan'}</h3>
     <button onClick={addStudyPlanLink} className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition">
      <FiPlus size={14} /> {isArabic ? 'إضافة رابط' : 'Add Link'}
     </button>
    </div>

    <AnimatePresence>
     {showPlanForm && planEdit.length > 0 && (
      <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -10 }}
       transition={{ duration: 0.2 }}
       className="mb-4"
      >
       <div className="space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
        {planEdit.map((item, idx) => (
         <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={item.titleAr} onChange={e => updatePlanField(idx, 'titleAr', e.target.value)} className={INPUT_CLASS} placeholder={isArabic ? 'العنوان (عربي)' : 'Title (AR)'} />
          <input value={item.titleEn} onChange={e => updatePlanField(idx, 'titleEn', e.target.value)} className={INPUT_CLASS} placeholder={isArabic ? 'العنوان (إنجليزي)' : 'Title (EN)'} />
          <input value={item.url} onChange={e => updatePlanField(idx, 'url', e.target.value)} className={INPUT_CLASS} placeholder="URL" />
         </div>
        ))}
        <div className="flex gap-3">
         <button onClick={handleSaveStudyPlan} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
          <FiSave size={14} /> {isArabic ? 'حفظ' : 'Save'}
         </button>
         <button onClick={() => setShowPlanForm(false)} className="px-4 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm transition">
          {isArabic ? 'إلغاء' : 'Cancel'}
         </button>
        </div>
       </div>
      </motion.div>
     )}
    </AnimatePresence>

    {existingPlanLinks.length > 0 ? (
     <div className="space-y-2">
      {existingPlanLinks.map((link, i) => (
       <div key={link.id || i} className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-lg">
        <FiLink size={14} className="text-royal-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
         <p className="text-sm text-navy-900 dark:text-white truncate">{isArabic ? link.titleAr : link.titleEn}</p>
         {link.url && <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-royal-500 hover:underline truncate block">{link.url}</a>}
        </div>
       </div>
      ))}
     </div>
    ) : !showPlanForm && (
     <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{isArabic ? 'لا توجد روابط' : 'No links yet'}</p>
    )}
   </div>

   {/* ========== ROADMAP ========== */}
   <div className="glass rounded-xl p-5 border border-white/10">
    <div className="flex justify-between items-center mb-4">
     <h3 className="font-bold text-sm text-navy-900 dark:text-white uppercase tracking-wider">{isArabic ? 'المسار الدراسي' : 'Course Roadmap'}</h3>
     <button onClick={addRoadmapItem} className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition">
      <FiPlus size={14} /> {isArabic ? 'إضافة مادة' : 'Add Course'}
     </button>
    </div>

    <AnimatePresence>
     {showRoadmapForm && roadmapEdit.length > 0 && (
      <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -10 }}
       transition={{ duration: 0.2 }}
       className="mb-4"
      >
       <div className="space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
        {roadmapEdit.map((item, idx) => (
         <div key={idx} className="space-y-2 p-3 bg-white dark:bg-navy-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
           <span className="text-xs text-slate-500 dark:text-slate-400">{isArabic ? `مادة ${idx + 1}` : `Course ${idx + 1}`}</span>
           <button onClick={() => removeRoadmapItem(idx)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
            <FiTrash2 size={12} />
           </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <input value={item.nameAr || ''} onChange={e => updateRoadmapField(idx, 'nameAr', e.target.value)} className={INPUT_CLASS} placeholder={isArabic ? 'اسم المادة (عربي)' : 'Course Name (AR)'} />
           <input value={item.nameEn || ''} onChange={e => updateRoadmapField(idx, 'nameEn', e.target.value)} className={INPUT_CLASS} placeholder={isArabic ? 'اسم المادة (إنجليزي)' : 'Course Name (EN)'} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'السنة' : 'Year'}</label>
            <select value={item.year || 1} onChange={e => updateRoadmapField(idx, 'year', parseInt(e.target.value))} className={INPUT_CLASS}>
             {[1,2,3,4].map(y => <option key={y} value={y}>{isArabic ? `السنة ${y}` : `Year ${y}`}</option>)}
            </select>
           </div>
           <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الفصل' : 'Semester'}</label>
            <select value={item.semester || 1} onChange={e => updateRoadmapField(idx, 'semester', parseInt(e.target.value))} className={INPUT_CLASS}>
             {[1,2].map(s => <option key={s} value={s}>{isArabic ? `الفصل ${s}` : `Semester ${s}`}</option>)}
            </select>
           </div>
           <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الترتيب' : 'Order'}</label>
            <input type="number" value={item.order || 0} onChange={e => updateRoadmapField(idx, 'order', parseInt(e.target.value) || 0)} className={INPUT_CLASS} />
           </div>
           <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'رابط' : 'URL'}</label>
            <input value={item.url || ''} onChange={e => updateRoadmapField(idx, 'url', e.target.value)} className={INPUT_CLASS} placeholder="https://..." />
           </div>
          </div>
          <div>
           <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'المتطلبات السابقة' : 'Prerequisites'}</label>
           <input value={(item.prerequisites || []).join(', ')} onChange={e => updateRoadmapField(idx, 'prerequisites', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className={INPUT_CLASS} placeholder={isArabic ? 'مفصل بفاصلة' : 'Comma separated'} />
          </div>
         </div>
        ))}
        <div className="flex gap-3">
         <button onClick={handleSaveRoadmap} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
          <FiSave size={14} /> {isArabic ? 'حفظ' : 'Save'}
         </button>
         <button onClick={() => setShowRoadmapForm(false)} className="px-4 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm transition">
          {isArabic ? 'إلغاء' : 'Cancel'}
         </button>
        </div>
       </div>
      </motion.div>
     )}
    </AnimatePresence>

    {roadmap.length > 0 ? (
     <div className="space-y-2">
      {roadmap.map((item, i) => (
       <div key={i} className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-lg">
        <FiGrid size={14} className="text-cyan-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
         <p className="text-sm font-medium text-navy-900 dark:text-white truncate">{isArabic ? item.nameAr : item.nameEn}</p>
         <p className="text-xs text-slate-500 dark:text-slate-400 ">
          {isArabic ? `السنة ${item.year} - الفصل ${item.semester}` : `Year ${item.year} - Semester ${item.semester}`}
          {item.prerequisites?.length > 0 && ` • ${isArabic ? 'متطلبات' : 'Prereqs'}: ${item.prerequisites.length}`}
         </p>
        </div>
       </div>
      ))}
     </div>
    ) : !showRoadmapForm && (
     <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{isArabic ? 'لا توجد مواد' : 'No courses yet'}</p>
    )}
   </div>
   <ConfirmDialog
    isOpen={!!confirmDeleteId}
    onClose={() => setConfirmDeleteId(null)}
    onConfirm={confirmDeleteAddition}
    title={isArabic ? 'تأكيد الحذف' : 'Confirm Deletion'}
    message={isArabic ? 'هل أنت متأكد من حذف هذا العنصر؟' : 'Are you sure you want to delete this item?'}
    confirmText={isArabic ? 'حذف' : 'Delete'}
    cancelText={isArabic ? 'إلغاء' : 'Cancel'}
    variant="danger"
   />
  </motion.div>
 )
}

export default memo(SettingsPanel)
