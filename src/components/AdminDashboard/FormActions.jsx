import { FiSave } from 'react-icons/fi'

export default function FormActions({ onSave, onCancel, isEditing, isArabic }) {
 return (
  <div className="flex gap-3 mt-4">
   <button type="button" onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
    <FiSave size={14} /> {isEditing ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'حفظ' : 'Save')}
   </button>
   <button type="button" onClick={onCancel} className="px-4 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm transition">
    {isArabic ? 'إلغاء' : 'Cancel'}
   </button>
  </div>
 )
}
