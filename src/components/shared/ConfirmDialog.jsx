import { memo, useState } from 'react'
import { FiAlertTriangle, FiLoader } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import Modal from '../ui/Modal'

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, variant = 'danger' }) {
  const { t } = useLanguage()
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    if (pending) return
    setPending(true)
    try {
      await onConfirm()
      onClose()
    } catch (_e) {
      // Failure is surfaced by the caller; keep the dialog open so the user
      // can retry instead of losing the pending action.
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={pending ? () => {} : onClose} size="sm" className="p-6" labelledBy="confirm-dialog-title">
      <div className="text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
          <FiAlertTriangle size={24} className={variant === 'danger' ? 'text-red-500' : 'text-yellow-500'} />
        </div>
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-ink mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-500 dark:text-white/70 rounded-lg text-sm font-medium transition disabled:opacity-50"
            autoFocus
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={pending}
            aria-busy={pending || undefined}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition text-white inline-flex items-center gap-2 disabled:opacity-60 ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            {pending && <FiLoader size={14} className="animate-spin" aria-hidden="true" />}
            {confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default memo(ConfirmDialog)
