import { useId } from 'react'
import { INPUT_CLASS } from '../../utils/adminShared'

export default function FormField({ label, value, onChange, placeholder, type = 'text', className = '', ...props }) {
 const id = useId()
 return (
  <div className={className}>
   <label htmlFor={id} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
   <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    className={INPUT_CLASS}
    placeholder={placeholder}
    aria-label={label || placeholder}
    {...props}
   />
  </div>
 )
}
