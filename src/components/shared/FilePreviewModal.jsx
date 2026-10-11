import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiDownload, FiExternalLink, FiMaximize2, FiMinimize2, FiFileText, FiImage, FiFile, FiCopy, FiCheck } from 'react-icons/fi'
import { useScrollLock } from '../../hooks/useScrollLock'
import toast from 'react-hot-toast'

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
  isArabic = true,
}) {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [copied, setCopied] = useState(false)

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) {
      setIsFullScreen(false)
      setCopied(false)
      return
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !file) return null

  const fileName = file.name || 'ملف دراسي'
  const fileUrl = file.url || ''
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const isPdf = ext === 'pdf' || fileUrl.includes('.pdf')
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)

  const handleCopyLink = () => {
    if (fileUrl) {
      navigator.clipboard.writeText(fileUrl)
      setCopied(true)
      toast.success(isArabic ? 'تم نسخ الرابط بنجاح' : 'Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white dark:bg-navy-900 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullScreen
              ? 'w-full h-full rounded-none'
              : 'w-full max-w-5xl h-[88vh]'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={fileName}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-2 rounded-lg bg-royal-500/10 text-royal-600 dark:text-cyan-400 shrink-0">
                {isPdf ? <FiFileText size={18} /> : isImage ? <FiImage size={18} /> : <FiFile size={18} />}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-ink truncate" title={fileName}>
                  {fileName}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-white/50 block">
                  {isPdf ? 'مستند PDF معتمد' : isImage ? 'صورة توضيحية' : 'ملف مرفق'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {fileUrl && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl text-slate-500 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
                  title={isArabic ? 'نسخ الرابط' : 'Copy link'}
                  aria-label={isArabic ? 'نسخ الرابط' : 'Copy link'}
                >
                  {copied ? <FiCheck size={16} className="text-emerald-500" /> : <FiCopy size={16} />}
                </button>
              )}

              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <FiDownload size={14} />
                  <span className="hidden sm:inline">{isArabic ? 'تحميل' : 'Download'}</span>
                </button>
              )}

              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-slate-500 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
                  title={isArabic ? 'فتح في لسان جديد' : 'Open in new tab'}
                  aria-label={isArabic ? 'فتح في لسان جديد' : 'Open in new tab'}
                >
                  <FiExternalLink size={16} />
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-xl text-slate-500 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:inline-flex"
                title={isFullScreen ? (isArabic ? 'تصغير' : 'Exit Fullscreen') : (isArabic ? 'ملء الشاشة' : 'Fullscreen')}
                aria-label={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullScreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                title={isArabic ? 'إغلاق' : 'Close'}
                aria-label={isArabic ? 'إغلاق' : 'Close'}
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Viewer Area */}
          <div className="flex-1 bg-slate-100 dark:bg-black/40 overflow-hidden relative flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0`}
                title={fileName}
                className="w-full h-full border-0"
              />
            ) : isImage ? (
              <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-royal-500/10 text-accent flex items-center justify-center mx-auto">
                  <FiFileText size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-ink text-base mb-1">{fileName}</h4>
                  <p className="text-xs text-slate-500 dark:text-white/50 max-w-sm mx-auto">
                    {isArabic
                      ? 'هذا النوع من الملفات يمكن معاينته مباشرة عن طريق تحميله على جهازك.'
                      : 'This file format can be previewed directly by downloading it.'}
                  </p>
                </div>
                {onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-semibold text-sm transition shadow-lg shadow-royal-600/25"
                  >
                    <FiDownload size={16} />
                    <span>{isArabic ? 'تحميل الملف الآن' : 'Download File'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
